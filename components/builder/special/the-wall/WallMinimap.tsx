"use client";

import { WallNoteData } from "./StickyNote";

interface WallMinimapProps {
  notes: WallNoteData[];
  viewport: { x: number; y: number; width: number; height: number };
  scale: number;
}

export default function WallMinimap({
  notes,
  viewport,
  scale,
}: WallMinimapProps) {
  // Determine bounds of the minimap
  // We'll set a fixed logical size for the minimap view, e.g., 5000x5000,
  // or calculate based on min/max of notes.
  // For a generic infinite canvas, let's track the bounding box of all notes + current viewport

  let minX = viewport.x;
  let maxX = viewport.x + viewport.width / scale;
  let minY = viewport.y;
  let maxY = viewport.y + viewport.height / scale;

  notes.forEach((note) => {
    if (note.x < minX) minX = note.x;
    if (note.x + 250 > maxX) maxX = note.x + 250; // approx width
    if (note.y < minY) minY = note.y;
    if (note.y + 250 > maxY) maxY = note.y + 250; // approx height
  });

  // Add some padding
  const padding = 1000;
  minX -= padding;
  maxX += padding;
  minY -= padding;
  maxY += padding;

  const width = maxX - minX;
  const height = maxY - minY;

  // Minimap physical size
  const minimapWidth = 200;
  const minimapHeight = 150;

  const mapScaleX = minimapWidth / width;
  const mapScaleY = minimapHeight / height;

  // Use the smaller scale to fit everything while maintaining aspect ratio
  const mapScale = Math.min(mapScaleX, mapScaleY);

  const getMapX = (x: number) => (x - minX) * mapScale;
  const getMapY = (y: number) => (y - minY) * mapScale;
  const getMapW = (w: number) => w * mapScale;
  const getMapH = (h: number) => h * mapScale;

  return (
    <div
      className="pointer-events-none fixed right-6 bottom-6 z-40 hidden overflow-hidden border border-white/10 bg-black/60 shadow-2xl backdrop-blur-md md:block"
      style={{ width: minimapWidth, height: minimapHeight }}
    >
      {/* Background Grid Representation */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
          backgroundSize: "10px 10px",
        }}
      />

      {/* Notes */}
      {notes.map((note) => (
        <div
          key={note.id}
          className="bg-gold-500/80 border-gold-300 absolute border"
          style={{
            left: getMapX(note.x),
            top: getMapY(note.y),
            width: Math.max(getMapW(250), 2),
            height: Math.max(getMapH(150), 2),
          }}
        />
      ))}

      {/* Viewport Box */}
      <div
        className="absolute border-2 border-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-75"
        style={{
          left: getMapX(viewport.x),
          top: getMapY(viewport.y),
          width: getMapW(viewport.width / scale),
          height: getMapH(viewport.height / scale),
        }}
      />
    </div>
  );
}
