import { DatabaseIcon } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { formatCompactTokens } from "../../core/format";
import { usePiWebUiStore } from "../../core/store";
import type { UsageTotals } from "../../core/types";

/** Exact token counts keep digit grouping so the reading panel matches the Pi footer's whole numbers. */
function exactTokens(value: number) {
  return value.toLocaleString("en-US");
}

export function ComposerStats() {
  const usageTotals = usePiWebUiStore((state) => state.usageTotals);
  const lastUsage = usePiWebUiStore((state) => state.lastUsage);
  const [open, setOpen] = useState<"usage" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const total = usageTotals.input + usageTotals.cacheRead + usageTotals.cacheWrite + usageTotals.output;
  // Cache hit follows the Pi footer: the latest request only, not the session-wide share.
  const lastPromptTokens = (lastUsage?.input || 0) + (lastUsage?.cacheRead || 0) + (lastUsage?.cacheWrite || 0);
  const cacheHit = lastPromptTokens > 0 ? ((lastUsage?.cacheRead || 0) / lastPromptTokens) * 100 : null;

  if (total === 0) return null;

  const pillClass = "inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-white/5 hover:text-foreground";

  return (
    <div
      className="relative flex w-full flex-wrap items-center justify-end gap-x-4 gap-y-1 px-1 pt-2 text-[12px] text-muted-foreground tabular-nums"
      ref={rootRef}
    >
      {total > 0 && (
        <button
          aria-expanded={open === "usage"}
          aria-haspopup="dialog"
          aria-label={`Token usage ${formatCompactTokens(total)} tokens`}
          className={cn(pillClass, open === "usage" && "bg-white/5 text-foreground")}
          onClick={() => setOpen(open === "usage" ? null : "usage")}
          type="button"
        >
          <DatabaseIcon className="size-3.5 shrink-0" />
          <span>{formatCompactTokens(total)} tok</span>
          {cacheHit !== null && (
            <>
              <span className="opacity-40">·</span>
              <span>Cache {cacheHit.toFixed(0)}%</span>
            </>
          )}
        </button>
      )}

      {open === "usage" && total > 0 && <UsagePanel cacheHit={cacheHit} total={total} usageTotals={usageTotals} />}
    </div>
  );
}

function UsagePanel({
  cacheHit,
  total,
  usageTotals,
}: {
  cacheHit: number | null;
  total: number;
  usageTotals: UsageTotals;
}) {
  const rows = [
    { label: "Uncached input", value: usageTotals.input },
    { label: "Cache read", value: usageTotals.cacheRead },
    ...(usageTotals.cacheWrite > 0 ? [{ label: "Cache write", value: usageTotals.cacheWrite }] : []),
    { label: "Output", value: usageTotals.output },
    ...(cacheHit !== null ? [{ label: "Cache hit", text: `${cacheHit.toFixed(1)}%` }] : []),
    ...(usageTotals.cost > 0 ? [{ label: "Cost", text: `$${usageTotals.cost.toFixed(3)}` }] : []),
  ];

  return (
    <div
      aria-label="Token usage"
      className="absolute bottom-full left-1/2 z-20 mb-2 w-60 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg"
      role="dialog"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium">
          <DatabaseIcon className="size-3.5" />
          Token usage
        </span>
        <span className="text-muted-foreground tabular-nums">{formatCompactTokens(total)} tok</span>
      </div>
      <div className="my-2 h-px bg-border" />
      <dl className="grid grid-cols-2 gap-y-1 text-xs">
        {rows.map((row) => (
          <Fragment key={row.label}>
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-right tabular-nums">{"text" in row ? row.text : exactTokens(row.value)}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}
