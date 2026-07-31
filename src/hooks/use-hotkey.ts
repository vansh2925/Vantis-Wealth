"use client";

import { useEffect } from "react";

type Modifier = "ctrl" | "meta" | "shift" | "alt";

interface HotkeyOptions {
  /** Which modifiers must be held. Defaults to ctrl/meta. */
  modifiers?: Modifier[];
  /** When true, ignores the event (e.g. while typing in an input). */
  enabled?: boolean;
}

/**
 * Global keyboard shortcut. `key` is the event.key value, e.g. "k" for Ctrl+K.
 */
export function useHotkey(
  key: string,
  handler: () => void,
  options: HotkeyOptions = {}
) {
  const { modifiers = ["ctrl", "meta"], enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      const isCombo = modifiers.every((m) => {
        if (m === "ctrl") return e.ctrlKey || e.metaKey;
        if (m === "meta") return e.metaKey;
        if (m === "shift") return e.shiftKey;
        if (m === "alt") return e.altKey;
        return false;
      });

      if (isCombo && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        handler();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [key, handler, enabled, modifiers]);
}
