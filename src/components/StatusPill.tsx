import type { ReactNode } from "react";
import { cn } from "../lib/cn";

type Tone = "positive" | "warning" | "neutral";

const TONE_CLASSES: Record<Tone, string> = {
  positive: "bg-positive/12 text-positive",
  warning: "bg-warning/12 text-warning",
  neutral: "bg-panel-raised text-fg-muted",
};

interface StatusPillProps {
  tone: Tone;
  children: ReactNode;
}

export function StatusPill({ tone, children }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}
