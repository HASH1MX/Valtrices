import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

function readConfig(): SupabaseConfig | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

const config = readConfig();

/** True when both build-time variables are present. */
export const isSupabaseConfigured = config !== null;

/** Hostname of the configured project. Public information, safe to display. */
export const supabaseHost: string | null = config ? hostOf(config.url) : null;

/**
 * The single Supabase client for the app. Null when the environment is not
 * configured so the UI can degrade gracefully instead of crashing at import time.
 */
export const supabase: SupabaseClient | null = config
  ? createClient(config.url, config.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // A desktop app has no OAuth redirect page, and the URL hash belongs to the router.
        detectSessionInUrl: false,
      },
    })
  : null;

export type SupabaseHealth =
  | { ok: true; version: string; latencyMs: number; checkedAt: Date }
  | { ok: false; error: string; checkedAt: Date };

/**
 * Reachability check against the project's auth service using only the
 * publishable key. Touches no tables, so it works before any schema exists.
 */
export async function checkSupabaseHealth(timeoutMs = 8000): Promise<SupabaseHealth> {
  const checkedAt = new Date();
  if (!config) return { ok: false, error: "Supabase is not configured", checkedAt };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();

  try {
    const response = await fetch(`${config.url}/auth/v1/health`, {
      headers: { apikey: config.publishableKey },
      signal: controller.signal,
    });
    const latencyMs = Math.round(performance.now() - started);
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}`, checkedAt };

    const body = (await response.json()) as { version?: string };
    return { ok: true, version: body.version ?? "unknown", latencyMs, checkedAt };
  } catch (err) {
    const error =
      err instanceof DOMException && err.name === "AbortError"
        ? `Timed out after ${timeoutMs} ms`
        : err instanceof Error
          ? err.message
          : String(err);
    return { ok: false, error, checkedAt };
  } finally {
    clearTimeout(timer);
  }
}
