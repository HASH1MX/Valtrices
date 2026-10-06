/// <reference types="vite/client" />

// Opt out of the permissive `[key: string]: any` index signature on import.meta.env
// so only the variables declared below are considered valid.
interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

// Injected by `define` in vite.config.ts from package.json.
declare const __APP_VERSION__: string;
