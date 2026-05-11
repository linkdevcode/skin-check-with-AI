/** Rung ngắn trên thiết bị hỗ trợ (Android / một số mobile). iOS Safari thường bỏ qua. */
export function triggerHaptic(durationMs = 10): void {
  if (typeof window === "undefined") return;
  try {
    const v = navigator.vibrate?.bind(navigator);
    if (typeof v === "function") v(durationMs);
  } catch {
    /* ignore */
  }
}
