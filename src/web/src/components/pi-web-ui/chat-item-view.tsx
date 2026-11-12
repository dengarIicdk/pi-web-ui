import { CopyIcon, EllipsisIcon, QuoteIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useState } from "react";

import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { historicalQuestion } from "../../core/ask-user-question";
import { usePiWebUiStore } from "../../core/store";
import { formatDuration } from "../../core/throughput";
import { formatToolSummary, isToolExpandable } from "../../core/tool-summary";
import type { ChatItem } from "../../core/types";
import { AskUserQuestionCard } from "./ask-user-question-card";

import type { TranscriptQuote } from "./transcript-quote";

export function ChatItemView({
  item,
  onCopy,
  onQuote,
  onToggleTool,
  showThinking,
}: {
  item: ChatItem;
  onCopy: (text: string) => Promise<void> | void;
  onQuote: (quote: TranscriptQuote) => void;
  onToggleTool: (id: string, open: boolean) => void;
  showThinking: boolean;
}) {
  const questionnaire = usePiWebUiStore((state) => state.questionnaires[item.id]);
  if (item.kind === "system") {
    return (
      <div
        className={cn(
          "mx-auto max-w-xl whitespace-pre-wrap rounded-md border px-3 py-2 text-center text-sm",
          item.tone === "error" && "border-destructive/30 bg-destructive/10 text-destructive",
          item.tone === "success" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
          (!item.tone || item.tone === "info") && "bg-muted text-muted-foreground",
        )}
      >
        {item.text}
      </div>
    );
  }

  if (item.kind === "tool") {
    const question = questionnaire ?? historicalQuestion(item);
    if (question) return <AskUserQuestionCard key={item.id} questionnaire={question} />;
    const expandable = isToolExpandable(item);
    const open = expandable ? (item.open ?? false) : false;

    return (
      <div className="w-full">
        <Tool
          className="harness-glass overflow-hidden rounded-xl"
          onOpenChange={(nextOpen) => expandable && onToggleTool(item.id, nextOpen)}
          open={open}
        >
          <ToolHeader
            className="px-3 py-2.5 text-[13px] hover:bg-white/[0.03] hover:text-foreground"
            collapsible={expandable}
            state={item.state}
            summary={
              <>
                {formatToolSummary(item)}
                <ToolElapsed className="ml-2 shrink-0 not-italic" item={item} />
              </>
            }
            title={item.name}
            type={`tool-${item.name}` as `tool-${string}`}
          />
          {expandable && (
            <ToolContent className="border-t border-white/[0.06] px-3 py-3 pl-3">
              <ToolInput input={item.input as never} />
              <ToolOutput
                data-quote-source={`${item.name} output`}
                errorText={item.errorText}
                output={item.output as never}
              />
            </ToolContent>
          )}
        </Tool>
      </div>
    );
  }

  // item.kind === "message" and role is "assistant" (user messages handled by UserMessageView)
  const canCopy = item.text.trim().length > 0 && item.copyable !== false && !item.streaming;
  const isActivity = item.presentation === "activity";

  return (
    <Message
      className={cn(
        canCopy && "relative rounded-lg has-[>[data-slot=dropdown-menu-trigger][data-state=open]]:bg-muted/50",
        isActivity && "gap-1",
      )}
      from={item.role}
    >
      {canCopy && (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Message actions"
              className="absolute -top-3 right-0 z-10 size-7 rounded-full bg-background shadow-xs transition-opacity [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
              size="icon"
              variant="outline"
            >
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44 rounded-lg">
            <DropdownMenuItem onSelect={() => onQuote({ id: nanoid(), source: "Assistant", text: item.text })}>
              <QuoteIcon />
              Add to Chat
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void onCopy(item.text)}>
              <CopyIcon />
              Copy as Markdown
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <MessageContent
        className={cn(
          "w-full",
          isActivity && "gap-1",
          item.streaming && 'after:ml-1 after:animate-pulse after:content-["▋"]',
        )}
      >
        {showThinking && item.reasoning && (
          <Reasoning
            className={cn("harness-glass overflow-hidden rounded-xl", isActivity && "mb-1")}
            isStreaming={Boolean(item.streaming)}
          >
            <ReasoningTrigger className={cn("px-3 py-2.5 text-[13px]", isActivity && "text-xs")} />
            <ReasoningContent
              data-quote-source="Assistant reasoning"
              className={cn(
                "border-t border-white/[0.06] px-3 py-3 text-[13px] text-muted-foreground",
                isActivity && "mt-1 text-xs",
              )}
            >
              {item.reasoning}
            </ReasoningContent>
          </Reasoning>
        )}
        <div data-quote-source="Assistant">
          <MessageResponse className={cn(isActivity && "[&_ol]:my-1 [&_p]:my-0 [&_pre]:my-1 [&_ul]:my-1")}>
            {item.text}
          </MessageResponse>
        </div>
      </MessageContent>
    </Message>
  );
}

/** Elapsed time for a tool call: ticks while running, freezes once finished. Hidden for replayed history. */
function ToolElapsed({ item, className }: { item: Extract<ChatItem, { kind: "tool" }>; className?: string }) {
  const running = item.state === "input-streaming" || item.state === "input-available";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [running]);
  if (item.startedAt === undefined) return null;
  const end = item.finishedAt ?? (running ? now : undefined);
  if (end === undefined) return null;
  return (
    <span className={cn("tabular-nums text-[11px] text-muted-foreground/80", className)}>
      {formatDuration(end - item.startedAt)}
    </span>
  );
}
