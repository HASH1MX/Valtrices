import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { StatusPill } from "../components/StatusPill";
import { supabaseEnvStatus } from "../lib/env";
import { runningInTauri } from "../lib/tauri";

const PLACEHOLDER_STATS = [
  { label: "Matches tracked", hint: "Match history arrives in a later step" },
  { label: "Win rate", hint: "Needs match data" },
  { label: "Headshot %", hint: "Needs match data" },
  { label: "Tracker score", hint: "Scoring model not designed yet" },
];

export function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Your Valorant performance at a glance. Nothing is wired up yet; this is the shell."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PLACEHOLDER_STATS.map((stat) => (
          <Card key={stat.label}>
            <div className="text-xs font-medium tracking-wider text-fg-faint uppercase">
              {stat.label}
            </div>
            <div className="mt-2 text-3xl font-semibold text-fg-faint tabular-nums">&mdash;</div>
            <div className="mt-2 text-xs text-fg-faint">{stat.hint}</div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Recent matches"
          description="Placeholder. The match list, filters and detail view will live here."
        >
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-line-strong text-sm text-fg-faint">
            No data source connected
          </div>
        </Card>

        <Card title="Foundation status" description="What this build has in place.">
          <ul className="space-y-3 text-sm text-fg">
            <li className="flex items-center justify-between gap-4">
              <span>Desktop shell (Tauri)</span>
              <StatusPill tone={runningInTauri ? "positive" : "neutral"}>
                {runningInTauri ? "Running" : "Browser preview"}
              </StatusPill>
            </li>
            <li className="flex items-center justify-between gap-4">
              <span>React + Tailwind UI</span>
              <StatusPill tone="positive">Ready</StatusPill>
            </li>
            <li className="flex items-center justify-between gap-4">
              <span>Supabase</span>
              <StatusPill tone={supabaseEnvStatus.configured ? "positive" : "warning"}>
                {supabaseEnvStatus.configured ? "Env configured" : "Not configured"}
              </StatusPill>
            </li>
          </ul>
        </Card>
      </div>
    </>
  );
}
