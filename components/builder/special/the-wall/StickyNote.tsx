"use client";

import { useEffect, useRef, useState } from "react";

import { updateWallNotePosition } from "@/lib/the-wall-actions";

export interface WallNoteData {
  id: string;
  board_id: string;
  content: string;
  author: string;
  color: string;
  x: number;
  y: number;
  created_at: string;
}

interface StickyNoteProps {
  note: WallNoteData;
  scale: number;
  onPositionChangeLocally: (id: string, x: number, y: number) => void;
}

const COLOR_MAP: Record<string, string> = {
  yellow: "bg-amber-200 text-amber-900 border-amber-300",
  blue: "bg-blue-200 text-blue-900 border-blue-300",
  green: "bg-emerald-200 text-emerald-900 border-emerald-300",
  pink: "bg-pink-200 text-pink-900 border-pink-300",
  gold: "bg-[#ff6501]/20 text-white border-gold-500/30",
};

export default function StickyNote({
  note,
  scale,
  onPositionChangeLocally,
}: StickyNoteProps) {
  const noteRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, initialNoteX: 0, initialNoteY: 0 });

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      // Calculate delta divided by scale to get true board coordinates
      const deltaX = (e.clientX - dragStart.current.x) / scale;
      const deltaY = (e.clientY - dragStart.current.y) / scale;

      const newX = dragStart.current.initialNoteX + deltaX;
      const newY = dragStart.current.initialNoteY + deltaY;

      onPositionChangeLocally(note.id, newX, newY);
    };

    const handlePointerUp = async (e: PointerEvent) => {
      setIsDragging(false);

      const deltaX = (e.clientX - dragStart.current.x) / scale;
      const deltaY = (e.clientY - dragStart.current.y) / scale;
      const newX = dragStart.current.initialNoteX + deltaX;
      const newY = dragStart.current.initialNoteY + deltaY;

      // Optimistically done in move, now commit to DB
      await updateWallNotePosition({
        note_id: note.id,
        board_id: note.board_id,
        x: newX,
        y: newY,
      });
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging, scale, note.id, note.board_id, onPositionChangeLocally]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation(); // prevent panning the board
    if (e.button !== 0) return; // only left click
    const target = e.target as HTMLElement;
    // Don't drag if selecting text
    if (
      target.tagName.toLowerCase() === "p" &&
      window.getSelection()?.toString()
    )
      return;

    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      initialNoteX: note.x,
      initialNoteY: note.y,
    };
  };

  const colorClasses = COLOR_MAP[note.color] || COLOR_MAP.yellow;
  const isDark = note.color === "gold";

  return (
    <div
      ref={noteRef}
      onPointerDown={handlePointerDown}
      className={`absolute w-64 border p-4 shadow-xl ${colorClasses} ${isDragging ? "z-40 cursor-grabbing opacity-90" : "z-10 cursor-grab"} transition-colors`}
      style={{
        transform: `translate(${note.x}px, ${note.y}px)`,
        // We use translate instead of left/top for better performance
        // but it requires position: absolute on the container
        left: 0,
        top: 0,
        // Sharp edges requirement
        borderRadius: "0",
      }}
    >
      <div
        className={`mb-3 border-b pb-2 ${isDark ? "border-white/10 text-white/50" : "border-black/10 text-black/50"} flex items-center justify-between text-xs`}
      >
        <span className="max-w-[150px] truncate font-semibold">
          {note.author}
        </span>
        <span>{new Date(note.created_at).toLocaleDateString()}</span>
      </div>
      <p className="text-sm break-words whitespace-pre-wrap">{note.content}</p>
    </div>
  );
}
