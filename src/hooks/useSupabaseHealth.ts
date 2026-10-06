import { useCallback, useEffect, useState } from "react";
import { checkSupabaseHealth, type SupabaseHealth } from "../lib/supabase";

export interface SupabaseHealthState {
  /** True while a check is in flight. */
  checking: boolean;
  /** Result of the most recent completed check, if any. */
  last: SupabaseHealth | null;
  /** Runs the check again. */
  recheck: () => Promise<void>;
}

/** Runs a Supabase reachability check on mount and exposes a way to re-run it. */
export function useSupabaseHealth(): SupabaseHealthState {
  // Starts as "checking" so the mount effect only has to record the result.
  const [checking, setChecking] = useState(true);
  const [last, setLast] = useState<SupabaseHealth | null>(null);

  useEffect(() => {
    let cancelled = false;
    void checkSupabaseHealth().then((result) => {
      if (cancelled) return;
      setLast(result);
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const recheck = useCallback(async () => {
    setChecking(true);
    const result = await checkSupabaseHealth();
    setLast(result);
    setChecking(false);
  }, []);

  return { checking, last, recheck };
}
