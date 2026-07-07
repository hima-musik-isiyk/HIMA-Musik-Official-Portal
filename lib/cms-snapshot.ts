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
  error?: string;
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
  const { error } = await supabaseAdmin.from(CMS_SNAPSHOTS_TABLE).upsert(
    {
      key: CONTAINER_CMS_SNAPSHOT_KEY,
      payload,
      source: "notion",
      synced_at: syncedAt,
      updated_at: syncedAt,
    },
    { onConflict: "key" },
  );

  if (error) {
    warnSnapshotOnce(
      "[CMS Snapshot] Failed to write Supabase snapshot:",
      error,
    );
    return {
      ok: false,
      table: CMS_SNAPSHOTS_TABLE,
      key: CONTAINER_CMS_SNAPSHOT_KEY,
      error: error.message,
    };
  }

  return {
    ok: true,
    table: CMS_SNAPSHOTS_TABLE,
    key: CONTAINER_CMS_SNAPSHOT_KEY,
  };
}
