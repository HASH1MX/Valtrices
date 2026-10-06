import { invoke, isTauri } from "@tauri-apps/api/core";

/** Mirrors the `AppInfo` struct in src-tauri/src/lib.rs (serialised as camelCase). */
export interface AppInfo {
  name: string;
  version: string;
  tauriVersion: string;
  os: string;
  arch: string;
  debug: boolean;
}

/** True when the UI runs inside the Tauri webview rather than a plain browser tab. */
export const runningInTauri = isTauri();

/** Fetches app metadata from the Rust side. Resolves to null outside Tauri. */
export async function getAppInfo(): Promise<AppInfo | null> {
  if (!runningInTauri) return null;
  return invoke<AppInfo>("app_info");
}
