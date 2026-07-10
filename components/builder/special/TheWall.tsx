"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase";

import StickyNote, { WallNoteData } from "./the-wall/StickyNote";
import WallDock from "./the-wall/WallDock";
import WallMinimap from "./the-wall/WallMinimap";
import WallZoomControls from "./the-wall/WallZoomControls";

export default function TheWall() {
  const [boardId, setBoardId] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [notes, setNotes] = useState<WallNoteData[]>([]);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [viewport, setViewport] = useState({
    x: 0,
    y: 0,
    width: 1000,
    height: 1000,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize and subscribe
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setConnectionError("Supabase credentials are missing.");
      return;
    }

    let activeBoardId: string | null = null;

    const fetchBoardAndNotes = async () => {
      // 1. Get active board
      const { data: boards, error: boardsError } = await supabase
        .from("the_wall_boards")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (boardsError) {
        setConnectionError("The Wall database is not ready.");
        return;
      }

      if (!boards || boards.length === 0) {
        setConnectionError("No active wall board found.");
        return;
      }

      setConnectionError(null);

      if (boards && boards.length > 0) {
        activeBoardId = boards[0].id;
        setBoardId(activeBoardId);

        // 2. Fetch notes
        const { data: initialNotes, error: notesError } = await supabase
          .from("the_wall_notes")
          .select("*")
          .eq("board_id", activeBoardId)
          .order("created_at", { ascending: true });

        if (notesError) {
          setConnectionError("Wall notes could not be loaded.");
          return;
        }

        if (initialNotes) {
          setNotes(initialNotes as WallNoteData[]);
        }
      }
    };

    fetchBoardAndNotes();

    // 3. Subscribe to Realtime
    const channel = supabase
      .channel("the_wall_notes_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "the_wall_notes",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotes((prev) => {
              // avoid duplicate if we are the sender
              if (prev.some((n) => n.id === payload.new.id)) return prev;
              return [...prev, payload.new as WallNoteData];
            });
          } else if (payload.eventType === "UPDATE") {
            setNotes((prev) =>
              prev.map((n) =>
                n.id === payload.new.id ? { ...n, ...payload.new } : n,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setNotes((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Viewport tracking for minimap
  useEffect(() => {
    const updateViewport = () => {
      if (containerRef.current) {
        setViewport({
          x: -position.x / scale,
          y: -position.y / scale,
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, [position, scale]);

  // Panning logic
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // only left click
    // Only pan if clicking on the background, not on a note
    if ((e.target as HTMLElement).closest(".sticky-note-container")) return;
    if ((e.target as HTMLElement).closest(".wall-ui")) return;

    setIsPanning(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      px: position.x,
      py: position.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPosition({
      x: dragStart.current.px + dx,
      y: dragStart.current.py + dy,
    });
  };

  const handlePointerUp = () => setIsPanning(false);

  // Wheel to pan (or zoom if cmd/ctrl)
  const handleWheel = (e: React.WheelEvent) => {
    // Only zoom/pan if the target isn't inside a scrolling element like textarea
    if ((e.target as HTMLElement).closest("textarea")) return;

    if (e.ctrlKey || e.metaKey) {
      // Zoom
      e.preventDefault();
      const zoomSensitivity = 0.01;
      const newScale = Math.max(
        0.1,
        Math.min(3, scale - e.deltaY * zoomSensitivity),
      );

      // Calculate mouse position relative to container to zoom towards mouse
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const scaleChange = newScale - scale;
        setPosition((prev) => ({
          x: prev.x - (mouseX - prev.x) * (scaleChange / scale),
          y: prev.y - (mouseY - prev.y) * (scaleChange / scale),
        }));
      }

      setScale(newScale);
    } else {
      // Pan
      setPosition((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  const handleLocalPositionChange = useCallback(
    (id: string, x: number, y: number) => {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    },
    [],
  );

  // Compute center for new notes using viewport state which is safe from hydration mismatches
  const viewportCenter = {
    x: (-position.x + viewport.width / 2) / scale,
    y: (-position.y + viewport.height / 2) / scale,
  };

  if (!boardId) {
    return (
      <div className="flex h-[calc(100svh-5rem)] min-h-[32rem] w-full items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <p className="animate-pulse font-serif text-2xl text-white/50">
            The Wall
          </p>
          <p className="mt-2 text-sm text-white/30">
            {connectionError ?? "Waiting for connection..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-[calc(100svh-5rem)] min-h-[32rem] w-full touch-none overflow-hidden bg-[#0a0a0a] select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      ref={containerRef}
    >
      {/* Grid Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(#ffffff 2px, transparent 2px)",
          backgroundSize: `${50 * scale}px ${50 * scale}px`,
          backgroundPosition: `${position.x}px ${position.y}px`,
        }}
      />

      {/* Canvas */}
      <div
        className="absolute inset-0 transform-gpu"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {notes.map((note) => (
          <div key={note.id} className="sticky-note-container absolute">
            <StickyNote
              note={note}
              scale={scale}
              onPositionChangeLocally={handleLocalPositionChange}
            />
          </div>
        ))}
      </div>

      {/* Overlays */}
      <div className="wall-ui">
        <WallZoomControls
          scale={scale}
          onZoomIn={() => setScale((s) => Math.min(3, s + 0.1))}
          onZoomOut={() => setScale((s) => Math.max(0.1, s - 0.1))}
          onReset={() => {
            setScale(1);
            setPosition({ x: 0, y: 0 });
          }}
        />

        <WallMinimap notes={notes} scale={scale} viewport={viewport} />

        <WallDock boardId={boardId} viewportCenter={viewportCenter} />
      </div>
    </div>
  );
}
