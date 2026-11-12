import { BugIcon, CircleIcon, FolderSearchIcon, GitBranchIcon, SparklesIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ConnectionState, ModelInfo } from "../../core/types";

export const QUICK_ACTIONS = [
  {
    label: "Explore project structure",
    prompt: "Explore the project structure and summarize the main modules, entry points, and how they fit together.",
    icon: FolderSearchIcon,
  },
  {
    label: "Check git status",
    prompt:
      "Check the git status: list uncommitted changes, the current branch, and anything that looks risky to commit.",
    icon: GitBranchIcon,
  },
  {
    label: "Find bugs",
    prompt:
      "Review the codebase for likely bugs or unhandled edge cases. Rank findings by severity and do not change any files yet.",
    icon: BugIcon,
  },
] as const;

type WelcomePanelProps = {
  title: string;
  connection: ConnectionState;
  currentModel: ModelInfo | null;
  modelLabel: string;
  thinkingLevel: string;
  onQuickAction: (prompt: string) => void;
  disabled?: boolean;
};

const connectionLabel: Record<ConnectionState, string> = {
  connected: "Connected",
  connecting: "Connecting…",
  disconnected: "Disconnected",
};

/** Centered start screen: session title, connection status, model summary, and quick-action cards. */
export function WelcomePanel({
  title,
  connection,
  currentModel,
  modelLabel,
  thinkingLevel,
  onQuickAction,
  disabled,
}: WelcomePanelProps) {
  const contextWindow = currentModel?.contextWindow;
  return (
    <section className="flex min-h-full w-full flex-col items-center justify-center gap-8 py-10 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#4d6bfe]/15 text-[#7d93ff] ring-1 ring-[#4d6bfe]/30">
          <SparklesIcon className="size-6" />
        </div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground">{title || "DenGarChiK Web UI"}</h1>
        <p className="text-muted-foreground text-xs">by @dengarchik</p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-[13px] text-muted-foreground">
          <span className="harness-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1">
            <CircleIcon
              className={cn(
                "size-2 fill-current",
                connection === "connected" && "text-emerald-400",
                connection === "connecting" && "text-amber-400",
                connection === "disconnected" && "text-red-400",
              )}
            />
            {connectionLabel[connection]}
          </span>
          <span className="harness-glass inline-flex items-center gap-1.5 rounded-full px-3 py-1">
            <span className="text-foreground/90">{modelLabel}</span>
            {contextWindow ? <span className="opacity-60">· {formatWindow(contextWindow)} ctx</span> : null}
            <span className="opacity-60">· thinking {thinkingLevel}</span>
          </span>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              className="harness-glass harness-focus group flex flex-col items-start gap-3 rounded-2xl p-4 text-left transition-colors hover:border-[rgba(77,107,254,0.45)] hover:bg-[#242730] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={disabled}
              key={action.label}
              onClick={() => onQuickAction(action.prompt)}
              type="button"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-white/5 text-[#7d93ff]">
                <Icon className="size-4" />
              </span>
              <span className="text-sm font-medium text-foreground">{action.label}</span>
              <span className="text-xs text-muted-foreground">Sends a starter prompt to the composer</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function formatWindow(tokens: number) {
  if (tokens >= 1_000_000) return `${Math.round(tokens / 100_000) / 10}M`;
  return `${Math.round(tokens / 1000)}K`;
}
