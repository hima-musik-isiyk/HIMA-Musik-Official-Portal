"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  Bell,
  Check,
  Clipboard,
  Copy,
  Edit,
  Edit3,
  ExternalLink,
  Flag,
  Handshake,
  Loader2,
  LogOut,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Plus,
  RefreshCw,
  Trash,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  type ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { create } from "zustand";

import {
  extractNotionPageId,
  NOTION_ROOM_PAGE_TYPES,
  type NotionRoom,
  type NotionRoomPage,
  type NotionRoomPageType,
} from "@/lib/notion-room/types";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import useIsomorphicLayoutEffect from "@/lib/useIsomorphicLayoutEffect";
import useViewEntrance from "@/lib/useViewEntrance";

type PeerState = {
  displayName: string;
  selectedPageIds: string[];
  onlineAt: string;
};

type RoomStore = {
  displayName: string;
  currentRoomId: string;
  selectedPageIds: string[];
  chronologicalPages: NotionRoomPage[];
  setDisplayName: (displayName: string) => void;
  setCurrentRoomId: (currentRoomId: string) => void;
  setSelectedPageIds: (selectedPageIds: string[]) => void;
  setChronologicalPages: (chronologicalPages: NotionRoomPage[]) => void;
  appendPage: (page: NotionRoomPage) => void;
  resetRoom: () => void;
};

const pageIdPattern =
  /^[0-9a-fA-F]{32}$|^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const roomsCacheKey = "notion-secret-page.rooms";

const typeIcons: Record<
  NotionRoomPageType,
  ComponentType<{ className?: string }>
> = {
  User: UserPlus,
  Response: MessageSquare,
  Agreement: Handshake,
  Checkpoint: Flag,
  Attachment: Paperclip,
};

const useRoomStore = create<RoomStore>((set) => ({
  displayName: "",
  currentRoomId: "",
  selectedPageIds: [],
  chronologicalPages: [],
  setDisplayName: (displayName) => set({ displayName }),
  setCurrentRoomId: (currentRoomId) => set({ currentRoomId }),
  setSelectedPageIds: (selectedPageIds) => set({ selectedPageIds }),
  setChronologicalPages: (chronologicalPages) => set({ chronologicalPages }),
  appendPage: (page) =>
    set((state) => ({
      chronologicalPages: [...state.chronologicalPages, page],
    })),
  resetRoom: () =>
    set({ currentRoomId: "", selectedPageIds: [], chronologicalPages: [] }),
}));

function isValidPageId(value: string) {
  return pageIdPattern.test(extractNotionPageId(value));
}

// Supabase client instance is acquired via getSupabaseBrowserClient() singleton helper in effects.

function getRoomSlug(room: Pick<NotionRoom, "id" | "name">) {
  const slug = room.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || room.id;
}

function readCachedRooms() {
  try {
    const raw = localStorage.getItem(roomsCacheKey);
    if (!raw) return [];
    const cached = JSON.parse(raw) as NotionRoom[];
    return Array.isArray(cached) ? cached : [];
  } catch {
    return [];
  }
}

function writeCachedRooms(rooms: NotionRoom[]) {
  localStorage.setItem(roomsCacheKey, JSON.stringify(rooms));
}

