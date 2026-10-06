import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-line-strong bg-panel-raised px-3 py-1.5 text-sm font-medium text-fg transition-colors",
        "hover:border-fg-faint hover:bg-line focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...rest}
    />
  );
}
