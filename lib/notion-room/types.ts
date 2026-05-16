export type NotionRoomPage = {
  id: string;
  title: string;
  createdTime: string;
  number: number | null;
  type: string;
};

export type NotionRoom = {
  id: string;
  name: string;
  actualTitle?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
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

export function extractNotionPageId(value: string) {
  const raw = value.trim();
  const dashed = raw.match(
    /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g,
  );
  if (dashed?.length) return dashed.at(-1)?.replaceAll("-", "") ?? "";

  const compactMatches = [
    ...raw.matchAll(/(?:^|[^0-9a-fA-F])([0-9a-fA-F]{32})(?=$|[^0-9a-fA-F])/g),
  ];
  return compactMatches.at(-1)?.[1] ?? "";
}
