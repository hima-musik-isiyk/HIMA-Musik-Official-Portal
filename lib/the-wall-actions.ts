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
  session_id: string;
}) {
  if (!data.captchaToken) {
    return { error: "Bot prevention check failed. Please check the captcha." };
  }

  // Verify Turnstile token
  const secretKey =
    process.env.TURNSTILE_SECRET_KEY || "1x0000000000000000000000000000000AA";
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(data.captchaToken)}`,
      },
    );
    const outcome = await res.json();
    if (!outcome.success) {
      console.error("Turnstile failed:", outcome);
      return { error: "Security check failed. Please try again." };
    }
  } catch (err) {
    console.error("Turnstile verification error:", err);
    return { error: "Security check service unavailable." };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("the_wall_notes").insert({
    board_id: data.board_id,
    content: data.content,
    author: data.author.trim() || "Anonymous",
    color: data.color,
    x: data.x,
    y: data.y,
    session_id: data.session_id,
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
  session_id: string;
}) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("the_wall_notes")
    .update({ x: data.x, y: data.y })
    .eq("id", data.note_id)
    .eq("board_id", data.board_id)
    .eq("session_id", data.session_id);

  if (error) {
    console.error("Error updating wall note position:", error);
    return { error: "Failed to update position." };
  }

  return { success: true };
}

export async function deleteWallNote(data: {
  note_id: string;
  board_id: string;
  session_id: string;
}) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("the_wall_notes")
    .delete()
    .eq("id", data.note_id)
    .eq("board_id", data.board_id)
    .eq("session_id", data.session_id);

  if (error) {
    console.error("Error deleting wall note:", error);
    return { error: "Failed to delete note." };
  }

  return { success: true };
}

export async function updateWallNoteContent(data: {
  note_id: string;
  board_id: string;
  session_id: string;
  content: string;
}) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("the_wall_notes")
    .update({ content: data.content })
    .eq("id", data.note_id)
    .eq("board_id", data.board_id)
    .eq("session_id", data.session_id);

  if (error) {
    console.error("Error updating wall note content:", error);
    return { error: "Failed to update note." };
  }

  return { success: true };
}
