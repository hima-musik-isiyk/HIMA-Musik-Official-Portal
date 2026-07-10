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
  const [sessionId, setSessionId] = useState<string>("");
  const sessionIdRef = useRef<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  const clampPosition = useCallback((x: number, y: number, s: number) => {
    let cx = x;
    let cy = y;

    // Bounds of the wall content (matches StickyNote limits)
    const MAX_X = 3000;
    const MAX_Y = 2000;

    const w = typeof window !== "undefined" ? window.innerWidth : 1000;
    const h = typeof window !== "undefined" ? window.innerHeight : 1000;

    // Allow panning so canvas corners can reach center of screen
    const minX = w / 2 - MAX_X * s;
    const maxX = w / 2 + MAX_X * s;
    cx = Math.max(minX, Math.min(maxX, cx));

    const minY = h / 2 - MAX_Y * s;
    const maxY = h / 2 + MAX_Y * s;
    cy = Math.max(minY, Math.min(maxY, cy));

    return { x: cx, y: cy };
  }, []);

  // Initialize and subscribe
  useEffect(() => {
    let storedSession = localStorage.getItem("the_wall_session_id");
    if (!storedSession) {
      storedSession = crypto.randomUUID();
      localStorage.setItem("the_wall_session_id", storedSession);
    }
    setSessionId(storedSession);
    sessionIdRef.current = storedSession;

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
            // Ignore our own updates to prevent race conditions during rapid consecutive local actions
            if (payload.new.session_id === sessionIdRef.current) return;

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

  // Handle preventDefault for wheel on desktop trackpad zooming and Safari gestures globally
  useEffect(() => {
    const preventDefaultWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    // Attach to document to ensure we catch all trackpad events while Wall is active
    document.addEventListener("wheel", preventDefaultWheel, { passive: false });
    document.addEventListener("gesturestart", preventGesture, {
      passive: false,
    });
    document.addEventListener("gesturechange", preventGesture, {
      passive: false,
    });
    document.addEventListener("gestureend", preventGesture, { passive: false });

    return () => {
      document.removeEventListener("wheel", preventDefaultWheel);
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
    };
  }, []);

  // Panning logic
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const activePointers = useRef<Map<number, React.PointerEvent>>(new Map());
  const initialPinchDist = useRef<number | null>(null);
  const initialScale = useRef<number>(1);
  const initialPinchCenter = useRef<{ x: number; y: number } | null>(null);
  const initialPinchPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    const isNote = !!(e.target as HTMLElement).closest(
      ".sticky-note-container",
    );
    const isUI = !!(e.target as HTMLElement).closest(".wall-ui");

    if (e.pointerType === "touch" || e.pointerType === "pen") {
      activePointers.current.set(e.pointerId, e);
      if (activePointers.current.size === 2) {
        setIsPanning(false);
        const pts = Array.from(activePointers.current.values());
        const dist = Math.hypot(
          pts[0].clientX - pts[1].clientX,
          pts[0].clientY - pts[1].clientY,
        );
        initialPinchDist.current = dist;
        initialScale.current = scale;
        initialPinchCenter.current = {
          x: (pts[0].clientX + pts[1].clientX) / 2,
          y: (pts[0].clientY + pts[1].clientY) / 2,
        };
        initialPinchPos.current = { ...position };
      } else if (activePointers.current.size === 1 && !isNote && !isUI) {
        setIsPanning(true);
        dragStart.current = {
          x: e.clientX,
          y: e.clientY,
          px: position.x,
          py: position.y,
        };
      }
      return;
    }

    if (e.button !== 0 || isNote || isUI) return;
    setIsPanning(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      px: position.x,
      py: position.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || e.pointerType === "pen") {
      if (activePointers.current.has(e.pointerId)) {
        activePointers.current.set(e.pointerId, e);
      }

      if (
        activePointers.current.size === 2 &&
        initialPinchDist.current &&
        initialPinchCenter.current &&
        initialPinchPos.current
      ) {
        const pts = Array.from(activePointers.current.values());
        const dist = Math.hypot(
          pts[0].clientX - pts[1].clientX,
          pts[0].clientY - pts[1].clientY,
        );

        const zoomFactor = dist / initialPinchDist.current;
        const newScale = Math.max(
          0.1,
          Math.min(3, initialScale.current * zoomFactor),
        );

        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const mouseX = initialPinchCenter.current.x - rect.left;
          const mouseY = initialPinchCenter.current.y - rect.top;

          const scaleChange = newScale - initialScale.current;

          setPosition(
            clampPosition(
              initialPinchPos.current.x -
                (mouseX - initialPinchPos.current.x) *
                  (scaleChange / initialScale.current),
              initialPinchPos.current.y -
                (mouseY - initialPinchPos.current.y) *
                  (scaleChange / initialScale.current),
              newScale,
            ),
          );
        }
        setScale(newScale);
        return;
      }
    }

    if (!isPanning) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPosition(
      clampPosition(
        dragStart.current.px + dx,
        dragStart.current.py + dy,
        scale,
      ),
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === "touch" || e.pointerType === "pen") {
      activePointers.current.delete(e.pointerId);
      if (activePointers.current.size < 2) {
        initialPinchDist.current = null;
        initialPinchCenter.current = null;
        initialPinchPos.current = null;
      }
      if (activePointers.current.size === 0) {
        setIsPanning(false);
      }
      return;
    }
    setIsPanning(false);
  };

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
        setPosition((prev) =>
          clampPosition(
            prev.x - (mouseX - prev.x) * (scaleChange / scale),
            prev.y - (mouseY - prev.y) * (scaleChange / scale),
            newScale,
          ),
        );
      }

      setScale(newScale);
    } else {
      // Pan
      setPosition((prev) =>
        clampPosition(prev.x - e.deltaX, prev.y - e.deltaY, scale),
      );
    }
  };

  const handleLocalPositionChange = useCallback(
    (id: string, x: number, y: number) => {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
    },
    [],
  );

  const handleLocalContentChange = useCallback(
    (id: string, content: string) => {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, content } : n)),
      );
    },
    [],
  );

  const handleZoomToCenter = useCallback(
    (delta: number) => {
      setScale((prevScale) => {
        const newScale = Math.max(0.1, Math.min(3, prevScale + delta));
        if (newScale === prevScale) return prevScale;

        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const mouseX = rect.width / 2;
          const mouseY = rect.height / 2;

          const scaleChange = newScale - prevScale;
          setPosition((prevPos) =>
            clampPosition(
              prevPos.x - (mouseX - prevPos.x) * (scaleChange / prevScale),
              prevPos.y - (mouseY - prevPos.y) * (scaleChange / prevScale),
              newScale,
            ),
          );
        }
        return newScale;
      });
    },
    [clampPosition],
  );

  const handleMinimapPan = useCallback(
    (dx: number, dy: number) => {
      setPosition((prev) => clampPosition(prev.x + dx, prev.y + dy, scale));
    },
    [scale, clampPosition],
  );

  const viewportCenter = {
    x: (-position.x + viewport.width / 2) / scale,
    y: (-position.y + viewport.height / 2) / scale,
  };

  useEffect(() => {
    if (boardId && containerRef.current) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setPosition(clampPosition(w / 2, h / 2, 1)); // (0,0) perfectly centered
    }
  }, [boardId, clampPosition]);

  if (!boardId) {
    return (
      <div className="fixed inset-x-0 top-[5rem] bottom-0 z-40 flex w-full items-center justify-center bg-[#0a0a0a]">
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
      className="fixed inset-x-0 top-[5rem] bottom-0 z-40 w-full touch-none overflow-hidden bg-[#0a0a0a] select-none"
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
              onContentChangeLocally={handleLocalContentChange}
              sessionId={sessionId}
            />
          </div>
        ))}
      </div>

      {/* Overlays */}
      <div className="wall-ui">
        <WallZoomControls
          scale={scale}
          onZoomIn={() => handleZoomToCenter(0.2)}
          onZoomOut={() => handleZoomToCenter(-0.2)}
          onReset={() => {
            setScale(1);
            if (containerRef.current) {
              const w = window.innerWidth;
              const h = window.innerHeight;
              setPosition(clampPosition(w / 2, h / 2, 1));
            } else {
              setPosition(clampPosition(500, 500, 1));
            }
          }}
        />

        <WallMinimap
          notes={notes}
          scale={scale}
          viewport={viewport}
          onPan={handleMinimapPan}
        />

        <WallDock
          boardId={boardId}
          viewportCenter={viewportCenter}
          sessionId={sessionId}
        />
      </div>
    </div>
  );
}
