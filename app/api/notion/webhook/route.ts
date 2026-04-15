import { createHmac, timingSafeEqual } from "node:crypto";

import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getNotionClient } from "@/lib/notion";

export const runtime = "nodejs";

type WebhookEntityType = "page" | "database" | "data_source" | "block";

type NotionWebhookPayload = {
  verification_token?: string;
  type?: string;
  entity?: {
    id?: string;
    type?: WebhookEntityType;
  };
  data?: {
    parent?: {
      id?: string;
      type?: string;
      data_source_id?: string;
    };
  };
};

type ContentScope = "docs" | "events" | "kkm";

const DOCS_DB_ID =
  process.env.NOTION_SEKRETARIAT_DATABASE_ID ??
  process.env.NOTION_PROJECT_DATABASE_ID ??
  "";
const KKM_DB_ID = process.env.NOTION_KKM_DATABASE_ID ?? "";
const EVENTS_DB_ID = process.env.NOTION_EVENTS_DATABASE_ID ?? "";

const dataSourceIdCache = new Map<string, string | null>();

function normalizeNotionId(id: string): string {
  const compact = id.replace(/-/g, "");
  if (!/^[0-9a-fA-F]{32}$/.test(compact)) return id;
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
}

async function resolvePrimaryDataSourceId(
  databaseId: string,
): Promise<string | null> {
  if (!databaseId) return null;

  const normalizedId = normalizeNotionId(databaseId);
  const cached = dataSourceIdCache.get(normalizedId);
  if (cached !== undefined) return cached;

  try {
    const database = await getNotionClient().databases.retrieve({
      database_id: normalizedId,
    });
    const dataSourceId = (database as { data_sources?: Array<{ id: string }> })
      .data_sources?.[0]?.id;

    const normalizedDataSourceId = dataSourceId
      ? normalizeNotionId(dataSourceId)
      : null;
    dataSourceIdCache.set(normalizedId, normalizedDataSourceId);
    return normalizedDataSourceId;
  } catch (error) {
    console.error("Failed to resolve Notion data source id:", error);
    dataSourceIdCache.set(normalizedId, null);
    return null;
  }
}

async function buildScopeMatchers() {
  const [docsDataSourceId, eventsDataSourceId, kkmDataSourceId] =
    await Promise.all([
      resolvePrimaryDataSourceId(DOCS_DB_ID),
      resolvePrimaryDataSourceId(EVENTS_DB_ID),
      resolvePrimaryDataSourceId(KKM_DB_ID),
    ]);

  return {
    docs: {
      databaseId: DOCS_DB_ID ? normalizeNotionId(DOCS_DB_ID) : null,
      dataSourceId: docsDataSourceId,
    },
    events: {
      databaseId: EVENTS_DB_ID ? normalizeNotionId(EVENTS_DB_ID) : null,
      dataSourceId: eventsDataSourceId,
    },
    kkm: {
      databaseId: KKM_DB_ID ? normalizeNotionId(KKM_DB_ID) : null,
      dataSourceId: kkmDataSourceId,
    },
  };
}

function verifySignature(rawBody: string, signature: string, secret: string) {
  const expectedSignature = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function revalidateScope(scope: ContentScope) {
  if (scope === "docs") {
    revalidateTag("notion-docs", { expire: 0 });
    revalidateTag("notion-archives", { expire: 0 });
    revalidatePath("/sekretariat");
    revalidatePath("/sekretariat/[slug]", "page");
    revalidatePath("/sekretariat/archives");
    revalidatePath("/sekretariat/archives/[id]", "page");
    return;
  }

  if (scope === "events") {
    revalidateTag("notion-events", { expire: 0 });
    revalidatePath("/events");
    revalidatePath("/events/[slug]", "page");
    revalidatePath("/events/repost/[slug]", "page");
    return;
  }

  revalidateTag("notion-kkm", { expire: 0 });
  revalidatePath("/kkm");
  revalidatePath("/kkm/[slug]", "page");
  revalidatePath("/events");
}

async function inferScopes(
  payload: NotionWebhookPayload,
): Promise<ContentScope[]> {
  const matches = await buildScopeMatchers();
  const scopeSet = new Set<ContentScope>();
  const normalizedEntityId = payload.entity?.id
    ? normalizeNotionId(payload.entity.id)
    : null;
  const normalizedParentId = payload.data?.parent?.id
    ? normalizeNotionId(payload.data.parent.id)
    : null;
  const normalizedParentDataSourceId = payload.data?.parent?.data_source_id
    ? normalizeNotionId(payload.data.parent.data_source_id)
    : null;

  for (const scope of ["docs", "events", "kkm"] as const) {
    const matcher = matches[scope];

    if (
      normalizedParentDataSourceId &&
      matcher.dataSourceId === normalizedParentDataSourceId
    ) {
      scopeSet.add(scope);
    }

    if (payload.entity?.type === "data_source" && normalizedEntityId) {
      if (matcher.dataSourceId === normalizedEntityId) {
        scopeSet.add(scope);
      }
    }

    if (payload.entity?.type === "database" && normalizedEntityId) {
      if (matcher.databaseId === normalizedEntityId) {
        scopeSet.add(scope);
      }
    }

    if (
      payload.data?.parent?.type === "database" &&
      normalizedParentId &&
      matcher.databaseId === normalizedParentId
    ) {
      scopeSet.add(scope);
    }
  }

  return [...scopeSet];
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  let payload: NotionWebhookPayload;
  try {
    payload = rawBody ? (JSON.parse(rawBody) as NotionWebhookPayload) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const verificationToken = payload.verification_token?.trim();
  if (verificationToken) {
    console.warn(
      "Notion webhook verification token received. Save as NOTION_WEBHOOK_VERIFICATION_TOKEN before production events.",
      { verificationToken },
    );

    return NextResponse.json({
      ok: true,
      verificationTokenReceived: true,
    });
  }

  const storedVerificationToken =
    process.env.NOTION_WEBHOOK_VERIFICATION_TOKEN?.trim();
  const signature = request.headers.get("x-notion-signature")?.trim();

  if (!storedVerificationToken) {
    console.error(
      "Missing NOTION_WEBHOOK_VERIFICATION_TOKEN. Verification request likely succeeded, but signed events will be rejected until secret is configured.",
    );
    return NextResponse.json(
      { error: "Missing NOTION_WEBHOOK_VERIFICATION_TOKEN" },
      { status: 503 },
    );
  }

  if (
    !signature ||
    !verifySignature(rawBody, signature, storedVerificationToken)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const scopes = await inferScopes(payload);
  scopes.forEach(revalidateScope);

  const eventSummary = {
    type: payload.type ?? null,
    entityType: payload.entity?.type ?? null,
    entityId: payload.entity?.id ?? null,
    parentType: payload.data?.parent?.type ?? null,
    parentId: payload.data?.parent?.id ?? null,
    parentDataSourceId: payload.data?.parent?.data_source_id ?? null,
    revalidatedScopes: scopes,
  };

  if (scopes.length === 0) {
    console.error(
      "Notion webhook received but matched no site scope.",
      eventSummary,
    );
  } else {
    console.warn("Notion webhook revalidated scope(s).", eventSummary);
  }

  return NextResponse.json({
    ok: true,
    receivedType: payload.type ?? null,
    revalidatedScopes: scopes,
  });
}
