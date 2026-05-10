"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type AiAdviceProps = {
  markdown: string;
  className?: string;
};

export function AiAdvice({ markdown, className }: AiAdviceProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100 dark:border-zinc-800 dark:bg-zinc-900/50 dark:shadow-none dark:ring-zinc-800/60",
        className,
      )}
    >
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
        Lời khuyên từ AI
      </h3>
      <div className="ai-markdown">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
}
