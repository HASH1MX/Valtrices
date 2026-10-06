import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface CardProps {
  title?: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}

export function Card({ title, description, className, children }: CardProps) {
  return (
    <section className={cn("rounded-xl border border-line bg-panel p-5", className)}>
      {(title || description) && (
        <header className="mb-4">
          {title && <h2 className="text-sm font-semibold text-fg">{title}</h2>}
          {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
        </header>
      )}
      {children}
    </section>
  );
}
