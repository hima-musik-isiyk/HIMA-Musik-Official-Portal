import { createHash } from "node:crypto";

import type { ContainerCMSData } from "./notion-builder";
import { supabaseAdmin } from "./supabase";

export const CONTAINER_CMS_SNAPSHOT_KEY = "container-cms";

const CMS_SNAPSHOTS_TABLE =
  process.env.SUPABASE_CMS_SNAPSHOTS_TABLE ?? "cms_snapshots";
const warnedSnapshotMessages = new Set<string>();

type CmsSnapshotWriteResult = {
  ok: boolean;
  table: string;
  key: string;
  syncedAt?: string;
  contentHash?: string;
  payloadBytes?: number;
  error?: string;
};

type CmsSnapshotWriteOptions = {
  sourceUpdatedAt?: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isContainerCMSData(value: unknown): value is ContainerCMSData {
  if (!isRecord(value)) return false;
  return (
    Array.isArray(value.pages) &&
    isRecord(value.variables) &&
    isRecord(value.groupCategories) &&
    isRecord(value.componentRegistry) &&
    Array.isArray(value.footer) &&
    Array.isArray(value.redirects)
  );
}

function warnSnapshotOnce(message: string, details?: unknown) {
  if (warnedSnapshotMessages.has(message)) return;
  warnedSnapshotMessages.add(message);
  console.warn(message, details);
}

function hashPayload(payload: ContainerCMSData) {
  const serialized = JSON.stringify(payload);
  return {
    contentHash: createHash("sha256").update(serialized).digest("hex"),
    payloadBytes: Buffer.byteLength(serialized),
  };
}

function isMissingAuditColumnError(error: { message?: string }) {
  const message = error.message?.toLowerCase() ?? "";
  return (
    message.includes("content_hash") ||
    message.includes("payload_bytes") ||
    message.includes("last_sync_status") ||
    message.includes("last_sync_error")
  );
}

export async function readContainerCMSSnapshot(): Promise<ContainerCMSData | null> {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from(CMS_SNAPSHOTS_TABLE)
    .select("payload")
    .eq("key", CONTAINER_CMS_SNAPSHOT_KEY)
    .maybeSingle();

  if (error) {
    warnSnapshotOnce("[CMS Snapshot] Failed to read Supabase snapshot:", error);
    return null;
  }

  if (!data?.payload) return null;
  if (!isContainerCMSData(data.payload)) {
    warnSnapshotOnce("[CMS Snapshot] Ignoring invalid Supabase CMS payload.");
    return null;
  }

  return data.payload;
}

export async function writeContainerCMSSnapshot(
  payload: ContainerCMSData,
  options: CmsSnapshotWriteOptions = {},
): Promise<CmsSnapshotWriteResult> {
  if (!supabaseAdmin) {
    return {
      ok: false,
      table: CMS_SNAPSHOTS_TABLE,
      key: CONTAINER_CMS_SNAPSHOT_KEY,
      error: "Missing Supabase admin client",
    };
  }

  const syncedAt = new Date().toISOString();
  const { contentHash, payloadBytes } = hashPayload(payload);
  const row = {
    key: CONTAINER_CMS_SNAPSHOT_KEY,
    payload,
    source: "notion",
    source_updated_at: options.sourceUpdatedAt ?? null,
    synced_at: syncedAt,
    updated_at: syncedAt,
    content_hash: contentHash,
    payload_bytes: payloadBytes,
    last_sync_status: "synced",
    last_sync_error: null,
  };

  let { error } = await supabaseAdmin
    .from(CMS_SNAPSHOTS_TABLE)
    .upsert(row, { onConflict: "key" });

  if (error && isMissingAuditColumnError(error)) {
    const { error: fallbackError } = await supabaseAdmin
      .from(CMS_SNAPSHOTS_TABLE)
      .upsert(
        {
          key: CONTAINER_CMS_SNAPSHOT_KEY,
          payload,
          source: "notion",
          source_updated_at: options.sourceUpdatedAt ?? null,
          synced_at: syncedAt,
          updated_at: syncedAt,
        },
        { onConflict: "key" },
      );
    error = fallbackError;
  }

  if (error) {
    warnSnapshotOnce(
      "[CMS Snapshot] Failed to write Supabase snapshot:",
      error,
    );
    return {
      ok: false,
      table: CMS_SNAPSHOTS_TABLE,
      key: CONTAINER_CMS_SNAPSHOT_KEY,
      syncedAt,
      contentHash,
      payloadBytes,
      error: error.message,
    };
  }

  return {
    ok: true,
    table: CMS_SNAPSHOTS_TABLE,
    key: CONTAINER_CMS_SNAPSHOT_KEY,
    syncedAt,
    contentHash,
    payloadBytes,
  };
}
