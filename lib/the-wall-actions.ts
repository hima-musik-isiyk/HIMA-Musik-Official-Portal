"use server";

import { getSupabaseServerClient } from "@/lib/supabase";

export async function createWallNote(data: {
  board_id: string;
  content: string;
  author: string;
  color: string;
  x: number;
  y: number;
  captchaToken: string;
}) {
  if (!data.captchaToken || !data.captchaToken.startsWith("wall-")) {
    return { error: "Bot prevention check failed. Please check the captcha." };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("the_wall_notes").insert({
    board_id: data.board_id,
    content: data.content,
    author: data.author.trim() || "Anonymous",
    color: data.color,
    x: data.x,
    y: data.y,
  });

  if (error) {
    console.error("Error inserting wall note:", error);
    return { error: "Failed to post note. Please try again later." };
  }

  return { success: true };
}

export async function updateWallNotePosition(data: {
  note_id: string;
  board_id: string;
  x: number;
  y: number;
}) {
  // Update position. In a real app we'd verify ownership,
  // but for a public whiteboard, anyone can move them, or we could restrict it.
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("the_wall_notes")
    .update({ x: data.x, y: data.y })
    .eq("id", data.note_id)
    .eq("board_id", data.board_id);

  if (error) {
    console.error("Error updating wall note position:", error);
    return { error: "Failed to update position." };
  }

  return { success: true };
}
