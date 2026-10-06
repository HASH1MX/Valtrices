import { useEffect, useState } from "react";

const HOLD_MS = 900;
const FADE_MS = 400;

type Phase = "hold" | "fade" | "done";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Brief branded splash shown once per launch while the shell mounts behind it.
 * Honours prefers-reduced-motion by skipping the splash entirely.
 */
export function StartupSplash() {
  const [phase, setPhase] = useState<Phase>(() => (prefersReducedMotion() ? "done" : "hold"));

  // Arm the timers exactly once. If the splash was skipped, these are harmless no-ops.
  useEffect(() => {
    const fadeTimer = setTimeout(
      () => setPhase((current) => (current === "done" ? current : "fade")),
      HOLD_MS,
    );
    const doneTimer = setTimeout(() => setPhase("done"), HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden
      className={
        "fixed inset-0 z-50 flex items-center justify-center bg-app transition-opacity ease-out " +
        (phase === "fade" ? "pointer-events-none opacity-0" : "opacity-100")
      }
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div className="splash-rise flex flex-col items-center gap-4">
        <img src="/valtrices.svg" alt="" className="size-20 rounded-2xl" />
        <div className="text-center">
          <div className="text-lg font-semibold tracking-wide text-fg">Valtrices</div>
          <div className="text-[11px] tracking-[0.2em] text-fg-faint uppercase">
            Match analytics
          </div>
        </div>
      </div>
    </div>
  );
}
