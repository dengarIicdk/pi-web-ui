import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { formatCompactTokens } from "../../core/format";
import { usePiWebUiStore } from "../../core/store";
import { formatDuration, formatRate, liveTokensPerSecond } from "../../core/throughput";

/** Colour thresholds from the spec: blue/green to 60%, amber 60–85%, red above 85%. */
export function contextTone(percent: number) {
  if (percent > 85)
    return { bar: "#ef4444", text: "text-red-400", label: "Context almost full — compact or start a new session" };
  if (percent >= 60) return { bar: "#f59e0b", text: "text-amber-300", label: "Context filling up" };
  return { bar: "#4d6bfe", text: "text-blue-300", label: "Context healthy" };
}

/** Used = provider occupancy (input + cache), matching the Pi footer. */
export function useContextOccupancy() {
  const contextUsage = usePiWebUiStore((state) => state.contextUsage);
  const contextWindowSize = usePiWebUiStore((state) => state.contextWindowSize);
  const lastUsage = usePiWebUiStore((state) => state.lastUsage);
  const windowSize = contextUsage?.contextWindow || contextWindowSize;
  const fallbackUsed = (lastUsage?.input || 0) + (lastUsage?.cacheRead || 0) + (lastUsage?.cacheWrite || 0);
  const used = contextUsage?.tokens ?? (windowSize > 0 ? fallbackUsed : null);
  const percent = contextUsage?.percent ?? (windowSize > 0 && used !== null ? (used / windowSize) * 100 : null);
  return { used, windowSize, percent };
}

/** Labelled context gauge: `18.4K / 128K tokens (14%)` with a coloured bar. */
export function ContextMeter({ className }: { className?: string }) {
  const { used, windowSize, percent } = useContextOccupancy();
  if (percent === null || used === null || windowSize <= 0) return null;

  const clamped = Math.max(0, Math.min(100, percent));
  const tone = contextTone(percent);

  return (
    <div
      aria-label={`Context ${formatCompactTokens(used)} of ${formatCompactTokens(windowSize)} tokens`}
      className={cn("flex min-w-44 flex-col gap-1", className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      title={tone.label}
    >
      <div className="flex items-center justify-between gap-3 text-[11px] tabular-nums text-muted-foreground">
        <span>Context</span>
        <span className={cn("font-medium", tone.text)}>
          {formatCompactTokens(used)} / {formatCompactTokens(windowSize)} tokens ({Math.round(percent)}%)
        </span>
      </div>
      <div className="harness-meter">
        <span style={{ width: `${clamped}%`, backgroundColor: tone.bar }} />
      </div>
    </div>
  );
}

/** Live tok/s while streaming; after a response, shows the last rate and duration. */
export function ThroughputBadge({ className }: { className?: string }) {
  const throughput = usePiWebUiStore((state) => state.throughput);
  const chatStatus = usePiWebUiStore((state) => state.chatStatus);
  const streaming = chatStatus === "streaming" && throughput.startedAt !== null;
  const [now, setNow] = useState(() => Date.now());

  // Tick while streaming so elapsed time and tok/s stay live between chunks.
  useEffect(() => {
    if (!streaming) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [streaming]);

  if (streaming) {
    const rate = liveTokensPerSecond(throughput, now);
    const elapsed = throughput.startedAt !== null ? now - throughput.startedAt : 0;
    return (
      <div className={cn("inline-flex items-center gap-2 text-[12px] tabular-nums text-muted-foreground", className)}>
        <span className="harness-live-dot size-1.5 rounded-full bg-[#4d6bfe]" aria-hidden="true" />
        <span className="font-medium text-foreground">{formatRate(rate)}</span>
        <span className="opacity-50">·</span>
        <span>{formatDuration(elapsed)}</span>
      </div>
    );
  }

  if (throughput.last) {
    return (
      <div className={cn("inline-flex items-center gap-2 text-[12px] tabular-nums text-muted-foreground", className)}>
        <span>Last: {formatRate(throughput.last.tokPerSec)}</span>
        <span className="opacity-50">·</span>
        <span>{formatDuration(throughput.last.durationMs)}</span>
      </div>
    );
  }
  return null;
}
