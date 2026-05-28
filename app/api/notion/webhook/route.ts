/* eslint-disable */
import { createHmac, timingSafeEqual } from "node:crypto";

import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getNotionClient } from "@/lib/notion";
import { handleNotionRoomWebhook } from "@/lib/notion-room/webhook";

export const runtime = "nodejs";

type WebhookEntityType = "page" | "database" | "data_source" | "block";

type NotionWebhookPayload = {
  verification_token?: string;
  type?: string;
  timestamp?: string;
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

type ContentScope =
  | "docs"
  | "events"
  | "kkm"
  | "karya"
  | "faq"
  | "profil"
  | "beranda";

const BERANDA_DB_ID = process.env.NOTION_BERANDA_DATABASE_ID ?? "";
const PROFIL_DB_ID = process.env.NOTION_PROFIL_DATABASE_ID ?? "";
const DOCS_DB_ID =
  process.env.NOTION_SEKRETARIAT_DATABASE_ID ??
  process.env.NOTION_PROJECT_DATABASE_ID ??
  "";
const KKM_DB_ID = process.env.NOTION_KKM_DATABASE_ID ?? "";
const AGENDA_DB_ID =
  process.env.NOTION_AGENDA_DATABASE_ID ??
  process.env.NOTION_EVENTS_DATABASE_ID ??
  "";
const KARYA_DB_ID = process.env.NOTION_KARYA_DATABASE_ID ?? "";
const FAQ_DB_ID = process.env.NOTION_FAQ_DATABASE_ID ?? "";

const dataSourceIdCache = new Map<string, string | null>();
const parentChainCache = new Map<
  string,
  { databaseId: string | null; dataSourceId: string | null }
>();

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
    const client = getNotionClient();
    if (!client) return null;

    const database = await client.databases.retrieve({
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
  const [
    docsDataSourceId,
    eventsDataSourceId,
    kkmDataSourceId,
    karyaDataSourceId,
    faqDataSourceId,
    profilDataSourceId,
    berandaDataSourceId,
  ] = await Promise.all([
    resolvePrimaryDataSourceId(DOCS_DB_ID),
    resolvePrimaryDataSourceId(AGENDA_DB_ID),
    resolvePrimaryDataSourceId(KKM_DB_ID),
    resolvePrimaryDataSourceId(KARYA_DB_ID),
    resolvePrimaryDataSourceId(FAQ_DB_ID),
    resolvePrimaryDataSourceId(PROFIL_DB_ID),
    resolvePrimaryDataSourceId(BERANDA_DB_ID),
  ]);

  return {
    docs: {
      databaseId: DOCS_DB_ID ? normalizeNotionId(DOCS_DB_ID) : null,
      dataSourceId: docsDataSourceId,
    },
    events: {
      databaseId: AGENDA_DB_ID ? normalizeNotionId(AGENDA_DB_ID) : null,
      dataSourceId: eventsDataSourceId,
    },
    kkm: {
      databaseId: KKM_DB_ID ? normalizeNotionId(KKM_DB_ID) : null,
      dataSourceId: kkmDataSourceId,
    },
    karya: {
      databaseId: KARYA_DB_ID ? normalizeNotionId(KARYA_DB_ID) : null,
      dataSourceId: karyaDataSourceId,
    },
    faq: {
      databaseId: FAQ_DB_ID ? normalizeNotionId(FAQ_DB_ID) : null,
      dataSourceId: faqDataSourceId,
    },
    profil: {
      databaseId: PROFIL_DB_ID ? normalizeNotionId(PROFIL_DB_ID) : null,
      dataSourceId: profilDataSourceId,
    },
    beranda: {
      databaseId: BERANDA_DB_ID ? normalizeNotionId(BERANDA_DB_ID) : null,
      dataSourceId: berandaDataSourceId,
    },
  };
}

type ScopeHints = {
  databaseId: string | null;
  dataSourceId: string | null;
};

type ParentRef = {
  type?: string;
  id?: string;
  data_source_id?: string;
};

function emptyScopeHints(): ScopeHints {
  return { databaseId: null, dataSourceId: null };
}

function cacheScopeHints(key: string, hints: ScopeHints): ScopeHints {
  parentChainCache.set(key, hints);
  return hints;
}

async function resolveParentScopeHints(
  parent: ParentRef | null | undefined,
  depth = 0,
): Promise<ScopeHints> {
  if (!parent || depth > 8) {
    return emptyScopeHints();
  }

  const parentType = parent.type?.trim();
  const parentId = parent.id?.trim();
  const parentDataSourceId = parent.data_source_id?.trim();

  if (parentDataSourceId) {
    return {
      databaseId:
        parentType === "database" && parentId
          ? normalizeNotionId(parentId)
          : null,
      dataSourceId: normalizeNotionId(parentDataSourceId),
    };
  }

  if (!parentType || !parentId) {
    return emptyScopeHints();
  }

  const normalizedParentId = normalizeNotionId(parentId);
  const cacheKey = `${parentType}:${normalizedParentId}`;
  const cached = parentChainCache.get(cacheKey);
  if (cached) return cached;

  if (parentType === "database") {
    return cacheScopeHints(cacheKey, {
      databaseId: normalizedParentId,
      dataSourceId: await resolvePrimaryDataSourceId(normalizedParentId),
    });
  }

  if (parentType === "data_source") {
    return cacheScopeHints(cacheKey, {
      databaseId: null,
      dataSourceId: normalizedParentId,
    });
  }

  try {
    const client = getNotionClient();
    if (!client) return emptyScopeHints();

    if (parentType === "page") {
      const page = (await client.pages.retrieve({
        page_id: normalizedParentId,
      })) as { parent?: ParentRef };
      const hints = await resolveParentScopeHints(page.parent, depth + 1);
      return cacheScopeHints(cacheKey, hints);
    }

    if (parentType === "block") {
      const block = (await client.blocks.retrieve({
        block_id: normalizedParentId,
      })) as { parent?: ParentRef };
      const hints = await resolveParentScopeHints(block.parent, depth + 1);
      return cacheScopeHints(cacheKey, hints);
    }
  } catch (error) {
    console.error("Failed to resolve Notion parent scope hints:", {
      parentType,
      parentId: normalizedParentId,
      error,
    });
  }

  return cacheScopeHints(cacheKey, emptyScopeHints());
}

async function resolveEntityScopeHints(
  entity: NotionWebhookPayload["entity"],
): Promise<ScopeHints> {
  if (!entity?.type || !entity.id) {
    return emptyScopeHints();
  }

  return resolveParentScopeHints(
    {
      type: entity.type,
      id: entity.id,
    },
    0,
  );
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
    revalidatePath("/agenda");
    revalidatePath("/agenda/[slug]", "page");
    revalidatePath("/agenda/repost/[slug]", "page");
    return;
  }

  if (scope === "kkm") {
    revalidateTag("notion-kkm", { expire: 0 });
    revalidatePath("/kkm");
    revalidatePath("/kkm/[slug]", "page");
    revalidatePath("/agenda");
    return;
  }

  if (scope === "karya") {
    revalidateTag("notion-karya", { expire: 0 });
    revalidatePath("/karya");
    return;
  }

  if (scope === "faq") {
    revalidateTag("notion-faq", { expire: 0 });
    revalidatePath("/faq");
    return;
  }

  if (scope === "profil") {
    revalidateTag("notion-profil", { expire: 0 });
    revalidatePath("/profil");
    return;
  }

  if (scope === "beranda") {
    revalidateTag("notion-beranda", { expire: 0 });
    revalidatePath("/");
    return;
  }
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
  const entityScopeHints = await resolveEntityScopeHints(payload.entity);
  const parentScopeHints = await resolveParentScopeHints(payload.data?.parent);

  for (const scope of [
    "docs",
    "events",
    "kkm",
    "karya",
    "faq",
    "profil",
    "beranda",
  ] as const) {
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

    if (
      parentScopeHints.dataSourceId &&
      matcher.dataSourceId === parentScopeHints.dataSourceId
    ) {
      scopeSet.add(scope);
    }

    if (
      parentScopeHints.databaseId &&
      matcher.databaseId === parentScopeHints.databaseId
    ) {
      scopeSet.add(scope);
    }

    if (
      entityScopeHints.dataSourceId &&
      matcher.dataSourceId === entityScopeHints.dataSourceId
    ) {
      scopeSet.add(scope);
    }

    if (
      entityScopeHints.databaseId &&
      matcher.databaseId === entityScopeHints.databaseId
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
  return handleNotionRoomWebhook(request);

  /*
  const rawBody = await request.text();
  ...
  */
}
