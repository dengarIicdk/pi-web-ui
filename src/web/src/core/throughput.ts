// Live generation telemetry for the header / streaming badge.
// Token counts are estimated from streamed deltas (~4 chars per token) while a
// response is in flight, and replaced by the provider-reported `usage.output`
// once `message_end` arrives.

export type ThroughputState = {
  /** Wall-clock start of the current assistant response (ms epoch). */
  startedAt: number | null;
  /** Time of the first streamed delta; TTFT = firstDeltaAt - startedAt. */
  firstDeltaAt: number | null;
  /** Estimated tokens streamed so far in this response. */
  streamedChars: number;
  /** Most recent completed response: duration (ms) and exact output tokens. */
  last: { durationMs: number; outputTokens: number | null; tokPerSec: number | null } | null;
};

export const emptyThroughput = (): ThroughputState => ({
  startedAt: null,
  firstDeltaAt: null,
  streamedChars: 0,
  last: null,
});

const CHARS_PER_TOKEN = 4;

export function startThroughput(state: ThroughputState, now = Date.now()): ThroughputState {
  return { ...state, startedAt: now, firstDeltaAt: null, streamedChars: 0 };
}

export function recordDelta(state: ThroughputState, chars: number, now = Date.now()): ThroughputState {
  if (state.startedAt === null || chars <= 0) return state;
  return {
    ...state,
    firstDeltaAt: state.firstDeltaAt ?? now,
    streamedChars: state.streamedChars + chars,
  };
}

/** Estimated live tokens/sec. Uses the window from the first delta so TTFT does not depress the figure. */
export function liveTokensPerSecond(state: ThroughputState, now = Date.now()): number | null {
  if (state.startedAt === null || state.firstDeltaAt === null) return null;
  const elapsedSec = (now - state.firstDeltaAt) / 1000;
  if (elapsedSec < 0.5) return null;
  return state.streamedChars / CHARS_PER_TOKEN / elapsedSec;
}

export function finishThroughput(
  state: ThroughputState,
  outputTokens: number | undefined,
  now = Date.now(),
): ThroughputState {
  if (state.startedAt === null) return state;
  const durationMs = now - state.startedAt;
  const genSec = state.firstDeltaAt !== null ? (now - state.firstDeltaAt) / 1000 : 0;
  const tokens = typeof outputTokens === "number" ? outputTokens : state.streamedChars / CHARS_PER_TOKEN;
  const tokPerSec = genSec > 0.2 && tokens > 0 ? tokens / genSec : null;
  return {
    startedAt: null,
    firstDeltaAt: null,
    streamedChars: 0,
    last: {
      durationMs,
      outputTokens: typeof outputTokens === "number" ? outputTokens : null,
      tokPerSec,
    },
  };
}

export function formatRate(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(1)} tok/s`;
}

export function formatDuration(ms: number) {
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const sec = ms / 1000;
  if (sec < 60) return `${sec.toFixed(1)} s`;
  const min = Math.floor(sec / 60);
  return `${min}m ${Math.round(sec % 60)}s`;
}
