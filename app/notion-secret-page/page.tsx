"use client";

import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import {
  Bell,
  Check,
  Clipboard,
  Edit3,
  Flag,
  Handshake,
  Loader2,
  LogOut,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  UserPlus,
  Users,
  X,
} from "lucide-react";
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

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default function NotionSecretPage() {
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
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [creatingType, setCreatingType] = useState<NotionRoomPageType | null>(
    null,
  );
  const [peers, setPeers] = useState<Record<string, PeerState>>({});
  const channelRef = useRef<RealtimeChannel | null>(null);
  const roomsChannelRef = useRef<RealtimeChannel | null>(null);
  const selectedPageIdsRef = useRef<string[]>([]);

  const selectedPages = useMemo(
    () =>
      chronologicalPages.filter((page) => selectedPageIds.includes(page.id)),
    [chronologicalPages, selectedPageIds],
  );

  useEffect(() => {
    selectedPageIdsRef.current = selectedPageIds;
  }, [selectedPageIds]);

  useEffect(() => {
    const storedName =
      localStorage.getItem("notion-room-display-name") ?? "Operator";
    setNameInput(storedName);
    setDisplayName(storedName);
  }, [setDisplayName]);

  const loadRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    setError("");
    try {
      const response = await fetch("/api/notion/rooms");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to load rooms");
      setRooms(data.rooms ?? []);
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
    setRooms((current) => [
      data.room,
      ...current.filter((room) => room.id !== data.room.id),
    ]);
    return data.room as NotionRoom;
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (currentRoomId) return;
    const interval = window.setInterval(() => {
      void loadRooms();
    }, 5000);
    return () => window.clearInterval(interval);
  }, [currentRoomId, loadRooms]);

  useEffect(() => {
    const supabase = getSupabaseClient();
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
    async (roomId: string, quiet = false) => {
      setIsLoadingPages(true);
      setError("");
      try {
        const response = await fetch(
          `/api/notion/pages?roomId=${encodeURIComponent(roomId)}`,
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Failed to load pages");
        setChronologicalPages(data.pages ?? []);
        if (!quiet) setStatus("Synced with Notion.");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to load");
      } finally {
        setIsLoadingPages(false);
      }
    },
    [setChronologicalPages],
  );

  useEffect(() => {
    if (!currentRoomId) return;
    const interval = window.setInterval(() => {
      void loadPages(currentRoomId, true);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [currentRoomId, loadPages]);

  useEffect(() => {
    if (!currentRoomId || !displayName) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus("Realtime off: set Supabase env.");
      return;
    }

    const channel = supabase.channel(`room-${currentRoomId}`, {
      config: { presence: { key: crypto.randomUUID() } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PeerState>();
        const nextPeers: Record<string, PeerState> = {};
        for (const [key, values] of Object.entries(state)) {
          const first = values[0];
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
        void loadPages(currentRoomId);
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

    const payload = {
      displayName,
      selectedPageIds,
      onlineAt: new Date().toISOString(),
    };
    void channel.track(payload);
    void channel.send({ type: "broadcast", event: "selection", payload });
  }, [displayName, selectedPageIds]);

  async function openRoom(roomId: string, name?: string) {
    const normalizedRoomId = extractNotionPageId(roomId);
    if (!isValidPageId(roomId)) {
      setError("Paste a Notion page URL or 32-character page ID.");
      return;
    }

    setCurrentRoomId(normalizedRoomId);
    setSelectedPageIds([]);
    try {
      await saveRoom(normalizedRoomId, name);
      void roomsChannelRef.current?.send({
        type: "broadcast",
        event: "rooms-refresh",
        payload: { roomId: normalizedRoomId },
      });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to save room",
      );
      return;
    }
    window.scrollTo({ top: 0 });
    await loadPages(normalizedRoomId);
  }

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
      await loadPages(currentRoomId);
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
    setRoomInput("");
    setRoomNameInput("");
    setPeers({});
    setStatus("");
    setError("");
    window.scrollTo({ top: 0 });
  }

  if (!currentRoomId) {
    return (
      <section className="relative min-h-[calc(100svh-5rem)] overflow-hidden border-b border-white/5 px-6 py-16 md:px-10 lg:px-16">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_10%,rgba(255,101,1,0.12),transparent_32%),radial-gradient(circle_at_20%_80%,rgba(120,113,108,0.18),transparent_30%)]" />
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-4xl">
            <div className="mb-4 flex items-center gap-4">
              <span className="bg-gold-500/40 block h-px w-12" />
              <span className="text-[0.65rem] font-medium tracking-[0.4em] text-stone-600 uppercase">
                Notion Sync
              </span>
            </div>
            <h1 className="font-serif text-5xl leading-tight font-normal text-white md:text-7xl">
              Context <br />
              <span className="font-light text-stone-500 italic">Rooms</span>
            </h1>
            <div className="mt-8 flex flex-wrap items-center gap-3">
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

          {error ? (
            <div className="mb-6 max-w-3xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

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

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => void openRoom(room.id, room.name)}
                className="group hover:border-gold-500/30 border border-white/5 bg-stone-950/20 p-6 text-left transition hover:bg-stone-900/30"
              >
                <p className="mb-3 text-[0.65rem] font-medium tracking-[0.25em] text-stone-600 uppercase">
                  Room
                </p>
                <h2 className="group-hover:text-gold-400 font-serif text-3xl text-white transition">
                  {room.name}
                </h2>
                <p className="mt-5 font-mono text-xs text-stone-600">
                  {room.id}
                </p>
                <p className="mt-3 text-xs text-stone-500">
                  Updated {new Date(room.updatedAt).toLocaleString()}
                </p>
              </button>
            ))}
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
    <section className="relative min-h-[calc(100svh-5rem)] border-b border-white/5 px-6 py-10 md:px-10 lg:px-16">
      <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <div className="mb-3 flex items-center gap-4">
                <span className="bg-gold-500/40 block h-px w-10" />
                <span className="text-[0.65rem] font-medium tracking-[0.35em] text-stone-600 uppercase">
                  Live Room
                </span>
              </div>
              <h1 className="font-serif text-4xl text-white md:text-6xl">
                Context Assembly
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => void loadPages(currentRoomId)}
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

          {status ? (
            <div className="border-gold-500/20 bg-gold-500/10 text-gold-100 mb-5 border px-5 py-3 text-sm">
              {status}
            </div>
          ) : null}
          {error ? (
            <div className="mb-5 border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xs tracking-[0.25em] text-stone-600 uppercase">
              {selectedPageIds.length} selected / {chronologicalPages.length}{" "}
              pages
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

          <div className="space-y-3">
            {chronologicalPages.map((page) => {
              const checked = selectedPageIds.includes(page.id);
              const isTemp = page.id.startsWith("temp-");
              return (
                <button
                  key={page.id}
                  disabled={isTemp}
                  onClick={() => togglePage(page.id)}
                  className={`group grid w-full grid-cols-[2rem_minmax(0,1fr)] gap-4 border p-5 text-left transition ${
                    checked
                      ? "border-gold-500/50 bg-gold-500/10"
                      : "hover:border-gold-500/30 border-white/5 bg-stone-950/20 hover:bg-stone-900/30"
                  }`}
                >
                  <span
                    className={`mt-1 flex h-5 w-5 items-center justify-center border ${
                      checked
                        ? "border-gold-500 bg-gold-500 text-stone-950"
                        : "border-stone-700"
                    }`}
                  >
                    {checked ? <Check className="h-3.5 w-3.5" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xl font-semibold text-white">
                      <span className="text-gold-500 mr-3 font-mono text-sm">
                        {page.number
                          ? String(page.number).padStart(2, "0")
                          : "--"}
                      </span>
                      {page.title.replace(/^\d{1,4}\s*/, "")}
                    </span>
                    <span className="mt-2 block truncate text-sm text-stone-500">
                      {isTemp
                        ? "Creating in Notion..."
                        : `Created ${new Date(page.createdTime).toLocaleString()}`}
                    </span>
                  </span>
                </button>
              );
            })}
            {!isLoadingPages && chronologicalPages.length === 0 ? (
              <div className="border border-white/5 bg-stone-950/20 p-8 text-stone-500">
                No child pages found. Create first block from action panel.
              </div>
            ) : null}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="border border-white/5 bg-stone-950/20 p-6">
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

          <div className="border border-white/5 bg-stone-950/20 p-6">
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
            className="hover:bg-gold-500 flex min-h-28 w-full flex-col items-center justify-center gap-3 bg-white px-5 py-5 font-semibold text-stone-950 transition disabled:bg-stone-800 disabled:text-stone-500"
          >
            {isCompiling ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Clipboard className="h-6 w-6" />
            )}
            Compile & Copy Context
          </button>

          <div className="border border-white/5 bg-stone-950/20 p-6">
            <p className="mb-4 text-[0.65rem] font-medium tracking-[0.25em] text-stone-600 uppercase">
              Who&apos;s Here
            </p>
            <div className="space-y-4">
              {Object.entries(peers).map(([id, peer]) => {
                const peerPages = chronologicalPages.filter((page) =>
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
              {Object.keys(peers).length === 0 ? (
                <p className="text-sm leading-relaxed text-stone-500">
                  Presence appears after Supabase connects.
                </p>
              ) : null}
            </div>
          </div>

          <div className="border border-white/5 bg-stone-950/20 p-6">
            <p className="mb-3 text-[0.65rem] font-medium tracking-[0.25em] text-stone-600 uppercase">
              Selected
            </p>
            <div className="space-y-2 text-sm text-stone-500">
              {selectedPages.map((page) => (
                <p key={page.id} className="truncate">
                  {page.title}
                </p>
              ))}
              {selectedPages.length === 0 ? <p>Nothing selected.</p> : null}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
