"use client";

import { toast } from "sonner";
import { isAiStructuredActionError } from "@/lib/ai/structured-errors";

/** Toast structured `{ status: 'error', message }` or legacy `{ error: string }`. */
export function toastServerActionFailure(result: unknown): boolean {
  if (isAiStructuredActionError(result)) {
    toast.error(result.message);
    return true;
  }
  if (
    typeof result === "object" &&
    result != null &&
    "ok" in result &&
    (result as { ok: unknown }).ok === false &&
    "error" in result &&
    typeof (result as { error: unknown }).error === "string" &&
    (result as { error: string }).error.trim()
  ) {
    toast.error((result as { error: string }).error);
    return true;
  }
  return false;
}
