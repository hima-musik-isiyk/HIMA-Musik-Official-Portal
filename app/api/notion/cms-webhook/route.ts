import { createHmac, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { revalidateCmsCaches } from "@/lib/cms-sync";
import {
  recordCmsSyncEvent,
  updateCmsSyncEventStatus,
} from "@/lib/cms-sync-events";
import { syncContainerCMSSnapshot } from "@/lib/notion-builder";

type NotionWebhookEntity = {
  id?: string;
  type?: string;
};

type NotionWebhookEvent = {
  id?: string;
  type?: string;
  timestamp?: string;
  created_time?: string;
  entity?: NotionWebhookEntity;
  data?: NotionWebhookEntity;
};

let lastWebhookSyncAt = 0;

function getWebhookSecret() {
  return (
    process.env.NOTION_CMS_WEBHOOK_SECRET ??
    process.env.NOTION_CMS_WEBHOOK_VERIFICATION_TOKEN ??
    process.env.NOTION_WEBHOOK_VERIFICATION_TOKEN ??
    ""
  );
}

function getSyncCooldownMs() {
  const raw = process.env.NOTION_CMS_WEBHOOK_COOLDOWN_MS;
  if (!raw) return 15000;

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 15000;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isLegacyAuthorized(request: Request) {
  const secrets = [
    process.env.CRON_SECRET,
    process.env.NOTION_CMS_WEBHOOK_SECRET,
    process.env.NOTION_WEBHOOK_VERIFICATION_TOKEN,
    process.env.NOTION_CMS_WEBHOOK_VERIFICATION_TOKEN,
  ].filter(Boolean);

  if (!secrets.length) return false;

  const authorization = request.headers.get("authorization");
  const syncSecret = request.headers.get("x-sync-secret");

  return secrets.some(
    (secret) =>
      authorization === `Bearer ${secret}` ||
      authorization === secret ||
      syncSecret === secret,
  );
}

function verifyNotionSignature(
  rawBody: string,
  signatureHeader: string | null,
) {
  const secret = getWebhookSecret();
  if (!secret) return false;
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const calculatedSignature = `sha256=${createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")}`;

  const expected = Buffer.from(calculatedSignature);
  const received = Buffer.from(signatureHeader);

  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

function extractEvents(body: unknown): NotionWebhookEvent[] {
  if (!isRecord(body)) return [];

  if (Array.isArray(body.events)) {
    return body.events.filter(isRecord) as NotionWebhookEvent[];
  }

  if (Array.isArray(body.data)) {
    return body.data.filter(isRecord) as NotionWebhookEvent[];
  }

  return [body as NotionWebhookEvent];
}

function getEventIdentity(event: NotionWebhookEvent, index: number) {
  const entity = event.entity ?? event.data ?? {};
  const eventType = event.type ?? "unknown";
  const entityId = entity.id ?? null;
  const notionCreatedAt = event.timestamp ?? event.created_time ?? null;

  return {
    eventId:
      event.id ??
      [eventType, entityId, notionCreatedAt, index].filter(Boolean).join(":"),
    eventType,
    entityId,
    entityType: entity.type ?? null,
    notionCreatedAt,
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "notion-cms-webhook",
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  let body: unknown;

  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  if (
    isRecord(body) &&
    typeof body.verification_token === "string" &&
    !("events" in body) &&
    !("data" in body) &&
    !("type" in body)
  ) {
    return NextResponse.json({
      ok: true,
      verification_token: body.verification_token,
    });
  }

  const signatureValid = verifyNotionSignature(
    rawBody,
    request.headers.get("x-notion-signature"),
  );

  if (!signatureValid && !isLegacyAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = extractEvents(body);
  const identities = events.map(getEventIdentity);

  await Promise.all(
    identities.map((identity, index) =>
      recordCmsSyncEvent({
        ...identity,
        payload: events[index],
      }),
    ),
  );

  const now = Date.now();
  const cooldownMs = getSyncCooldownMs();
  if (now - lastWebhookSyncAt < cooldownMs) {
    await Promise.all(
      identities.map((identity) =>
        updateCmsSyncEventStatus(identity.eventId, "skipped", "cooldown"),
      ),
    );

    return NextResponse.json({
      ok: true,
      status: "skipped",
      skippedReason: "cooldown",
      events: identities.length,
      nextSyncAllowedInMs: cooldownMs - (now - lastWebhookSyncAt),
    });
  }

  lastWebhookSyncAt = now;

  try {
    const { data, snapshot } = await syncContainerCMSSnapshot();
    revalidateCmsCaches();

    await Promise.all(
      identities.map((identity) =>
        updateCmsSyncEventStatus(
          identity.eventId,
          snapshot.ok ? "synced" : "failed",
          snapshot.error ?? null,
        ),
      ),
    );

    return NextResponse.json({
      ok: true,
      status: snapshot.ok ? "synced" : "snapshot-write-failed",
      snapshot,
      counts: {
        pages: data.pages.length,
        redirects: data.redirects.length,
        footer: data.footer.length,
        componentRegistry: Object.keys(data.componentRegistry).length,
      },
      events: identities.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await Promise.all(
      identities.map((identity) =>
        updateCmsSyncEventStatus(identity.eventId, "failed", message),
      ),
    );

    console.error("[Notion CMS Webhook] Failed to sync CMS snapshot:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to sync CMS snapshot",
        details: message,
      },
      { status: 500 },
    );
  }
}
