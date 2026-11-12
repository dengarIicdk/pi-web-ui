import { BrainIcon } from "lucide-react";

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";
import type { ChatSubmitStatus } from "../../core/types";
import { ComposerStats } from "./composer-stats";
import { PromptAttachmentButton, PromptAttachmentPreview } from "./prompt-attachments";
import { type TranscriptQuote, TranscriptQuotePreview } from "./transcript-quote";

/** Reasoning levels exposed in the composer. `off` and `xhigh` stay available from the header. */
export const COMPOSER_THINKING_LEVELS = ["minimal", "low", "medium", "high"] as const;

type ChatInputProps = {
  quotes: TranscriptQuote[];
  onRemoveQuote: (id: string) => void;
  viewingHistory: boolean;
  disabled?: boolean;
  chatStatus: ChatSubmitStatus;
  value: string;
  thinkingLevel: string;
  onSelectThinking: (level: string) => void;
  onSubmit: (opts: { text: string; files?: unknown[] }) => void;
  onAbort: () => void;
  onValueChange: (value: string) => void;
};

export function ChatInput({
  quotes,
  onRemoveQuote,
  viewingHistory,
  disabled,
  chatStatus,
  value,
  thinkingLevel,
  onSelectThinking,
  onSubmit,
  onAbort,
  onValueChange,
}: ChatInputProps) {
  if (viewingHistory) {
    return (
      <footer className="shrink-0 px-4 py-3">
        <div className="harness-column text-center text-muted-foreground text-sm py-4">Viewing history</div>
      </footer>
    );
  }

  return (
    <footer className="shrink-0 w-full px-4 pb-4 pt-2 z-10">
      <div className="harness-column">
        <PromptInput accept="image/*" className="group/composer overflow-visible" globalDrop={true} multiple onSubmit={onSubmit}>
          <div className="harness-glass relative flex w-full max-w-[860px] mx-auto flex-col rounded-[18px] shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition-[box-shadow,border-color] duration-200 focus-within:border-[rgba(77,107,254,0.6)] focus-within:shadow-[0_0_0_3px_rgba(77,107,254,0.25),0_12px_40px_rgba(0,0,0,0.35)]">
            <TranscriptQuotePreview quotes={quotes} onRemove={onRemoveQuote} />
            <PromptAttachmentPreview />
            <PromptInputBody>
              <PromptInputTextarea
                aria-label="Message Pi"
                disabled={disabled}
                className="min-h-[44px] max-h-56 w-full resize-none border-0 bg-transparent px-5 pt-4 pb-2 text-[15px] leading-relaxed shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
                onChange={(event) => onValueChange(event.currentTarget.value)}
                placeholder="Ask Pi to inspect, change, or explain your project…"
                value={value}
              />
            </PromptInputBody>
            <PromptInputFooter className="flex items-center justify-between px-3 pb-3 pt-2">
              <PromptInputTools className="gap-2">
                <PromptAttachmentButton />
                <ThinkingSegment disabled={disabled} onSelect={onSelectThinking} value={thinkingLevel} />
              </PromptInputTools>
              <PromptInputSubmit
                aria-label="Send message"
                className="size-9 rounded-full bg-[#4d6bfe] text-white shadow-[0_6px_18px_rgba(77,107,254,0.45)] hover:bg-[#3d5bee] disabled:opacity-40"
                disabled={disabled}
                onStop={onAbort}
                status={chatStatus}
              />
            </PromptInputFooter>
          </div>
        </PromptInput>
        <ComposerStats />
      </div>
    </footer>
  );
}

/** Segmented control for reasoning depth. Keyboard: arrows move, Enter/Space select (native buttons). */
function ThinkingSegment({
  value,
  onSelect,
  disabled,
}: {
  value: string;
  onSelect: (level: string) => void;
  disabled?: boolean;
}) {
  const active = (COMPOSER_THINKING_LEVELS as readonly string[]).includes(value) ? value : "";
  return (
    <div
      aria-label="Thinking level"
      className="inline-flex items-center gap-0.5 rounded-full border border-white/8 bg-white/[0.03] p-0.5 text-[12px]"
      role="radiogroup"
    >
      <span className="flex items-center gap-1 px-2 text-muted-foreground" aria-hidden="true">
        <BrainIcon className="size-3.5" />
      </span>
      {COMPOSER_THINKING_LEVELS.map((level) => (
        <button
          aria-checked={active === level}
          className={cn(
            "rounded-full px-2.5 py-1 capitalize transition-colors harness-focus disabled:opacity-40",
            active === level
              ? "bg-[#4d6bfe] text-white shadow-[0_2px_10px_rgba(77,107,254,0.35)]"
              : "text-muted-foreground hover:text-foreground",
          )}
          disabled={disabled}
          key={level}
          onClick={() => onSelect(level)}
          role="radio"
          type="button"
        >
          {level}
        </button>
      ))}
    </div>
  );
}
