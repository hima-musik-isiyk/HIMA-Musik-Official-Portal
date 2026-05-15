import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bucketName =
  process.env.INSTAGRAM_SECRET_PAGE_BUCKET ?? "instagram-secret-page";
const manifestPath = "manifest.json";
const bucketOptions = {
  public: true,
  allowedMimeTypes: [
    "application/octet-stream",
    "image/avif",
    "image/gif",
    "image/heic",
    "image/heif",
    "image/jpeg",
    "image/png",
    "image/webp",
  ],
};

type FrameMeta = {
  id: string;
  name: string;
  width: number;
  height: number;
  type: string;
  originalName: string;
  originalType: string;
  segmentIndex: number;
  sourceIndex: number;
};

type InstagramFrame = FrameMeta & {
  path: string;
  url: string;
};

type InstagramGridItem = {
  id: string;
  row: number;
  column: number;
  createdAt: string;
  updatedAt: string;
  sourceNames: string[];
  originalTypes: string[];
  frames: InstagramFrame[];
};

type InstagramManifest = {
  version: 1;
  updatedAt: string;
  items: InstagramGridItem[];
};

type UploadPayload = {
  id?: string;
  row?: number;
  column?: number;
  frameMetas?: FrameMeta[];
};

function emptyManifest(): InstagramManifest {
  return { version: 1, updatedAt: new Date().toISOString(), items: [] };
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function ensureBucket(supabase: ReturnType<typeof getSupabaseAdmin>) {
  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();

  if (listError) throw listError;

  const existingBucket = buckets?.find((bucket) => bucket.name === bucketName);

  if (existingBucket) {
    if (!existingBucket.public) {
      const { error: updateError } = await supabase.storage.updateBucket(
        bucketName,
        bucketOptions,
      );

      if (updateError) throw updateError;
    }
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(
    bucketName,
    bucketOptions,
  );

  if (createError) throw createError;
}

async function readManifest(
  supabase: ReturnType<typeof getSupabaseAdmin>,
): Promise<InstagramManifest> {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .download(manifestPath);

  if (error) return emptyManifest();

  try {
    const parsed = JSON.parse(await data.text()) as InstagramManifest;
    return {
      version: 1,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return emptyManifest();
  }
}

async function writeManifest(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  manifest: InstagramManifest,
) {
  manifest.updatedAt = new Date().toISOString();

  const { error } = await supabase.storage.from(bucketName).upload(
    manifestPath,
    new Blob([JSON.stringify(manifest, null, 2)], {
      type: "application/json",
    }),
    {
      contentType: "application/json",
      upsert: true,
    },
  );

  if (error) throw error;
}

function jsonError(error: unknown, status = 500) {
  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : "Instagram grid failed.",
    },
    { status },
  );
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    await ensureBucket(supabase);
    const manifest = await readManifest(supabase);

    return NextResponse.json(manifest, {
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const payloadRaw = formData.get("payload");
    const files = formData.getAll("frames").filter((file): file is File => {
      return file instanceof File;
    });

    if (typeof payloadRaw !== "string") {
      return jsonError(new Error("Missing payload."), 400);
    }

    const payload = JSON.parse(payloadRaw) as UploadPayload;
    const column = Number(payload.column);
    const requestedRow = Number(payload.row);
    const frameMetas = payload.frameMetas ?? [];

    if (![0, 1, 2].includes(column) || !Number.isFinite(requestedRow)) {
      return jsonError(new Error("Invalid grid target."), 400);
    }

    if (files.length === 0 || files.length !== frameMetas.length) {
      return jsonError(new Error("Frame payload mismatch."), 400);
    }

    const supabase = getSupabaseAdmin();
    await ensureBucket(supabase);

    const manifest = await readManifest(supabase);
    const now = new Date().toISOString();
    const existing = payload.id
      ? manifest.items.find((item) => item.id === payload.id)
      : manifest.items.find(
          (item) => item.row === requestedRow && item.column === column,
        );
    const itemId = existing?.id ?? payload.id ?? crypto.randomUUID();
    let row = existing?.row ?? requestedRow;

    if (!existing && requestedRow < 0) {
      manifest.items = manifest.items.map((item) => ({
        ...item,
        row: item.row + 1,
      }));
      row = 0;
    }

    if (existing?.frames.length) {
      await supabase.storage
        .from(bucketName)
        .remove(existing.frames.map((frame) => frame.path));
    }

    const frames: InstagramFrame[] = [];

    for (const [index, file] of files.entries()) {
      const meta = frameMetas[index];
      const extension = file.type === "image/webp" ? "webp" : "original";
      const path = `items/${itemId}/${String(index + 1).padStart(
        2,
        "0",
      )}-${meta.id}.${extension}`;
      const bytes = new Uint8Array(await file.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(path, bytes, {
          contentType: file.type || meta.type || "application/octet-stream",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
      frames.push({
        ...meta,
        path,
        url: `${data.publicUrl}?v=${Date.now()}`,
      });
    }

    const savedItem: InstagramGridItem = {
      id: itemId,
      row,
      column,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      sourceNames: Array.from(
        new Set(frames.map((frame) => frame.originalName)),
      ),
      originalTypes: Array.from(
        new Set(frames.map((frame) => frame.originalType).filter(Boolean)),
      ),
      frames,
    };

    manifest.items = [
      savedItem,
      ...manifest.items.filter((item) => item.id !== itemId),
    ].sort((a, b) => a.row - b.row || a.column - b.column);

    await writeManifest(supabase, manifest);

    return NextResponse.json({ item: savedItem, manifest });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { id?: string };

    if (!body.id) return jsonError(new Error("Missing item id."), 400);

    const supabase = getSupabaseAdmin();
    await ensureBucket(supabase);
    const manifest = await readManifest(supabase);
    const item = manifest.items.find((entry) => entry.id === body.id);

    if (!item) return NextResponse.json({ manifest });

    if (item.frames.length > 0) {
      await supabase.storage
        .from(bucketName)
        .remove(item.frames.map((frame) => frame.path));
    }

    manifest.items = manifest.items.filter((entry) => entry.id !== body.id);
    await writeManifest(supabase, manifest);

    return NextResponse.json({ manifest });
  } catch (error) {
    return jsonError(error);
  }
}
