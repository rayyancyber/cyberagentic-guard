import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, Swords, ShieldCheck, FlaskConical, Server, Bug, Activity,
  Siren, FileText, Users, GraduationCap, Settings,
  PanelLeftClose, PanelLeftOpen, Bell, Moon, Sun, LogOut, Search, Menu,
} from "lucide-react";
import { signOut as firebaseSignOut, getCurrentUser } from "@/integrations/firebase/client";
import { signOutAll } from "@/integrations/supabase/client";
import { useRows } from "@/lib/data";
import { Logo } from "./kit";
import { cn } from "@/lib/utils";

export const NAV = [
  { to: "/dashboard",       label: "Overview",             icon: LayoutDashboard },
  { to: "/red-team",        label: "Red Team",             icon: Swords },
  { to: "/blue-team",       label: "Blue Team",            icon: ShieldCheck },
  { to: "/cyber-range",     label: "Cyber Range",          icon: FlaskConical },
  { to: "/assets",          label: "Assets & Targets",     icon: Server },
  { to: "/vulnerabilities", label: "Vulnerability Mgmt",   icon: Bug },
  { to: "/monitoring",      label: "Security Monitoring",  icon: Activity },
  { to: "/incidents",       label: "Alerts & Incidents",   icon: Siren },
  { to: "/reports",         label: "Evidence & Reports",   icon: FileText },
  { to: "/team",            label: "Team Workspace",       icon: Users },
  { to: "/learning",        label: "Learning Center",      icon: GraduationCap },
  { to: "/settings",        label: "Settings",             icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("cg-theme") !== "light";
  });
  const [q, setQ] = useState("");

  const path     = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const alerts   = useRows("alerts");
  const newAlerts = (alerts.data ?? []).filter((a) => a.status === "New");

  // Current Firebase user for header display
  const fbUser = getCurrentUser();

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("cg-theme", isDark ? "dark" : "light");
    setDark(isDark);
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await signOutAll();        // clears Supabase session
    await firebaseSignOut();   // clears Firebase session
    navigate({ to: "/auth", replace: true });
  };

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const hit = NAV.find((n) => n.label.toLowerCase().includes(q.toLowerCase()));
    if (hit) navigate({ to: hit.to });
    else navigate({ to: "/vulnerabilities", search: { q } as never });
  };

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-3" aria-label="Main navigation">
      <div className="mb-4 flex items-center gap-2 px-2 py-1">
        <Logo />
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">
              CYBERGUARD <span className="text-primary">X</span>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Security Lab
            </div>
          </div>
        )}
      </div>

      {NAV.map(({ to, label, icon: Icon }) => {
        const active = path.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={() => setMobile(false)}
            title={label}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "bg-sidebar-accent font-medium text-sidebar-primary",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        );
      })}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mt-auto hidden items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent md:flex"
      >
        {collapsed
          ? <PanelLeftOpen className="h-4 w-4" />
          : <PanelLeftClose className="h-4 w-4" />}
        {!collapsed && "Collapse"}
      </button>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r bg-sidebar transition-[width] md:block",
          collapsed ? "w-[68px]" : "w-60",
        )}
      >
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobile && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobile(false)}>
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          <aside
            className="absolute inset-y-0 left-0 w-64 border-r bg-sidebar"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur">
          <button
            className="md:hidden"
            onClick={() => setMobile(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          <form onSubmit={search} className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search pages or findings…"
              className="h-9 w-full rounded-lg border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </form>

          <div className="ml-auto flex items-center gap-2">
            {/* Lab status badge */}
            <span className="hidden items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs text-defense sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-defense" />
              LAB · ISOLATED
            </span>

            {/* Alert bell */}
            <Link
              to="/incidents"
              className="relative rounded-lg p-2 hover:bg-accent"
              aria-label={`${newAlerts.length} new alerts`}
            >
              <Bell className="h-4 w-4" />
              {newAlerts.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
                  {newAlerts.length}
                </span>
              )}
            </Link>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 hover:bg-accent"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User info */}
            {fbUser && (
              <div className="hidden text-right text-xs leading-tight sm:block">
                <div className="font-medium truncate max-w-[140px]">
                  {fbUser.displayName ?? fbUser.email}
                </div>
                <div className="text-muted-foreground">
                  {fbUser.emailVerified ? "verified" : "unverified"}
                </div>
              </div>
            )}

            {/* Sign out */}
            <button
              onClick={signOut}
              className="rounded-lg p-2 hover:bg-accent"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
