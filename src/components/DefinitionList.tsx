import type { ReactNode } from "react";

interface DefinitionListProps {
  rows: ReadonlyArray<readonly [label: string, value: ReactNode]>;
}

export function DefinitionList({ rows }: DefinitionListProps) {
  return (
    <dl className="divide-y divide-line text-sm">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0"
        >
          <dt className="text-fg-muted">{label}</dt>
          <dd className="font-mono text-xs text-fg">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
