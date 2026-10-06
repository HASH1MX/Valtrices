import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { DefinitionList } from "../components/DefinitionList";
import { PageHeader } from "../components/PageHeader";
import { SupabaseStatusPill } from "../components/SupabaseStatusPill";
import { useSupabaseHealth } from "../hooks/useSupabaseHealth";
import { isSupabaseConfigured, supabaseHost } from "../lib/supabase";
import { getAppInfo, runningInTauri, type AppInfo } from "../lib/tauri";

export function SettingsPage() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const health = useSupabaseHealth();
  const last = health.last;

  useEffect(() => {
    let cancelled = false;
    getAppInfo()
      .then((result) => {
        if (!cancelled) setInfo(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Application configuration. Preferences will be added as features land."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Application" description="Values reported by the Rust side over Tauri IPC.">
          {!runningInTauri ? (
            <p className="text-sm text-fg-muted">
              Not running inside Tauri (browser preview). Launch with{" "}
              <code className="font-mono text-xs text-fg">pnpm tauri dev</code> to see native app
              info.
            </p>
          ) : error ? (
            <p className="text-sm text-warning">IPC call failed: {error}</p>
          ) : info ? (
            <DefinitionList
              rows={[
                ["Name", info.name],
                ["Version", info.version],
                ["Tauri", info.tauriVersion],
                ["Platform", `${info.os} / ${info.arch}`],
                ["Build", info.debug ? "debug" : "release"],
              ]}
            />
          ) : (
            <p className="text-sm text-fg-muted">Loading&hellip;</p>
          )}
        </Card>

        <Card
          title="Supabase"
          description="Reachability of the configured project, checked against its auth service with the publishable key."
        >
          {!isSupabaseConfigured ? (
            <p className="text-sm text-fg-muted">
              Not configured. Copy <code className="font-mono">.env.example</code> to{" "}
              <code className="font-mono">.env</code>, fill in the project URL and publishable key,
              then restart the dev server.
            </p>
          ) : (
            <>
              <DefinitionList
                rows={[
                  ["Status", <SupabaseStatusPill health={health} />],
                  ["Project", supabaseHost ?? "unknown"],
                  ["Auth service", last?.ok ? last.version : "n/a"],
                  ["Latency", last?.ok ? `${last.latencyMs} ms` : "n/a"],
                  ["Last checked", last ? last.checkedAt.toLocaleTimeString() : "never"],
                ]}
              />
              {last && !last.ok && <p className="mt-3 text-xs text-warning">{last.error}</p>}
              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="text-xs text-fg-faint">
                  The service_role key must never be used in this app.
                </p>
                <Button onClick={() => void health.recheck()} disabled={health.checking}>
                  {health.checking ? "Checking\u2026" : "Re-check"}
                </Button>
              </div>
            </>
          )}
        </Card>

        <Card title="Appearance" description="Only the dark theme exists right now.">
          <DefinitionList rows={[["Theme", "Dark"]]} />
        </Card>
      </div>
    </>
  );
}
