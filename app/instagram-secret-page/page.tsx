"use client";

import { unzipSync, zipSync } from "fflate";
import {
  Download,
  ImagePlus,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const canvasWidth = 1080;
const canvasHeight = 1440;
const targetAspect = canvasWidth / canvasHeight;
const apiPath = "/api/instagram-secret-page";

type InstagramFrame = {
  id: string;
  name: string;
  width: number;
  height: number;
  type: string;
  originalName: string;
  originalType: string;
  segmentIndex: number;
  sourceIndex: number;
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

type ProcessedFrame = {
  file: File;
  meta: Omit<InstagramFrame, "path" | "url">;
};

type GridTarget = {
  row: number;
  column: number;
  itemId?: string;
};

const naturalCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function normalizeManifest(
  data: Partial<InstagramManifest>,
): InstagramManifest {
  return {
    version: 1,
    updatedAt: data.updatedAt ?? new Date().toISOString(),
    items: Array.isArray(data.items) ? data.items : [],
  };
}

function getMimeFromName(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".avif")) return "image/avif";
  return "image/jpeg";
}

function isImageName(name: string) {
  return /\.(avif|gif|jpe?g|png|webp)$/i.test(name);
}

function isZip(file: File) {
  return file.type === "application/zip" || /\.zip$/i.test(file.name);
}

function fileStem(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

function getRows(items: InstagramGridItem[]) {
  const rowZeroFull = [0, 1, 2].every((column) =>
    items.some((item) => item.row === 0 && item.column === column),
  );
  const maxRow = items.length
    ? Math.max(...items.map((item) => item.row), 0)
    : 0;
  const startRow = rowZeroFull ? -1 : 0;
  const rows: number[] = [];

  for (let row = startRow; row <= maxRow; row += 1) rows.push(row);
  return rows;
}

async function loadBitmap(file: File) {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall back to HTMLImageElement decoding below.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function canvasToWebp(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/webp", 0.92);
  });
}

async function extractInputImages(files: File[]) {
  const extracted: File[] = [];

  for (const file of files) {
    if (!isZip(file)) {
      if (file.type.startsWith("image/") || isImageName(file.name)) {
        extracted.push(file);
      }
      continue;
    }

    const entries = unzipSync(new Uint8Array(await file.arrayBuffer()), {
      filter: (entry) => !entry.name.endsWith("/") && isImageName(entry.name),
    });

    Object.entries(entries)
      .sort(([a], [b]) => naturalCollator.compare(a, b))
      .forEach(([name, bytes]) => {
        const cleanName = name.split("/").filter(Boolean).pop() ?? name;
        extracted.push(
          new File([bytes], cleanName, { type: getMimeFromName(cleanName) }),
        );
      });
  }

  return extracted.sort((a, b) => naturalCollator.compare(a.name, b.name));
}

async function processImageFile(file: File, sourceIndex: number) {
  const bitmap = await loadBitmap(file);
  const width = bitmap.width;
  const height = bitmap.height;
  const segmentCount = Math.max(1, Math.round(width / (height * targetAspect)));
  const segmentWidth = width / segmentCount;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  if (!context) throw new Error("Canvas not available.");

  const frames: ProcessedFrame[] = [];

  for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
    let sx = segmentIndex * segmentWidth;
    let sy = 0;
    let sw = segmentWidth;
    let sh = height;
    const sourceAspect = sw / sh;

    if (sourceAspect > targetAspect) {
      const croppedWidth = sh * targetAspect;
      sx += (sw - croppedWidth) / 2;
      sw = croppedWidth;
    } else if (sourceAspect < targetAspect) {
      const croppedHeight = sw / targetAspect;
      sy += (sh - croppedHeight) / 2;
      sh = croppedHeight;
    }

    context.clearRect(0, 0, canvasWidth, canvasHeight);
    context.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvasWidth, canvasHeight);

    const webp = await canvasToWebp(canvas);

    if (!webp) {
      return [
        {
          file,
          meta: {
            id: crypto.randomUUID(),
            name: file.name,
            width,
            height,
            type: file.type || getMimeFromName(file.name),
            originalName: file.name,
            originalType: file.type || getMimeFromName(file.name),
            segmentIndex: 0,
            sourceIndex,
          },
        },
      ];
    }

    const outputName =
      segmentCount > 1
        ? `${fileStem(file.name)}-${String(segmentIndex + 1).padStart(
            2,
            "0",
          )}.webp`
        : `${fileStem(file.name)}.webp`;

    frames.push({
      file: new File([webp], outputName, { type: "image/webp" }),
      meta: {
        id: crypto.randomUUID(),
        name: outputName,
        width: canvasWidth,
        height: canvasHeight,
        type: "image/webp",
        originalName: file.name,
        originalType: file.type || getMimeFromName(file.name),
        segmentIndex,
        sourceIndex,
      },
    });
  }

  if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();
  return frames;
}

