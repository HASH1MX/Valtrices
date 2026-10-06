import { useEffect, useState } from "react";
import { Card } from "../components/Card";
import { DefinitionList } from "../components/DefinitionList";
import { PageHeader } from "../components/PageHeader";
import { StatusPill } from "../components/StatusPill";
import { supabaseEnvStatus } from "../lib/env";
import { getAppInfo, runningInTauri, type AppInfo } from "../lib/tauri";

export function SettingsPage() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          description="Connection settings are read from environment variables at build time. Values are never displayed."
        >
          <DefinitionList
            rows={[
              [
                "Status",
                <StatusPill tone={supabaseEnvStatus.configured ? "positive" : "warning"}>
                  {supabaseEnvStatus.configured ? "Configured" : "Not configured"}
                </StatusPill>,
              ],
              ["VITE_SUPABASE_URL", supabaseEnvStatus.hasUrl ? "set" : "missing"],
              ["VITE_SUPABASE_PUBLISHABLE_KEY", supabaseEnvStatus.hasKey ? "set" : "missing"],
            ]}
          />
          <p className="mt-4 text-xs text-fg-faint">
            Copy <code className="font-mono">.env.example</code> to{" "}
            <code className="font-mono">.env</code> and fill in the values from your Supabase
            project. The service_role key must never be used in this app.
          </p>
        </Card>

        <Card title="Appearance" description="Only the dark theme exists right now.">
          <DefinitionList rows={[["Theme", "Dark"]]} />
        </Card>
      </div>
    </>
  );
}
