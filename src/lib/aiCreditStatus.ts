/**
 * Tiny global store tracking the most recent status of AI-gateway calls
 * (parse-properties, smart-add, etc.). Edge functions return a `code`
 * field on non-success: "CREDITS_EXHAUSTED" (402), "RATE_LIMITED" (429),
 * or any other failure. The admin header subscribes to render a badge.
 */

import { useSyncExternalStore } from "react";

export type AiStatus = "ok" | "rate_limited" | "exhausted" | "error";

interface State {
  status: AiStatus;
  message: string;
  /** epoch ms of last update */
  updatedAt: number;
}

let state: State = { status: "ok", message: "", updatedAt: 0 };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function reportAiResult(payload: { code?: string; error?: string } | null | undefined) {
  // Successful call resets to ok if previously rate-limited; do NOT auto-reset
  // CREDITS_EXHAUSTED — only the user adding credits should clear it.
  if (!payload || (!payload.code && !payload.error)) {
    if (state.status === "rate_limited") {
      state = { status: "ok", message: "", updatedAt: Date.now() };
      emit();
    }
    return;
  }
  if (payload.code === "CREDITS_EXHAUSTED") {
    state = { status: "exhausted", message: payload.error || "AI credits exhausted", updatedAt: Date.now() };
  } else if (payload.code === "RATE_LIMITED") {
    state = { status: "rate_limited", message: payload.error || "Rate limited", updatedAt: Date.now() };
  } else if (payload.error) {
    state = { status: "error", message: payload.error, updatedAt: Date.now() };
  }
  emit();
}

/** Manually mark credits restored (e.g. user clicked "I added credits"). */
export function clearAiStatus() {
  state = { status: "ok", message: "", updatedAt: Date.now() };
  emit();
}

export function useAiCreditStatus(): State {
  return useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}
