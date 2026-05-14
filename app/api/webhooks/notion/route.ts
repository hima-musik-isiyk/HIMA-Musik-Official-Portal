import {
  handleNotionRoomWebhook,
  handleNotionRoomWebhookHealthcheck,
} from "@/lib/notion-room/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleNotionRoomWebhookHealthcheck;
export const POST = handleNotionRoomWebhook;
