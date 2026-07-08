import { supabaseAdmin } from "./supabase";

const CMS_SYNC_EVENTS_TABLE =
  process.env.SUPABASE_CMS_SYNC_EVENTS_TABLE ?? "cms_sync_events";

const warnedEventMessages = new Set<string>();

export type CmsSyncEventStatus = "queued" | "synced" | "skipped" | "failed";

export type CmsSyncEventInput = {
  eventId: string;
  eventType: string;
  entityId: string | null;
  entityType: string | null;
  notionCreatedAt: string | null;
  payload: unknown;
  status?: CmsSyncEventStatus;
  error?: string | null;
};

function warnEventOnce(message: string, details?: unknown) {
  if (warnedEventMessages.has(message)) return;
  warnedEventMessages.add(message);
  console.warn(message, details);
}

export async function recordCmsSyncEvent(
  input: CmsSyncEventInput,
): Promise<void> {
  if (!supabaseAdmin) return;

  const { error } = await supabaseAdmin.from(CMS_SYNC_EVENTS_TABLE).upsert(
    {
      event_id: input.eventId,
      event_type: input.eventType,
      entity_id: input.entityId,
      entity_type: input.entityType,
      notion_created_at: input.notionCreatedAt,
      payload: input.payload,
      status: input.status ?? "queued",
      error: input.error ?? null,
      received_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "event_id" },
  );

  if (error) {
    warnEventOnce("[CMS Sync Event] Failed to record event:", error);
  }
}

export async function updateCmsSyncEventStatus(
  eventId: string,
  status: CmsSyncEventStatus,
  errorMessage: string | null = null,
): Promise<void> {
  if (!supabaseAdmin) return;

  const { error } = await supabaseAdmin
    .from(CMS_SYNC_EVENTS_TABLE)
    .update({
      status,
      error: errorMessage,
      processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("event_id", eventId);

  if (error) {
    warnEventOnce("[CMS Sync Event] Failed to update event status:", error);
  }
}
