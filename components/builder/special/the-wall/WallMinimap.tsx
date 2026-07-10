"use client";

import { useRef, useState } from "react";

import { WallNoteData } from "./StickyNote";

interface WallMinimapProps {
  notes: WallNoteData[];
  viewport: { x: number; y: number; width: number; height: number };
  scale: number;
  onPan?: (dx: number, dy: number) => void;
}

export default function WallMinimap({
  notes,
  viewport,
  scale,
  onPan,
}: WallMinimapProps) {
  // Determine bounds of the minimap
  // We set a fixed size for the wall to solve drift issues and limit infinite space.
  const minX = -3000;
  const maxX = 3000;
  const minY = -2000;
  const maxY = 2000;

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

  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !onPan) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };

    const canvasDx = dx / mapScale;
    const canvasDy = dy / mapScale;

    onPan(-canvasDx * scale, -canvasDy * scale);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div
      className="fixed right-6 bottom-6 z-40 hidden overflow-hidden border border-white/10 bg-black/60 shadow-2xl backdrop-blur-md md:block"
      style={{ width: minimapWidth, height: height * mapScale }}
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
        className={`absolute border-2 border-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.2)] ${isDragging ? "cursor-grabbing" : "cursor-grab"} hover:bg-white/20`}
        style={{
          left: getMapX(viewport.x),
          top: getMapY(viewport.y),
          width: getMapW(viewport.width / scale),
          height: getMapH(viewport.height / scale),
          transition: isDragging ? "none" : "all 0.05s linear",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}