export default function NotionSecretPage() {
  const params = useParams<{ slug?: string }>();
  const pathname = usePathname() || "/notion-secret-page";
  const router = useRouter();
  const {
    displayName,
    currentRoomId,
    selectedPageIds,
    chronologicalPages,
    setDisplayName,
    setCurrentRoomId,
    setSelectedPageIds,
    setChronologicalPages,
    appendPage,
    resetRoom,
  } = useRoomStore();

  const [nameInput, setNameInput] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [roomNameInput, setRoomNameInput] = useState("");
  const [rooms, setRooms] = useState<NotionRoom[]>([]);
  const [roomsHydrated, setRoomsHydrated] = useState(false);
  const [roomSkeletonCount, setRoomSkeletonCount] = useState(3);
  const [currentRoomName, setCurrentRoomName] = useState("");
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [roomStructureAnimatedId, setRoomStructureAnimatedId] = useState<
    string | null
  >(null);
  const [roomPagesAnimatedId, setRoomPagesAnimatedId] = useState<string | null>(
    null,
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [hasLoadedCurrentRoomPages, setHasLoadedCurrentRoomPages] =
    useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [creatingType, setCreatingType] = useState<NotionRoomPageType | null>(
    null,
  );
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    room: NotionRoom;
  } | null>(null);
  const [editingRoom, setEditingRoom] = useState<NotionRoom | null>(null);
  const [peers, setPeers] = useState<Record<string, PeerState>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const roomsChannelRef = useRef<RealtimeChannel | null>(null);
  const selectedPageIdsRef = useRef<string[]>([]);
  const hasOpenedRouteRoomRef = useRef(false);
  const isNavigatingToRoomRef = useRef(false);
  const presenceKeyRef = useRef(crypto.randomUUID());
  const lastTrackedPayloadRef = useRef<string>("");

  const selectedPages = useMemo(
    () =>
      chronologicalPages.filter((page) => selectedPageIds.includes(page.id)),
    [chronologicalPages, selectedPageIds],
  );
  const currentRoom = useMemo(
    () => rooms.find((room) => room.id === currentRoomId),
    [currentRoomId, rooms],
  );
  const routeSlug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const isRouteMatchingStore = Boolean(
    !routeSlug ||
    (currentRoomId &&
      (currentRoomId === routeSlug ||
        (currentRoom && getRoomSlug(currentRoom) === routeSlug))),
  );

  const displayRoomName = isRouteMatchingStore ? currentRoomName : "";
  const displayPages = isRouteMatchingStore ? chronologicalPages : [];
  const displayPeers = isRouteMatchingStore ? peers : {};
  const displaySelectedPages = isRouteMatchingStore ? selectedPages : [];

  const showRoomSkeletons =
    (!roomsHydrated || isLoadingRooms) && rooms.length === 0;
  const showPageSkeletons =
    (Boolean(routeSlug) && !isRouteMatchingStore) ||
    (isLoadingPages && !hasLoadedCurrentRoomPages && displayPages.length === 0);
  const shouldShowRoom =
    Boolean(routeSlug) ||
    (Boolean(currentRoomId) && isNavigatingToRoomRef.current);

  const scopeRef = useViewEntrance(pathname, [
    shouldShowRoom,
    hasLoadedCurrentRoomPages,
    displayPages.length,
  ]);

  useEffect(() => {
    selectedPageIdsRef.current = selectedPageIds;
  }, [selectedPageIds]);

  // Auto-clear status messages after 4 seconds to prevent sustained alert visibility
  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => {
      setStatus("");
    }, 4000);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (currentRoom?.name) setCurrentRoomName(currentRoom.name);
  }, [currentRoom?.name]);

  useEffect(() => {
    const storedName =
      localStorage.getItem("notion-room-display-name") ?? "Operator";
    setNameInput(storedName);
    setDisplayName(storedName);

    const cachedRooms = readCachedRooms();
    if (cachedRooms.length > 0) {
      setRooms(cachedRooms);
      setRoomSkeletonCount(cachedRooms.length);
    }
    setRoomsHydrated(true);
  }, [setDisplayName]);

  const loadRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    setError("");
    try {
      const response = await fetch("/api/notion/rooms");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to load rooms");
      const nextRooms = data.rooms ?? [];
      setRooms(nextRooms);
      setRoomSkeletonCount(Math.max(nextRooms.length, 1));
      writeCachedRooms(nextRooms);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to load rooms",
      );
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  const saveRoom = useCallback(async (roomId: string, name?: string) => {
    const response = await fetch("/api/notion/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: roomId, name }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Failed to save room");
    setRooms((current) => {
      const nextRooms = [
        data.room,
        ...current.filter((room) => room.id !== data.room.id),
      ];
      setRoomSkeletonCount(Math.max(nextRooms.length, 1));
      writeCachedRooms(nextRooms);
      return nextRooms;
    });
    return data.room as NotionRoom;
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("notion-rooms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notion_rooms" },
        () => {
          void loadRooms();
        },
      )
      .on("broadcast", { event: "rooms-refresh" }, () => {
        void loadRooms();
      })
      .subscribe();

    roomsChannelRef.current = channel;
    return () => {
      void supabase.removeChannel(channel);
      roomsChannelRef.current = null;
    };
  }, [loadRooms]);

  const loadPages = useCallback(
    async (roomId: string, quiet = false, ignoreCache = false) => {
      let isQuiet = quiet;
      let cached: NotionRoomPage[] = [];

      if (!ignoreCache) {
        try {
          const raw = localStorage.getItem(
            `notion-secret-page.pages.${roomId}`,
          );
          if (raw) {
            cached = JSON.parse(raw) as NotionRoomPage[];
          }
        } catch (e) {
          console.error("Failed to read page cache:", e);
        }
      }

      if (cached.length > 0 && !quiet) {
        setChronologicalPages(cached);
        setHasLoadedCurrentRoomPages(true);
        isQuiet = true;
      }

      if (!isQuiet) {
        setIsLoadingPages(true);
        setHasLoadedCurrentRoomPages(false);
        setError("");
        setChronologicalPages([]);
      }

      try {
        const response = await fetch(
          `/api/notion/pages?roomId=${encodeURIComponent(roomId)}`,
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Failed to load pages");

        const nextPages = data.pages ?? [];
        setChronologicalPages(nextPages);

        try {
          localStorage.setItem(
            `notion-secret-page.pages.${roomId}`,
            JSON.stringify(nextPages),
          );
        } catch (e) {
          console.error("Failed to write page cache:", e);
        }

        if (!isQuiet) setStatus("Synced with Notion.");
      } catch (caught) {
        if (!isQuiet) {
          setError(caught instanceof Error ? caught.message : "Failed to load");
        }
      } finally {
        setHasLoadedCurrentRoomPages(true);
        if (!isQuiet) setIsLoadingPages(false);
      }
    },
    [setChronologicalPages],
  );

  useEffect(() => {
    if (!currentRoomId || !displayName) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setStatus("Realtime off: set Supabase env.");
      return;
    }

    const channel = supabase.channel(`room-${currentRoomId}`, {
      config: { presence: { key: presenceKeyRef.current } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PeerState>();
        const nextPeers: Record<string, PeerState> = {};
        for (const [key, values] of Object.entries(state)) {
          const typedValues = values as unknown as PeerState[];
          const first = typedValues[0];
          if (first?.displayName) nextPeers[key] = first;
        }
        setPeers(nextPeers);
      })
      .on("broadcast", { event: "selection" }, ({ payload }) => {
        setPeers((current) => ({
          ...current,
          [payload.clientId ?? payload.displayName]: payload,
        }));
      })
      .on("broadcast", { event: "notion-room-refresh" }, () => {
        setStatus("Notion changed. Refreshing room.");
        void loadPages(currentRoomId, false, true);
      })
      .subscribe(async (state) => {
        if (state === "SUBSCRIBED") {
          await channel.track({
            displayName,
            selectedPageIds: selectedPageIdsRef.current,
            onlineAt: new Date().toISOString(),
          });
          setStatus("Realtime active.");
        }
      });

    channelRef.current = channel;
    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [currentRoomId, displayName, loadPages]);

  useEffect(() => {
    const channel = channelRef.current;
    if (!channel || !displayName) return;

    // Skip redundant updates to avoid infinite sync/render loops (ISSUE 4)
    const stateIdentifier = JSON.stringify({ displayName, selectedPageIds });
    if (stateIdentifier === lastTrackedPayloadRef.current) return;
    lastTrackedPayloadRef.current = stateIdentifier;

    const payload = {
      displayName,
      selectedPageIds,
      onlineAt: new Date().toISOString(),
    };

    void channel.track(payload);

    // Safeguard channel state: only send via websocket if the connection is fully joined
    // This resolves the send() falling back to REST API warning (ISSUE 2)
    if ((channel as any).state === "joined") {
      void channel.send({ type: "broadcast", event: "selection", payload });
    }
  }, [displayName, selectedPageIds]);

  const openRoom = useCallback(
    async (roomId: string, name?: string, updateUrl = true) => {
      const normalizedRoomId = extractNotionPageId(roomId);
      if (!isValidPageId(roomId)) {
        setError("Paste a Notion page URL or 32-character page ID.");
        return;
      }

      isNavigatingToRoomRef.current = updateUrl;

      // Look up if room already exists in rooms list to prevent redundant Notion API and Supabase network requests
      const existingRoom = rooms.find((r) => r.id === normalizedRoomId);

      setCurrentRoomName(
        name?.trim() ||
          existingRoom?.name ||
          `Room ${normalizedRoomId.slice(0, 6)}`,
      );
      setHasLoadedCurrentRoomPages(false);
      setChronologicalPages([]);
      setCurrentRoomId(normalizedRoomId);
      setSelectedPageIds([]);

      let room = existingRoom;
      if (!existingRoom) {
        try {
          room = await saveRoom(normalizedRoomId, name);
        } catch (caught) {
          setError(
            caught instanceof Error ? caught.message : "Failed to save room",
          );
          return;
        }
      }

      if (room) {
        setCurrentRoomName(room.name);
        if (updateUrl) {
          router.push(`/notion-secret-page/${getRoomSlug(room)}`);
        }
        const roomsChannel = roomsChannelRef.current;
        if (roomsChannel && (roomsChannel as any).state === "joined") {
          void roomsChannel.send({
            type: "broadcast",
            event: "rooms-refresh",
            payload: { roomId: normalizedRoomId },
          });
        }
      }

      window.scrollTo({ top: 0 });
      await loadPages(normalizedRoomId);
    },
    [
      loadPages,
      router,
      saveRoom,
      setCurrentRoomId,
      setSelectedPageIds,
      setChronologicalPages,
      rooms,
    ],
  );

  useEffect(() => {
    if (!routeSlug) {
      if (currentRoomId && !isNavigatingToRoomRef.current) {
        resetRoom();
        setCurrentRoomName("");
        setHasLoadedCurrentRoomPages(false);
        setPeers({});
        setStatus("");
        setError("");
        hasOpenedRouteRoomRef.current = false;
      }
      return;
    }

    const currentSlug = currentRoom ? getRoomSlug(currentRoom) : null;
    const isMatch = currentRoomId === routeSlug || currentSlug === routeSlug;

    if (isMatch) {
      isNavigatingToRoomRef.current = false;
      return;
    }

    // While actively navigating to a room, don't reset on transient mismatches
    if (isNavigatingToRoomRef.current) return;

    if (currentRoomId && !isMatch) {
      resetRoom();
      setCurrentRoomName("");
      setHasLoadedCurrentRoomPages(false);
      setPeers({});
      setStatus("");
      setError("");
      hasOpenedRouteRoomRef.current = false;
    }
  }, [currentRoomId, currentRoom, resetRoom, routeSlug]);

  // Manage room structure view entrance sequence state
  useIsomorphicLayoutEffect(() => {
    if (!shouldShowRoom) {
      if (roomStructureAnimatedId !== null) {
        setRoomStructureAnimatedId(null);
      }
      return;
    }
    if (currentRoomId && roomStructureAnimatedId !== currentRoomId) {
      setRoomStructureAnimatedId(currentRoomId);
    }
  }, [shouldShowRoom, currentRoomId, roomStructureAnimatedId]);

  // Manage room pages view entrance sequence state
  useIsomorphicLayoutEffect(() => {
    if (!shouldShowRoom) {
      if (roomPagesAnimatedId !== null) {
        setRoomPagesAnimatedId(null);
      }
      return;
    }
    if (
      hasLoadedCurrentRoomPages &&
      currentRoomId &&
      roomPagesAnimatedId !== currentRoomId
    ) {
      setRoomPagesAnimatedId(currentRoomId);
    }
  }, [
    shouldShowRoom,
    hasLoadedCurrentRoomPages,
    currentRoomId,
    roomPagesAnimatedId,
  ]);

  useEffect(() => {
    if (!routeSlug || currentRoomId || hasOpenedRouteRoomRef.current) return;

    const matchedRoom = rooms.find(
      (room) => getRoomSlug(room) === routeSlug || room.id === routeSlug,
    );

    if (matchedRoom) {
      hasOpenedRouteRoomRef.current = true;
      void openRoom(matchedRoom.id, matchedRoom.name, false);
    } else if (isValidPageId(routeSlug)) {
      hasOpenedRouteRoomRef.current = true;
      void openRoom(routeSlug, undefined, false);
    } else if (roomsHydrated && !isLoadingRooms) {
      hasOpenedRouteRoomRef.current = true;
      setError("Room not found or invalid ID.");
    }
  }, [
    currentRoomId,
    isLoadingRooms,
    openRoom,
    rooms,
    roomsHydrated,
    routeSlug,
  ]);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  const deleteRoom = async (roomId: string) => {
    if (!window.confirm("Delete this room permanently?")) return;
    setError("");
    try {
      const response = await fetch(`/api/notion/rooms?id=${roomId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete room");
      setRooms((current) => current.filter((r) => r.id !== roomId));
      writeCachedRooms(rooms.filter((r) => r.id !== roomId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const updateRoom = async (
    roomId: string,
    updates: { name?: string; id_override?: string },
  ) => {
    setError("");
    try {
      const response = await fetch("/api/notion/rooms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roomId, ...updates }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Update failed");
      setRooms((current) =>
        current.map((r) => (r.id === roomId ? data.room : r)),
      );
      writeCachedRooms(rooms.map((r) => (r.id === roomId ? data.room : r)));
      setEditingRoom(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  };

  async function addRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await openRoom(roomInput, roomNameInput);
  }

  function saveDisplayName() {
    const nextName = nameInput.trim() || "Operator";
    localStorage.setItem("notion-room-display-name", nextName);
    setDisplayName(nextName);
    setNameInput(nextName);
    setIsEditingName(false);
  }

  function togglePage(pageId: string) {
    setSelectedPageIds(
      selectedPageIds.includes(pageId)
        ? selectedPageIds.filter((id) => id !== pageId)
        : [...selectedPageIds, pageId],
    );
  }

  function selectAll() {
    setSelectedPageIds(chronologicalPages.map((page) => page.id));
  }

  async function compileContext() {
    if (selectedPageIds.length === 0) return;
    setIsCompiling(true);
    setError("");
    setStatus("");
    try {
      const response = await fetch("/api/notion/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageIds: selectedPageIds }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to compile");
      await navigator.clipboard.writeText(data.content);
      setStatus(`Copied ${selectedPageIds.length} pages.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to compile");
    } finally {
      setIsCompiling(false);
    }
  }

  async function createPage(pageType: NotionRoomPageType) {
    if (!currentRoomId) return;
    setCreatingType(pageType);
    setError("");

    const tempPage: NotionRoomPage = {
      id: `temp-${Date.now()}`,
      title: "... Creating",
      createdTime: new Date().toISOString(),
      number:
        Math.max(0, ...chronologicalPages.map((page) => page.number ?? 0)) + 1,
      type: pageType,
    };
    appendPage(tempPage);

    try {
      const response = await fetch("/api/notion/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: currentRoomId,
          pageType,
          referenceIds: pageType === "Response" ? selectedPageIds : [],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to create page");
      setStatus(`Created ${data.page.title}.`);
      await loadPages(currentRoomId, false, true);
      void channelRef.current?.send({
        type: "broadcast",
        event: "notion-room-refresh",
        payload: { roomId: currentRoomId },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to create");
      await loadPages(currentRoomId, true);
    } finally {
      setCreatingType(null);
    }
  }

  function leaveRoom() {
    resetRoom();
    setCurrentRoomName("");
    setHasLoadedCurrentRoomPages(false);
    setRoomInput("");
    setRoomNameInput("");
    setPeers({});
    setStatus("");
    setError("");
    hasOpenedRouteRoomRef.current = false;
    router.push("/notion-secret-page");
    window.scrollTo({ top: 0 });
  }

  if (!shouldShowRoom) {
    return (
      <section
        ref={scopeRef}
        className="relative min-h-[calc(100svh-5rem)] overflow-hidden border-b border-white/5 px-6 py-16 md:px-10 lg:px-16"
      >
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_10%,rgba(255,101,1,0.12),transparent_32%),radial-gradient(circle_at_20%_80%,rgba(120,113,108,0.18),transparent_30%)]" />
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-4xl">
            <div data-animate="up" className="mb-4 flex items-center gap-4">
              <span className="bg-gold-500/40 block h-px w-12" />
              <span className="text-[0.65rem] font-medium tracking-[0.4em] text-stone-600 uppercase">
                Notion Sync
              </span>
            </div>
            <h1
              data-animate="up"
              data-animate-delay="0.1"
              className="font-serif text-5xl leading-tight font-normal text-white md:text-7xl"
            >
              Context <br />
              <span className="font-light text-stone-500 italic">Rooms</span>
            </h1>
            <div
              data-animate="up"
              data-animate-delay="0.2"
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              {isEditingName ? (
                <div className="flex items-center gap-2 rounded-xl border border-stone-800/80 bg-stone-900/30 p-2">
                  <input
                    value={nameInput}
                    onChange={(event) => setNameInput(event.target.value)}
                    className="w-44 bg-transparent px-3 py-2 text-sm text-white outline-none"
                    placeholder="Display name"
                  />
                  <button
                    onClick={saveDisplayName}
                    className="hover:bg-gold-500 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-stone-950 transition"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="group hover:border-gold-500/40 inline-flex items-center gap-3 rounded-xl border border-stone-800/80 bg-stone-900/30 px-5 py-3 text-sm text-stone-300 transition hover:bg-stone-900/60"
                >
                  <Users className="text-gold-500 h-4 w-4" />
                  {displayName || "Operator"}
                  <Edit3 className="group-hover:text-gold-500 h-3.5 w-3.5 text-stone-600 transition" />
                </button>
              )}
              <button
                onClick={() => setIsAddingRoom((value) => !value)}
                className="hover:bg-gold-500 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-stone-950 transition"
              >
                {isAddingRoom ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {isAddingRoom ? "Close" : "Add Room"}
              </button>
              <button
                onClick={() => void loadRooms()}
                className="hover:border-gold-500/40 inline-flex items-center gap-2 rounded-xl border border-stone-800/80 bg-stone-900/30 px-5 py-3 text-sm text-stone-300 transition"
              >
                {isLoadingRooms ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Sync Rooms
              </button>
            </div>
          </div>

          {editingRoom && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
              <div className="w-full max-w-md border border-stone-800 bg-stone-950 p-8 shadow-2xl">
                <h3 className="mb-6 font-serif text-2xl text-white">
                  Edit Room
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-[0.6rem] font-bold tracking-widest text-stone-500 uppercase">
                      Room Label
                    </label>
                    <input
                      defaultValue={editingRoom.name}
                      id="edit-room-name"
                      className="focus:border-gold-500/50 w-full border border-stone-800 bg-stone-900/50 px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[0.6rem] font-bold tracking-widest text-stone-500 uppercase">
                      Notion Page ID / URL
                    </label>
                    <input
                      defaultValue={editingRoom.id}
                      id="edit-room-id"
                      className="focus:border-gold-500/50 w-full border border-stone-800 bg-stone-900/50 px-4 py-3 font-mono text-sm text-white outline-none"
                    />
                  </div>
                  <div className="mt-8 flex gap-3">
                    <button
                      onClick={() => {
                        const name = (
                          document.getElementById(
                            "edit-room-name",
                          ) as HTMLInputElement
                        ).value;
                        const id_override = (
                          document.getElementById(
                            "edit-room-id",
                          ) as HTMLInputElement
                        ).value;
                        void updateRoom(editingRoom.id, { name, id_override });
                      }}
                      className="hover:bg-gold-500 flex-1 bg-white py-3 text-sm font-bold text-stone-950 transition"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingRoom(null)}
                      className="flex-1 border border-stone-800 py-3 text-sm font-bold text-white transition hover:bg-stone-900"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {error && (
              <motion.div
                layout
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="mb-6 max-w-3xl overflow-hidden border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {isAddingRoom ? (
            <form
              onSubmit={addRoom}
              className="mb-8 grid gap-3 border border-white/10 bg-stone-950/40 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]"
            >
              <input
                value={roomNameInput}
                onChange={(event) => setRoomNameInput(event.target.value)}
                className="focus:border-gold-500/60 border border-stone-800 bg-stone-950/70 px-4 py-3 text-sm text-white transition outline-none"
                placeholder="Room label, e.g. Project Alpha"
              />
              <input
                value={roomInput}
                onChange={(event) => setRoomInput(event.target.value)}
                className="focus:border-gold-500/60 border border-stone-800 bg-stone-950/70 px-4 py-3 font-mono text-sm text-white transition outline-none"
                placeholder="Notion parent page URL or ID"
              />
              <button className="hover:bg-gold-500 inline-flex items-center justify-center gap-2 bg-white px-5 py-3 text-sm font-semibold text-stone-950 transition">
                <Users className="h-4 w-4" />
                Open
              </button>
            </form>
          ) : null}

          <div
            data-animate-stagger="0.08"
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {showRoomSkeletons
              ? Array.from({ length: roomSkeletonCount }).map((_, index) => (
                  <div
                    key={`room-skeleton-${index}`}
                    className="min-h-56 animate-pulse border border-white/5 bg-stone-950/20 p-6"
                  >
                    <div className="mb-5 h-3 w-16 bg-stone-800/80" />
                    <div className="h-8 w-3/4 bg-stone-800/70" />
                    <div className="mt-7 h-3 w-full bg-stone-900" />
                    <div className="mt-3 h-3 w-2/3 bg-stone-900" />
                  </div>
                ))
              : null}
            {rooms.map((room) => (
              <div
                key={room.id}
                data-animate="up"
                onClick={() => void openRoom(room.id, room.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    void openRoom(room.id, room.name);
                  }
                }}
                tabIndex={0}
                role="button"
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY, room });
                }}
                className="group hover:border-gold-500/30 focus:border-gold-500/30 relative block w-full cursor-pointer border border-white/5 bg-stone-950/20 p-6 text-left transition hover:bg-stone-900/30 focus:outline-none"
              >
                <div className="flex items-start justify-between">
                  <p className="mb-3 text-[0.65rem] font-medium tracking-[0.25em] text-stone-600 uppercase">
                    Room
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenu({ x: e.clientX, y: e.clientY, room });
                    }}
                    className="text-stone-700 hover:text-stone-400"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <h2 className="group-hover:text-gold-400 font-serif text-3xl text-white transition">
                  {room.name}
                </h2>
                {room.actualTitle && room.actualTitle !== room.name && (
                  <p className="mt-1 text-sm text-stone-500 italic">
                    {room.actualTitle}
                  </p>
                )}
                <p className="mt-5 font-mono text-[10px] break-all text-stone-700">
                  {room.id}
                </p>
                <p className="mt-3 text-[10px] text-stone-600">
                  Updated {new Date(room.updatedAt).toLocaleString()}
                </p>
              </div>
            ))}

            {contextMenu && (
              <div
                className="fixed z-50 w-48 border border-stone-800 bg-stone-950 p-1 shadow-2xl backdrop-blur-md"
                style={{
                  top: contextMenu.y,
                  left: contextMenu.x,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setEditingRoom(contextMenu.room);
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-stone-300 hover:bg-stone-900"
                >
                  <Edit className="h-4 w-4" />
                  Edit Room
                </button>
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(contextMenu.room.id);
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-stone-300 hover:bg-stone-900"
                >
                  <Copy className="h-4 w-4" />
                  Copy ID
                </button>
                <button
                  onClick={() => {
                    window.open(
                      `https://notion.so/${contextMenu.room.id}`,
                      "_blank",
                    );
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-stone-300 hover:bg-stone-900"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Notion
                </button>
                <div className="my-1 border-t border-stone-900" />
                <button
                  onClick={() => {
                    void deleteRoom(contextMenu.room.id);
                    setContextMenu(null);
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10"
                >
                  <Trash className="h-4 w-4" />
                  Delete Room
                </button>
              </div>
            )}
            <button
              onClick={() => setIsAddingRoom(true)}
              className="hover:border-gold-500/40 flex min-h-56 flex-col items-start justify-between border border-dashed border-stone-800 p-6 text-left transition hover:bg-stone-900/20"
            >
              <Plus className="text-gold-500 h-6 w-6" />
              <span>
                <span className="block font-serif text-3xl text-white">
                  New Room
                </span>
                <span className="mt-3 block text-sm leading-relaxed text-stone-500">
                  Add existing Notion parent page URL or ID. Room appears here
                  after first open.
                </span>
              </span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={scopeRef}
      className="relative min-h-[calc(100svh-5rem)] border-b border-white/5 px-6 py-10 md:px-10 lg:px-16"
    >
      <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <div data-animate="up" className="mb-3 flex items-center gap-4">
                <span className="bg-gold-500/40 block h-px w-10" />
                <span className="text-[0.65rem] font-medium tracking-[0.35em] text-stone-600 uppercase">
                  Live Room
                </span>
              </div>
              <h1
                data-animate="up"
                data-animate-delay="0.05"
                className="font-serif text-4xl text-white md:text-6xl"
              >
                {displayRoomName || (
                  <span className="inline-block h-10 w-64 animate-pulse rounded-md bg-stone-800/50 md:h-14" />
                )}
              </h1>
              {currentRoom?.actualTitle &&
                currentRoom.actualTitle !== displayRoomName && (
                  <p
                    data-animate="up"
                    data-animate-delay="0.1"
                    className="mt-2 text-sm text-stone-500 italic md:text-base"
                  >
                    {currentRoom.actualTitle}
                  </p>
                )}
            </div>
            <div
              data-animate="up"
              data-animate-delay="0.15"
              className="flex flex-wrap items-center gap-3"
            >
              <button
                onClick={() => void loadPages(currentRoomId, false, true)}
                className="hover:border-gold-500/40 inline-flex items-center gap-2 rounded-xl border border-stone-800 bg-stone-900/30 px-4 py-3 text-sm text-stone-300 transition"
              >
                {isLoadingPages ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Sync
              </button>
              <button
                onClick={() => setStatus("Notion webhook must broadcast here.")}
                className="hover:border-gold-500/40 hover:text-gold-500 rounded-xl border border-stone-800 bg-stone-900/30 p-3 text-stone-400 transition"
                aria-label="Realtime status"
              >
                <Bell className="h-4 w-4" />
              </button>
              <button
                onClick={leaveRoom}
                className="hover:bg-gold-500 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-stone-950 transition"
              >
                <LogOut className="h-4 w-4" />
                Rooms
              </button>
            </div>
          </div>

          {status && (
            <div
              data-animate="fade"
              className="border-gold-500/20 bg-gold-500/10 text-gold-100 mb-5 border px-5 py-3 text-sm"
            >
              {status}
            </div>
          )}

          {error && (
            <div
              data-animate="fade"
              className="mb-5 border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm text-red-200"
            >
              {error}
            </div>
          )}

          <div
            data-animate="up"
            data-animate-delay="0.2"
            className="mb-4 flex flex-wrap items-center justify-between gap-3"
          >
            <p className="font-mono text-xs tracking-[0.25em] text-stone-600 uppercase">
              {selectedPageIds.length} selected / {displayPages.length} pages
            </p>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="hover:border-gold-500/40 border border-stone-800 px-3 py-2 text-xs text-stone-400 transition hover:text-white"
              >
                Select all
              </button>
              <button
                onClick={() => setSelectedPageIds([])}
                className="hover:border-gold-500/40 border border-stone-800 px-3 py-2 text-xs text-stone-400 transition hover:text-white"
              >
                Clear
              </button>
            </div>
          </div>

          <div data-animate-stagger="0.04" className="space-y-1">
            {showPageSkeletons
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`page-skeleton-${index}`}
                    data-animate="up"
                    className="grid animate-pulse grid-cols-[1.5rem_minmax(0,1fr)] gap-3 border border-white/5 bg-stone-950/10 px-4 py-2"
                  >
                    <div className="mt-0.5 h-4 w-4 border border-stone-800 bg-stone-900/70" />
                    <div className="min-w-0">
                      <div className="h-4 w-2/3 bg-stone-800/80" />
                    </div>
                  </div>
                ))
              : null}
            {displayPages.map((page) => {
              const checked = selectedPageIds.includes(page.id);
              const isTemp = page.id.startsWith("temp-");
              return (
                <button
                  key={page.id}
                  disabled={isTemp}
                  data-animate="up"
                  onClick={() => togglePage(page.id)}
                  className={`group grid w-full grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 border px-4 py-1.5 text-left transition ${
                    checked
                      ? "border-gold-500/40 bg-gold-500/10"
                      : "hover:border-gold-500/20 border-white/5 bg-stone-950/10 hover:bg-stone-900/20"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center border transition-colors ${
                      checked
                        ? "border-gold-500 bg-gold-500 text-stone-950"
                        : "border-stone-700 group-hover:border-stone-500"
                    }`}
                  >
                    {checked ? <Check className="h-3 w-3" /> : null}
                  </span>
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="text-gold-500/50 shrink-0 font-mono text-[10px]">
                      {page.number
                        ? String(page.number).padStart(2, "0")
                        : "--"}
                    </span>
                    <span className="group-hover:text-gold-200 truncate text-sm font-medium text-white">
                      {page.title.replace(/^\d{1,4}\s*/, "")}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] text-stone-600">
                    {isTemp
                      ? "Creating..."
                      : new Date(page.createdTime).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                  </span>
                </button>
              );
            })}
            {hasLoadedCurrentRoomPages &&
            isRouteMatchingStore &&
            displayPages.length === 0 ? (
              <div className="border border-white/5 bg-stone-950/20 p-8 text-stone-500">
                No child pages found. Create first block from action panel.
              </div>
            ) : null}
          </div>
        </div>

        <aside data-animate-stagger="0.06" className="space-y-6">
          <div
            data-animate="up"
            className="border border-white/5 bg-stone-950/20 p-6"
          >
            <p className="mb-4 text-[0.65rem] font-medium tracking-[0.25em] text-stone-600 uppercase">
              Operator
            </p>
            {isEditingName ? (
              <div className="flex gap-2">
                <input
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                  className="focus:border-gold-500/60 min-w-0 flex-1 border border-stone-800 bg-stone-950 px-3 py-2 text-sm text-white outline-none"
                />
                <button
                  onClick={saveDisplayName}
                  className="hover:bg-gold-500 bg-white px-3 py-2 text-xs font-semibold text-stone-950"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="flex w-full items-center justify-between text-left text-white"
              >
                <span>{displayName}</span>
                <Edit3 className="h-4 w-4 text-stone-600" />
              </button>
            )}
          </div>

          <div
            data-animate="up"
            className="border border-white/5 bg-stone-950/20 p-6"
          >
            <p className="mb-4 text-[0.65rem] font-medium tracking-[0.25em] text-stone-600 uppercase">
              Add Blocks
            </p>
            <div className="space-y-2">
              {NOTION_ROOM_PAGE_TYPES.map((pageType) => {
                const Icon = typeIcons[pageType];
                return (
                  <button
                    key={pageType}
                    disabled={creatingType !== null}
                    onClick={() => void createPage(pageType)}
                    className="hover:border-gold-500/40 flex w-full items-center gap-3 border border-stone-800 px-4 py-3 text-left text-stone-300 transition hover:text-white disabled:opacity-60"
                  >
                    {creatingType === pageType ? (
                      <Loader2 className="text-gold-500 h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="text-gold-500 h-4 w-4" />
                    )}
                    + {pageType}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            disabled={selectedPageIds.length === 0 || isCompiling}
            onClick={() => void compileContext()}
            data-animate="up"
            className="hover:bg-gold-500 flex min-h-28 w-full flex-col items-center justify-center gap-3 bg-white px-5 py-5 font-semibold text-stone-950 transition disabled:bg-stone-800 disabled:text-stone-500"
          >
            {isCompiling ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Clipboard className="h-6 w-6" />
            )}
            Compile & Copy Context
          </button>

          <div
            data-animate="up"
            className="border border-white/5 bg-stone-950/20 p-6"
          >
            <p className="mb-4 text-[0.65rem] font-medium tracking-[0.25em] text-stone-600 uppercase">
              Who&apos;s Here
            </p>
            <div className="space-y-4">
              {Object.entries(displayPeers).map(([id, peer]) => {
                const peerPages = displayPages.filter((page) =>
                  peer.selectedPageIds?.includes(page.id),
                );
                return (
                  <div key={id} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-700 bg-stone-900 text-sm font-semibold text-white">
                      {peer.displayName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-white">{peer.displayName}</p>
                      <p className="truncate text-sm text-stone-500">
                        {peerPages.length > 0
                          ? peerPages.map((page) => page.title).join(", ")
                          : "Viewing room"}
                      </p>
                    </div>
                  </div>
                );
              })}
              {Object.keys(displayPeers).length === 0 ? (
                <p className="text-sm leading-relaxed text-stone-500">
                  Presence appears after Supabase connects.
                </p>
              ) : null}
            </div>
          </div>

          <div
            data-animate="up"
            className="border border-white/5 bg-stone-950/20 p-6"
          >
            <p className="mb-3 text-[0.65rem] font-medium tracking-[0.25em] text-stone-600 uppercase">
              Selected
            </p>
            <div className="space-y-2 text-sm text-stone-500">
              {displaySelectedPages.map((page) => (
                <p key={page.id} className="truncate">
                  {page.title}
                </p>
              ))}
              {displaySelectedPages.length === 0 ? (
                <p>Nothing selected.</p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
