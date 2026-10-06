/**
 * Presence checks for build-time environment variables.
 * Only booleans are exported so no value can leak into the UI by accident.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const hasUrl = typeof url === "string" && url.length > 0;
const hasKey = typeof key === "string" && key.length > 0;

export const supabaseEnvStatus = {
  hasUrl,
  hasKey,
  configured: hasUrl && hasKey,
} as const;
