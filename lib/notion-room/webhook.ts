import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getRoomNotionClient, normalizePageId } from "@/lib/notion-room/server";

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getPayloadRoomId(payload: unknown) {
  const root = readRecord(payload);
  const parent = readRecord(root.parent);
  const data = readRecord(root.data);
  const dataParent = readRecord(data.parent);
  return (
    readString(root.roomId) ??
    readString(root.page_id) ??
    readString(parent.page_id) ??
    readString(dataParent.id) ??
    null
  );
}

function getEntityId(payload: unknown) {
  const entity = readRecord(readRecord(payload).entity);
  return readString(entity.id);
}

async function resolveRoomId(payload: unknown) {
  const payloadRoomId = getPayloadRoomId(payload);
  if (payloadRoomId) return normalizePageId(payloadRoomId);

  const entityId = getEntityId(payload);
  if (!entityId) return null;

  const notion = getRoomNotionClient();
  const page = await notion.pages.retrieve({ page_id: entityId });
  if (!("parent" in page)) return normalizePageId(entityId);
  const parent = page.parent;

  if (parent.type === "page_id") return normalizePageId(parent.page_id);
  return normalizePageId(entityId);
}

export function handleNotionRoomWebhookHealthcheck() {
  return NextResponse.json({
    ok: true,
    endpoint: "notion-room-webhook",
  });
}

export async function handleNotionRoomWebhook(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const verificationToken = readString(readRecord(payload).verification_token);
  if (verificationToken) {
    console.warn("Notion webhook verification_token:", verificationToken);
    return NextResponse.json({
      ok: true,
      verification_token: verificationToken,
    });
  }

  const roomId = await resolveRoomId(payload).catch(() => null);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!roomId || !url || !key) {
    return NextResponse.json({
      ok: true,
      broadcasted: false,
      reason: "Missing roomId or Supabase env",
    });
  }

  const supabase = createClient(url, key);
  const channel = supabase.channel(`room-${roomId}`);
  await channel.send({
    type: "broadcast",
    event: "notion-room-refresh",
    payload: { roomId },
  });
  await supabase.removeChannel(channel);

  return NextResponse.json({ ok: true, broadcasted: true });
}
