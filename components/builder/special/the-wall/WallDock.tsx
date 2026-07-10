"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useState } from "react";

import { createWallNote } from "@/lib/the-wall-actions";

interface WallDockProps {
  boardId: string;
  viewportCenter: { x: number; y: number };
  sessionId: string;
}

const COLORS = [
  { id: "yellow", bg: "bg-amber-200" },
  { id: "blue", bg: "bg-blue-200" },
  { id: "green", bg: "bg-emerald-200" },
  { id: "pink", bg: "bg-pink-200" },
  { id: "gold", bg: "bg-gold-500" },
];

export default function WallDock({
  boardId,
  viewportCenter,
  sessionId,
}: WallDockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [color, setColor] = useState("yellow");
  const [captchaToken, setCaptchaToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (!captchaToken) {
      setError("Please complete the bot check.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await createWallNote({
      board_id: boardId,
      content,
      author,
      color,
      x: viewportCenter.x,
      y: viewportCenter.y,
      captchaToken,
      session_id: sessionId,
    });

    if (res.error) {
      setError(res.error);
    } else {
      setIsOpen(false);
      setContent("");
      setAuthor("");
      setCaptchaToken("");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center">
      {isOpen ? (
        <form
          onSubmit={handleSubmit}
          className="pointer-events-auto mb-4 w-[320px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl transition-all md:w-[400px]"
          style={{ borderRadius: "0" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-serif text-lg text-white">Create Note</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sm text-white/50 transition-colors hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?..."
                className="focus:border-gold-500 h-24 w-full resize-none border border-white/10 bg-black/40 p-3 text-sm text-white placeholder-white/30 focus:outline-none"
                required
                maxLength={500}
              />
            </div>

            <div>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author (Anonymous if empty)"
                className="focus:border-gold-500 w-full border border-white/10 bg-black/40 p-3 text-sm text-white placeholder-white/30 focus:outline-none"
                maxLength={50}
              />
            </div>

            <div className="flex justify-center gap-3 py-2">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`h-8 w-8 ${c.bg} transition-transform ${color === c.id ? "scale-125 ring-2 ring-white/50" : "hover:scale-110"}`}
                  style={{ borderRadius: "0" }}
                  aria-label={`Select ${c.id} color`}
                />
              ))}
            </div>

            <div className="flex justify-center py-2">
              <Turnstile
                siteKey={
                  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
                  "1x00000000000000000000AA"
                }
                onSuccess={(token) => setCaptchaToken(token)}
                onError={() => setError("Captcha failed. Please try again.")}
                onExpire={() => setCaptchaToken("")}
                options={{ theme: "dark" }}
              />
            </div>

            {error && (
              <p className="text-center text-xs text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !captchaToken || !content.trim()}
              className="bg-gold-500/20 hover:bg-gold-500/30 border-gold-500/50 text-gold-500 w-full border py-3 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderRadius: "var(--radius-action, 0.5rem)" }}
            >
              {isSubmitting ? "Posting..." : "Post to Wall"}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto flex items-center gap-2 border border-white/10 bg-white/5 px-6 py-3 font-medium text-white shadow-2xl backdrop-blur-md transition-all hover:bg-white/10"
          style={{ borderRadius: "var(--radius-action, 0.5rem)" }}
        >
          <span className="text-gold-500 text-xl leading-none">+</span> Add Note
        </button>
      )}
    </div>
  );
}
