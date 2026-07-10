"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  session_id?: string;
}

interface StickyNoteProps {
  note: WallNoteData;
  scale: number;
  onPositionChangeLocally: (id: string, x: number, y: number) => void;
  onContentChangeLocally: (id: string, content: string) => void;
  sessionId: string;
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
  onContentChangeLocally,
  sessionId,
}: StickyNoteProps) {
  const noteRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const dragStart = useRef({ x: 0, y: 0, initialNoteX: 0, initialNoteY: 0 });
  const isOwner = Boolean(sessionId && note.session_id === sessionId);

  // Deterministic random rotation based on UUID (e.g. ranges from -4deg to +4deg)
  // UUIDs are hex strings. Take the first 4 chars, convert to int, modulo 9, minus 4.
  const rotation = useMemo(() => {
    const hash = parseInt(note.id.substring(0, 4), 16) || 0;
    return (hash % 9) - 4;
  }, [note.id]);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      // Calculate delta divided by scale to get true board coordinates
      const deltaX = (e.clientX - dragStart.current.x) / scale;
      const deltaY = (e.clientY - dragStart.current.y) / scale;

      const newX = Math.max(
        -3000,
        Math.min(3000, dragStart.current.initialNoteX + deltaX),
      );
      const newY = Math.max(
        -2000,
        Math.min(2000, dragStart.current.initialNoteY + deltaY),
      );

      onPositionChangeLocally(note.id, newX, newY);
    };

    const handlePointerUp = async (e: PointerEvent) => {
      setIsDragging(false);

      const deltaX = (e.clientX - dragStart.current.x) / scale;
      const deltaY = (e.clientY - dragStart.current.y) / scale;
      const newX = Math.max(
        -3000,
        Math.min(3000, dragStart.current.initialNoteX + deltaX),
      );
      const newY = Math.max(
        -2000,
        Math.min(2000, dragStart.current.initialNoteY + deltaY),
      );

      // Final local update to lock position before DB request
      onPositionChangeLocally(note.id, newX, newY);

      // Optimistically done in move, now commit to DB
      await updateWallNotePosition({
        note_id: note.id,
        board_id: note.board_id,
        x: newX,
        y: newY,
        session_id: sessionId,
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
    if (e.button !== 0) return; // only left click
    if (!isOwner) return; // Only owner can drag
    if (isEditing) return; // Don't drag while editing

    const target = e.target as HTMLElement;
    // Don't drag if selecting text
    if (
      (target.tagName.toLowerCase() === "p" ||
        target.tagName.toLowerCase() === "textarea") &&
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
      className={`absolute w-64 border p-4 shadow-xl ${colorClasses} ${isOwner ? (isDragging ? "z-40 cursor-grabbing opacity-90" : "z-10 cursor-grab") : "z-10"} transition-colors`}
      style={{
        transform: `translate(${note.x}px, ${note.y}px) rotate(${isDragging ? 0 : rotation}deg)`,
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
        <span className="max-w-[120px] truncate font-semibold">
          {note.author}
        </span>
        <div className="flex items-center gap-2">
          <span>{new Date(note.created_at).toLocaleDateString()}</span>
          {isOwner && (
            <>
              <button
                className="font-bold text-blue-500 transition-colors hover:text-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                title="Edit Note"
              >
                ✎
              </button>
              <button
                className="text-lg leading-none font-bold text-red-500 transition-colors hover:text-red-700"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm("Are you sure you want to delete your note?")) {
                    const { deleteWallNote } =
                      await import("@/lib/the-wall-actions");
                    await deleteWallNote({
                      note_id: note.id,
                      board_id: note.board_id,
                      session_id: sessionId,
                    });
                  }
                }}
                title="Delete Note"
              >
                ×
              </button>
            </>
          )}
        </div>
      </div>
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea
            className="h-24 w-full resize-none bg-black/10 p-2 text-sm text-black focus:ring-1 focus:ring-black/20 focus:outline-none"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            maxLength={500}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button
              className="rounded bg-black/10 px-2 py-1 text-xs hover:bg-black/20"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(false);
                setEditContent(note.content);
              }}
            >
              Cancel
            </button>
            <button
              className="rounded bg-blue-500/80 px-2 py-1 text-xs text-white hover:bg-blue-600"
              onClick={async (e) => {
                e.stopPropagation();
                if (!editContent.trim()) return;
                setIsEditing(false);

                // Optimistically update locally
                onContentChangeLocally(note.id, editContent);

                const { updateWallNoteContent } =
                  await import("@/lib/the-wall-actions");
                await updateWallNoteContent({
                  note_id: note.id,
                  board_id: note.board_id,
                  session_id: sessionId,
                  content: editContent,
                });
              }}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm break-words whitespace-pre-wrap">
          {note.content}
        </p>
      )}
    </div>
  );
}
