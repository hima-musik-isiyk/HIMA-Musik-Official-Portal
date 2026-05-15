"use client";

import { unzipSync, zipSync } from "fflate";
import {
  ChevronLeft,
  ChevronRight,
  FileDown,
  Layers,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function useCarouselScroll(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  frameCount: number,
) {
  const animId = useRef(0);
  const [visualIndex, setVisualIndex] = useState(0);

  const scrollToX = useCallback(
    (target: number, duration = 150) => {
      const el = scrollRef.current;
      if (!el) return;
      cancelAnimationFrame(animId.current);
      const start = el.scrollLeft;
      const delta = target - start;
      if (Math.abs(delta) < 1) {
        el.scrollLeft = target;
        return;
      }
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - t0) / duration, 1);
        el.scrollLeft = start + delta * (1 - (1 - p) ** 3);
        if (p < 1) animId.current = requestAnimationFrame(tick);
      };
      animId.current = requestAnimationFrame(tick);
    },
    [scrollRef],
  );

  // Real-time visual index from scroll position
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.offsetWidth;
      if (!w) return;
      setVisualIndex(
        Math.max(0, Math.min(frameCount - 1, Math.round(el.scrollLeft / w))),
      );
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef, frameCount]);

  // Touch: disable CSS snap while finger is down, fast JS snap on release
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || frameCount <= 1) return;
    const onStart = () => {
      cancelAnimationFrame(animId.current);
      el.style.scrollSnapType = "none";
    };
    const onEnd = () => {
      const w = el.offsetWidth;
      if (!w) return;
      const idx = Math.max(
        0,
        Math.min(frameCount - 1, Math.round(el.scrollLeft / w)),
      );
      scrollToX(idx * w);
      setTimeout(() => {
        el.style.scrollSnapType = "x mandatory";
      }, 180);
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [scrollRef, frameCount, scrollToX]);

  useEffect(() => () => cancelAnimationFrame(animId.current), []);

  return {
    visualIndex,
    scrollToX,
    cancelAnim: () => cancelAnimationFrame(animId.current),
  };
}

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

