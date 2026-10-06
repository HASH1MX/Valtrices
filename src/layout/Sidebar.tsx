import { LayoutDashboard, Settings, type LucideIcon } from "lucide-react";
import { NavLink } from "react-router";
import { cn } from "../lib/cn";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-panel">
      <div className="flex items-center gap-3 px-5 py-5">
        <img src="/valtrices.svg" alt="" className="size-8 rounded-lg" />
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-wide text-fg">Valtrices</div>
          <div className="text-[11px] tracking-wider text-fg-faint uppercase">Match analytics</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 pt-2" aria-label="Primary">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent/12 text-fg"
                  : "text-fg-muted hover:bg-panel-raised hover:text-fg",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    "size-4",
                    isActive ? "text-accent" : "text-fg-faint group-hover:text-fg-muted",
                  )}
                  strokeWidth={1.75}
                  aria-hidden
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line px-5 py-4 text-xs text-fg-faint">
        <div className="flex items-center justify-between">
          <span>v{__APP_VERSION__}</span>
          <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase">
            {import.meta.env.MODE}
          </span>
        </div>
      </div>
    </aside>
  );
}
