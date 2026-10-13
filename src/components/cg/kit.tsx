import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-7 w-7", className)} aria-hidden>
      <path d="M16 2 4 7v8c0 7.5 5.1 13.4 12 15 6.9-1.6 12-7.5 12-15V7L16 2Z" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
      <path d="M11 11l10 10M21 11 11 21" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="text-offense" />
      <circle cx="16" cy="16" r="2.2" className="fill-defense" />
    </svg>
  );
}

export function PageHeader({ title, subtitle, actions, tone }: { title: string; subtitle?: string; actions?: ReactNode; tone?: "offense" | "defense" }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {tone && (
          <div className={cn("mb-1 font-mono text-xs uppercase tracking-widest", tone === "offense" ? "text-offense" : "text-defense")}>
            {tone === "offense" ? "Red Team · Offensive" : "Blue Team · Defensive"}
          </div>
        )}
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, className, action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("rounded-xl border bg-card p-5", className)}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: "danger" | "warn" | "ok" | "offense" }) {
  const c = { danger: "text-destructive", warn: "text-warning", ok: "text-defense", offense: "text-offense" }[tone ?? "ok"];
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-mono text-2xl font-semibold", tone ? c : "text-foreground")}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

const sevClass: Record<string, string> = {
  Critical: "bg-destructive/15 text-destructive border-destructive/30",
  High: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  Medium: "bg-warning/15 text-warning border-warning/30",
  Low: "bg-primary/10 text-primary border-primary/25",
  Info: "bg-muted text-muted-foreground border-border",
};
export function Sev({ s }: { s: string }) {
  return <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs font-medium", sevClass[s] ?? sevClass.Info)}>{s}</span>;
}

export function Chip({ children, tone }: { children: ReactNode; tone?: "offense" | "defense" | "warn" | "muted" }) {
  const c = {
    offense: "bg-offense/15 text-offense", defense: "bg-defense/15 text-defense", warn: "bg-warning/15 text-warning", muted: "bg-muted text-muted-foreground",
  }[tone ?? "muted"];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs", c)}>{children}</span>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <div className="font-medium">{title}</div>
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export const selectCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function fmt(d?: string | null) {
  return d ? new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
}
