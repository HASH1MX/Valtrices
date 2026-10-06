import type { SupabaseHealthState } from "../hooks/useSupabaseHealth";
import { isSupabaseConfigured } from "../lib/supabase";
import { StatusPill } from "./StatusPill";

interface SupabaseStatusPillProps {
  health: SupabaseHealthState;
}

export function SupabaseStatusPill({ health }: SupabaseStatusPillProps) {
  if (!isSupabaseConfigured) return <StatusPill tone="warning">Not configured</StatusPill>;
  if (health.checking && !health.last)
    return <StatusPill tone="neutral">Checking&hellip;</StatusPill>;
  if (health.last?.ok) return <StatusPill tone="positive">Connected</StatusPill>;
  return <StatusPill tone="warning">Unreachable</StatusPill>;
}
