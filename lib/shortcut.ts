"use client";

import { useEffect, useState } from "react";

const SHORTCUT_SYMBOLS = new Set([
  "⌘",
  "⌥",
  "⌃",
  "⇧",
  "↵",
  "↑",
  "↓",
  "←",
  "→",
  "⇥",
  "⌫",
  "⌦",
  "⎋",
]);

interface ShortcutToken {
  char: string;
  isSymbol: boolean;
}

export const SHORTCUT_SYMBOL_CLASS =
  "inline-block text-[1.2em] leading-none align-[-0.08em]";

function isApplePlatform() {
  if (typeof navigator === "undefined") return false;
  const platform = navigator.platform ?? "";
  const userAgent = navigator.userAgent ?? "";
  return /Mac|iPhone|iPad|iPod/i.test(platform + userAgent);
}

export function useCommandPaletteShortcutLabel() {
  const [label, setLabel] = useState("Ctrl+K");

  useEffect(() => {
    setLabel(isApplePlatform() ? "⌘K" : "Ctrl+K");
  }, []);

  return label;
}

export function createCommandPaletteShortcutEvent() {
  const isApple = isApplePlatform();

  return new KeyboardEvent("keydown", {
    key: "k",
    metaKey: isApple,
    ctrlKey: !isApple,
    bubbles: true,
  });
}

export function tokenizeShortcutLabel(label: string): ShortcutToken[] {
  return Array.from(label).map((char) => ({
    char,
    isSymbol: SHORTCUT_SYMBOLS.has(char),
  }));
}
