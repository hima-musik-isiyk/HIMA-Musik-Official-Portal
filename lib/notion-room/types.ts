export type NotionRoomPage = {
  id: string;
  title: string;
  createdTime: string;
  number: number | null;
  type: string;
};

export type NotionRoomPageType =
  | "User"
  | "Response"
  | "Agreement"
  | "Checkpoint"
  | "Attachment";

export const NOTION_ROOM_PAGE_TYPES: NotionRoomPageType[] = [
  "User",
  "Response",
  "Agreement",
  "Checkpoint",
  "Attachment",
];