type PreviewState = {
  itemId: string;
  frameIndex: number;
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
  if (!items.length) return [0];

  const minRow = Math.min(...items.map((item) => item.row));
  const maxRow = Math.max(...items.map((item) => item.row));
  const startRow = minRow - 1;
  const endRow = maxRow + 1;
  const rows: number[] = [];

  for (let row = startRow; row <= endRow; row += 1) rows.push(row);
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
        const safeBytes = Uint8Array.from(bytes);
        extracted.push(
          new File([safeBytes], cleanName, {
            type: getMimeFromName(cleanName),
          }),
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
  const safeZip = Uint8Array.from(zipped);
  saveBlob(
    new Blob([safeZip], { type: "application/zip" }),
    `instagram-cell-${item.row + 1}-${item.column + 1}.zip`,
  );
}

export default function InstagramSecretPage() {
  const [manifest, setManifest] = useState<InstagramManifest>(() =>
    normalizeManifest({ items: [] }),
  );
  const [activeFrame, setActiveFrame] = useState<Record<string, number>>({});
  const [preview, setPreview] = useState<PreviewState | null>(null);
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
  const currentPreviewItem = useMemo(
    () =>
      preview
        ? (manifest.items.find((item) => item.id === preview.itemId) ?? null)
        : null,
    [manifest.items, preview],
  );
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

  useEffect(() => {
    if (!preview) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [preview]);

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

  function openPreview(item: InstagramGridItem) {
    setPreview({
      itemId: item.id,
      frameIndex: Math.min(activeFrame[item.id] ?? 0, item.frames.length - 1),
    });
  }

  function closePreview() {
    setPreview(null);
  }

  function movePreviewFrame(direction: -1 | 1) {
    setPreview((state) => {
      if (!state) return state;

      const item = manifest.items.find((entry) => entry.id === state.itemId);
      if (!item || item.frames.length <= 1) return state;

      const next = Math.max(
        0,
        Math.min(item.frames.length - 1, state.frameIndex + direction),
      );

      if (next === state.frameIndex) return state;

      setActiveFrame((frames) => ({ ...frames, [state.itemId]: next }));
      return { ...state, frameIndex: next };
    });
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
            <div className="border border-white/10 bg-white/3 p-3">
              <strong className="block text-lg text-white">
                {manifest.items.length}
              </strong>
              cells
            </div>
            <div className="border border-white/10 bg-white/3 p-3">
              <strong className="block text-lg text-white">{frameCount}</strong>
              frames
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 border border-white/10 bg-white/3 p-3 text-neutral-300 transition hover:border-white/30 hover:bg-white/7"
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
          <div className="flex items-center justify-between gap-3 border border-white/10 bg-white/4 px-4 py-3 text-sm">
            <span className={error ? "text-red-300" : "text-neutral-300"}>
              {error || busy}
            </span>
            {busy && (
              <Loader2 className="size-4 animate-spin text-neutral-500" />
            )}
          </div>
        )}

        <div className="mx-auto w-full" style={{ maxWidth: "935px" }}>
          <div className="grid grid-cols-3 gap-px bg-black">
            {rows.flatMap((row) =>
              [0, 1, 2].map((column) => {
                const item = row >= 0 ? itemMap.get(`${row}:${column}`) : null;

                return item ? (
                  <PostCell
                    key={item.id}
                    item={item}
                    activeIndex={activeFrame[item.id] ?? 0}
                    onOpenPreview={() => openPreview(item)}
                    onEdit={() =>
                      openImporter({
                        row: item.row,
                        column: item.column,
                        itemId: item.id,
                      })
                    }
                    onAddCarousel={() =>
                      openImporter({
                        row: item.row,
                        column: item.column,
                        itemId: item.id,
                      })
                    }
                    onDelete={() => void handleDelete(item)}
                    onDownload={() => void downloadItem(item)}
                    onIndexChange={(index) =>
                      setActiveFrame((state) => ({
                        ...state,
                        [item.id]: index,
                      }))
                    }
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

      {preview && currentPreviewItem && (
        <PreviewModal
          item={currentPreviewItem}
          activeIndex={Math.min(
            preview.frameIndex,
            currentPreviewItem.frames.length - 1,
          )}
          onClose={closePreview}
          onPrev={() => movePreviewFrame(-1)}
          onNext={() => movePreviewFrame(1)}
        />
      )}
    </section>
  );
}

function QuickTooltip({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group/tooltip relative inline-block">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded bg-neutral-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 shadow-md transition-opacity duration-100 group-hover/tooltip:opacity-100">
        {text}
      </div>
    </div>
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
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group relative aspect-3/4 overflow-hidden bg-[#121212] text-neutral-500 transition hover:bg-[#1a1a1a] hover:text-neutral-200 disabled:cursor-wait disabled:opacity-60"
    >
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <span className="grid size-10 place-items-center rounded-full border border-white/15 bg-black/35 transition group-hover:border-white/35">
          <Plus className="size-5" />
        </span>
        <span className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.08em] uppercase">
          <Upload className="size-3.5" />
          Import
        </span>
        <span className="text-[10px] text-neutral-600">
          {row + 1}:{column + 1}
        </span>
      </span>
    </button>
  );
}

function PostCell({
  item,
  activeIndex,
  onOpenPreview,
  onEdit,
  onAddCarousel,
  onDelete,
  onDownload,
  onIndexChange,
}: {
  item: InstagramGridItem;
  activeIndex: number;
  onOpenPreview: () => void;
  onEdit: () => void;
  onAddCarousel: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onIndexChange: (index: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { visualIndex, scrollToX } = useCarouselScroll(
    scrollRef,
    item.frames.length,
  );
  const isProgScroll = useRef(false);

  // Sync scroll when parent activeIndex changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = activeIndex * el.offsetWidth;
    if (Math.abs(el.scrollLeft - target) > 2) {
      isProgScroll.current = true;
      scrollToX(target);
      setTimeout(() => {
        isProgScroll.current = false;
      }, 200);
    }
  }, [activeIndex, scrollToX]);

  // Commit settled index to parent
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (isProgScroll.current) return;
        const w = el.offsetWidth;
        if (!w) return;
        const idx = Math.round(el.scrollLeft / w);
        if (idx !== activeIndex) onIndexChange(idx);
      }, 80);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", onScroll);
    };
  }, [activeIndex, onIndexChange]);

  return (
    <article className="group relative aspect-3/4 overflow-hidden bg-[#0f0f0f]">
      <div
        ref={scrollRef}
        className="scrollbar-none absolute inset-0 flex cursor-pointer snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
        onClick={() => onOpenPreview()}
      >
        {item.frames.map((frame) => (
          <div
            key={frame.id}
            className="h-full w-full shrink-0 snap-center select-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={frame.url}
              alt={frame.originalName}
              className="h-full w-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {item.frames.length > 1 && (
        <div className="pointer-events-none absolute right-2 bottom-2 z-10 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] text-white">
          {item.frames.slice(0, 10).map((frameDot, index) => (
            <span
              key={frameDot.id}
              className={`size-1.5 rounded-full transition-colors duration-150 ${
                index === visualIndex ? "bg-white" : "bg-white/35"
              }`}
            />
          ))}
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-10 bg-black/0 transition group-hover:bg-black/22" />

      <div className="absolute inset-x-2 bottom-2 z-20 flex translate-y-3 justify-center gap-1.5 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
        <QuickTooltip text="Add carousel">
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full bg-black/72 text-white backdrop-blur transition hover:bg-white hover:text-black"
            onClick={(e) => {
              e.stopPropagation();
              onAddCarousel();
            }}
          >
            <Layers className="size-4" />
          </button>
        </QuickTooltip>
        <QuickTooltip text="Replace">
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full bg-black/72 text-white backdrop-blur transition hover:bg-white hover:text-black"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <RefreshCw className="size-4" />
          </button>
        </QuickTooltip>
        <QuickTooltip text="Download original">
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full bg-black/72 text-white backdrop-blur transition hover:bg-white hover:text-black"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
          >
            <FileDown className="size-4" />
          </button>
        </QuickTooltip>
        <QuickTooltip text="Download chopped (zip)">
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full bg-black/72 text-white backdrop-blur transition hover:bg-white hover:text-black"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
          >
            <Package className="size-4" />
          </button>
        </QuickTooltip>
        <QuickTooltip text="Delete">
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full bg-black/72 text-red-200 backdrop-blur transition hover:bg-red-500 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="size-4" />
          </button>
        </QuickTooltip>
      </div>
    </article>
  );
}

function PreviewModal({
  item,
  activeIndex,
  onClose,
  onPrev,
  onNext,
}: {
  item: InstagramGridItem;
  activeIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { visualIndex, scrollToX } = useCarouselScroll(
    scrollRef,
    item.frames.length,
  );
  const isProgScroll = useRef(false);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (item.frames.length <= 1) return;
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [item.frames.length, onClose, onNext, onPrev]);

  // Sync scroll when activeIndex changes from buttons/keyboard
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = activeIndex * el.offsetWidth;
    if (Math.abs(el.scrollLeft - target) > 2) {
      isProgScroll.current = true;
      scrollToX(target);
      setTimeout(() => {
        isProgScroll.current = false;
      }, 200);
    }
  }, [activeIndex, scrollToX]);

  // Commit settled index to parent
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (isProgScroll.current) return;
        const w = el.offsetWidth;
        if (!w) return;
        const idx = Math.round(el.scrollLeft / w);
        if (idx > activeIndex) onNext();
        else if (idx < activeIndex) onPrev();
      }, 80);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", onScroll);
    };
  }, [activeIndex, onNext, onPrev]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Instagram image preview"
    >
      <div
        className="relative flex h-full w-full items-center justify-center"
        style={{ maxWidth: "1080px" }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-3 right-3 z-20 grid size-10 place-items-center rounded-full bg-black/70 text-white transition hover:bg-white hover:text-black"
          onClick={onClose}
          aria-label="Close preview"
        >
          <X className="size-5" />
        </button>

        {item.frames.length > 1 && (
          <>
            <button
              type="button"
              className="absolute left-3 z-20 grid size-11 place-items-center rounded-full bg-black/70 text-white transition hover:bg-white hover:text-black disabled:opacity-30 disabled:hover:bg-black/70 disabled:hover:text-white"
              onClick={onPrev}
              disabled={activeIndex === 0}
              aria-label="Previous image"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              className="absolute right-3 z-20 grid size-11 place-items-center rounded-full bg-black/70 text-white transition hover:bg-white hover:text-black disabled:opacity-30 disabled:hover:bg-black/70 disabled:hover:text-white"
              onClick={onNext}
              disabled={activeIndex === item.frames.length - 1}
              aria-label="Next image"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        )}

        <div className="relative aspect-1080/1440 h-full max-h-[92vh] overflow-hidden bg-black">
          <div
            ref={scrollRef}
            className="scrollbar-none flex h-full snap-x snap-mandatory overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {item.frames.map((frame) => (
              <div
                key={frame.id}
                className="h-full w-full shrink-0 snap-center select-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={frame.url}
                  alt={frame.originalName}
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {item.frames.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5">
              {item.frames.map((entry, index) => (
                <span
                  key={entry.id}
                  className={`size-1.5 rounded-full transition-colors duration-150 ${
                    index === visualIndex ? "bg-white" : "bg-white/35"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