async function processFiles(files: File[]) {
  const images = await extractInputImages(files);
  const processed: ProcessedFrame[] = [];

  for (const [sourceIndex, image] of images.entries()) {
    const frames = await processImageFile(image, sourceIndex);
    processed.push(...frames);
  }

  return processed;
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function downloadItem(item: InstagramGridItem) {
  const bytes: Record<string, Uint8Array> = {};

  for (const [index, frame] of item.frames.entries()) {
    const response = await fetch(frame.url);
    const data = new Uint8Array(await response.arrayBuffer());
    const name = `${String(index + 1).padStart(2, "0")}-${frame.name}`;

    if (item.frames.length === 1) {
      saveBlob(new Blob([data], { type: frame.type }), name);
      return;
    }

    bytes[name] = data;
  }

  const zipped = zipSync(bytes, { level: 0 });
  saveBlob(
    new Blob([zipped], { type: "application/zip" }),
    `instagram-cell-${item.row + 1}-${item.column + 1}.zip`,
  );
}

export default function InstagramSecretPage() {
  const [manifest, setManifest] = useState<InstagramManifest>(() =>
    normalizeManifest({ items: [] }),
  );
  const [activeFrame, setActiveFrame] = useState<Record<string, number>>({});
  const [target, setTarget] = useState<GridTarget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const itemMap = useMemo(() => {
    const map = new Map<string, InstagramGridItem>();
    manifest.items.forEach((item) => {
      map.set(`${item.row}:${item.column}`, item);
    });
    return map;
  }, [manifest.items]);

  const rows = useMemo(() => getRows(manifest.items), [manifest.items]);
  const frameCount = manifest.items.reduce(
    (total, item) => total + item.frames.length,
    0,
  );

  const loadManifest = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(apiPath, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Load failed.");
      setManifest(normalizeManifest(data));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Load failed.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadManifest();
  }, [loadManifest]);

  function openImporter(nextTarget: GridTarget) {
    setTarget(nextTarget);
    inputRef.current?.click();
  }

  async function handleUpload(files: FileList | null) {
    if (!files || !target) return;

    setBusy("Processing");
    setError("");

    try {
      const frames = await processFiles(Array.from(files));

      if (frames.length === 0) throw new Error("No image found.");

      setBusy(`Uploading ${frames.length}`);
      const formData = new FormData();
      formData.set(
        "payload",
        JSON.stringify({
          id: target.itemId,
          row: target.row,
          column: target.column,
          frameMetas: frames.map((frame) => frame.meta),
        }),
      );
      frames.forEach((frame) => formData.append("frames", frame.file));

      const response = await fetch(apiPath, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Upload failed.");
      setManifest(normalizeManifest(data.manifest));
      if (data.item?.id)
        setActiveFrame((state) => ({ ...state, [data.item.id]: 0 }));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed.",
      );
    } finally {
      setBusy("");
      setTarget(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(item: InstagramGridItem) {
    setBusy("Deleting");
    setError("");

    try {
      const response = await fetch(apiPath, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Delete failed.");
      setManifest(normalizeManifest(data.manifest));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Delete failed.",
      );
    } finally {
      setBusy("");
    }
  }

  function cycleFrame(item: InstagramGridItem) {
    if (item.frames.length <= 1) return;
    setActiveFrame((state) => ({
      ...state,
      [item.id]: ((state[item.id] ?? 0) + 1) % item.frames.length,
    }));
  }

  return (
    <section className="min-h-screen bg-[#050505] px-4 pt-8 pb-14 text-neutral-50 sm:px-6 lg:px-8">
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept="image/*,.zip,application/zip"
        multiple
        onChange={(event) => void handleUpload(event.target.files)}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.24em] text-neutral-500 uppercase">
              Instagram Secret Page
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-balance text-white sm:text-4xl">
              3-column post preview
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs text-neutral-400 sm:min-w-80">
            <div className="border border-white/10 bg-white/[0.03] p-3">
              <strong className="block text-lg text-white">
                {manifest.items.length}
              </strong>
              cells
            </div>
            <div className="border border-white/10 bg-white/[0.03] p-3">
              <strong className="block text-lg text-white">{frameCount}</strong>
              frames
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 border border-white/10 bg-white/[0.03] p-3 text-neutral-300 transition hover:border-white/30 hover:bg-white/[0.07]"
              onClick={() => void loadManifest()}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              sync
            </button>
          </div>
        </header>

        {(busy || error) && (
          <div className="flex items-center justify-between gap-3 border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
            <span className={error ? "text-red-300" : "text-neutral-300"}>
              {error || busy}
            </span>
            {busy && (
              <Loader2 className="size-4 animate-spin text-neutral-500" />
            )}
          </div>
        )}

        <div className="mx-auto w-full max-w-[860px]">
          <div className="grid grid-cols-3 gap-1 bg-[#121212] p-1 sm:gap-1.5 sm:p-1.5">
            {rows.flatMap((row) =>
              [0, 1, 2].map((column) => {
                const item = row >= 0 ? itemMap.get(`${row}:${column}`) : null;

                return item ? (
                  <PostCell
                    key={item.id}
                    item={item}
                    activeIndex={activeFrame[item.id] ?? 0}
                    onCycle={() => cycleFrame(item)}
                    onEdit={() =>
                      openImporter({
                        row: item.row,
                        column: item.column,
                        itemId: item.id,
                      })
                    }
                    onDelete={() => void handleDelete(item)}
                    onDownload={() => void downloadItem(item)}
                  />
                ) : (
                  <PlaceholderCell
                    key={`${row}:${column}`}
                    row={row}
                    column={column}
                    disabled={Boolean(busy)}
                    onClick={() => openImporter({ row, column })}
                  />
                );
              }),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PlaceholderCell({
  row,
  column,
  disabled,
  onClick,
}: {
  row: number;
  column: number;
  disabled: boolean;
  onClick: () => void;
}) {
  const hue = (row + 4) * 31 + column * 47;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group relative aspect-[3/4] overflow-hidden border border-dashed border-white/15 bg-neutral-950 text-neutral-400 transition hover:border-white/35 hover:text-white disabled:cursor-wait disabled:opacity-60"
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 16% 13%), #050505 55%), radial-gradient(circle at ${
          28 + column * 18
        }% ${24 + (row + 1) * 11}%, hsl(${hue + 30} 70% 35% / .36), transparent 34%)`,
      }}
    >
      <span className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.055)_1px,transparent_1px)] bg-[size:22px_22px] opacity-40" />
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <span className="grid size-12 place-items-center rounded-full border border-white/20 bg-black/45 backdrop-blur-sm transition group-hover:scale-105 group-hover:border-white/50">
          <Plus className="size-6" />
        </span>
        <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase">
          <Upload className="size-3.5" />
          Import
        </span>
      </span>
    </button>
  );
}

function PostCell({
  item,
  activeIndex,
  onCycle,
  onEdit,
  onDelete,
  onDownload,
}: {
  item: InstagramGridItem;
  activeIndex: number;
  onCycle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDownload: () => void;
}) {
  const frame = item.frames[Math.min(activeIndex, item.frames.length - 1)];

  return (
    <article className="group relative aspect-[3/4] overflow-hidden bg-neutral-900">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onCycle}
        aria-label="Cycle carousel frame"
      >
        {frame && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={frame.url}
            alt={frame.originalName}
            className="h-full w-full object-cover"
            draggable={false}
          />
        )}
      </button>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/55 to-transparent p-2 opacity-100">
        <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white">
          <ImagePlus className="size-3" />
          {item.row + 1}:{item.column + 1}
        </span>
        {item.frames.length > 1 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white">
            <Layers className="size-3" />
            {activeIndex + 1}/{item.frames.length}
          </span>
        )}
      </div>

      {item.frames.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {item.frames.slice(0, 10).map((frameDot, index) => (
            <span
              key={frameDot.id}
              className={`size-1.5 rounded-full ${
                index === activeIndex ? "bg-white" : "bg-white/35"
              }`}
            />
          ))}
        </div>
      )}

      <div className="absolute inset-x-2 bottom-2 flex translate-y-3 justify-center gap-1.5 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
        <button
          type="button"
          className="grid size-9 place-items-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-white hover:text-black"
          onClick={onEdit}
          title="Replace"
        >
          <Upload className="size-4" />
        </button>
        <button
          type="button"
          className="grid size-9 place-items-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-white hover:text-black"
          onClick={onDownload}
          title="Download"
        >
          <Download className="size-4" />
        </button>
        <button
          type="button"
          className="grid size-9 place-items-center rounded-full bg-black/70 text-red-200 backdrop-blur transition hover:bg-red-500 hover:text-white"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </article>
  );
}
