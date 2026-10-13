import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel, Stat, Sev, Chip, Empty, Field, selectCls, fmt } from "@/components/cg/kit";
import { useRows, useSave, type Row } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/monitoring")({
  head: () => ({ meta: [{ title: "Monitoring — CYBERGUARD X" }] }),
  component: Monitoring,
});

type Event = Row<"security_events">;

const SEVERITIES = ["Critical", "High", "Medium", "Low", "Info"] as const;
const EVENT_TYPES = ["login_failure", "port_scan", "privilege_escalation", "data_exfiltration", "malware_detected", "brute_force", "sql_injection", "xss_attempt", "other"];
const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 } };

function Monitoring() {
  const events = useRows("security_events", { order: "occurred_at", limit: 500 });
  const alerts = useRows("alerts");
  const assets = useRows("assets");

  const [sevFilter, setSevFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [synthFilter, setSynthFilter] = useState("All");

  const list = events.data ?? [];

  const filtered = list.filter((e) => {
    const matchSev = sevFilter === "All" || e.severity === sevFilter;
    const matchType = typeFilter === "All" || e.event_type === typeFilter;
    const matchSynth = synthFilter === "All" || (synthFilter === "Real" ? !e.is_synthetic : e.is_synthetic);
    return matchSev && matchType && matchSynth;
  });

  // Build 24h timeline
  const now = Date.now();
  const timelineData = Array.from({ length: 24 }, (_, i) => {
    const end = now - (23 - i) * 3600_000;
    const inHour = (t: string) => { const d = new Date(t).getTime(); return d > end - 3600_000 && d <= end; };
    return {
      h: new Date(end).getHours() + ":00",
      Critical: list.filter((e) => inHour(e.occurred_at) && e.severity === "Critical").length,
      High: list.filter((e) => inHour(e.occurred_at) && e.severity === "High").length,
      Medium: list.filter((e) => inHour(e.occurred_at) && e.severity === "Medium").length,
      Low: list.filter((e) => inHour(e.occurred_at) && (e.severity === "Low" || e.severity === "Info")).length,
    };
  });

  const byAsset = (id: string | null) => assets.data?.find((a) => a.id === id)?.hostname ?? null;
  const newAlerts = (alerts.data ?? []).filter((a) => a.status === "New").length;

  return (
    <>
      <PageHeader
        title="Security monitoring"
        subtitle="Live event log from all sources. Events are evaluated against enabled detection rules automatically on insert."
        tone="defense"
        actions={
          <Button variant="outline" size="sm" onClick={() => events.refetch()}>
            <Activity className="mr-1.5 h-3.5 w-3.5" />Refresh
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Stat label="Total events" value={list.length} />
        {SEVERITIES.slice(0, 3).map((s) => (
          <Stat key={s} label={s} value={list.filter((e) => e.severity === s).length} tone={s === "Critical" ? "danger" : s === "High" ? "danger" : "warn"} />
        ))}
        <Stat label="New alerts" value={newAlerts} tone={newAlerts > 0 ? "danger" : "ok"} />
      </div>

      {/* Timeline chart */}
      <Panel title="Event activity · last 24h" className="mb-6">
        <div className="h-52">
          <ResponsiveContainer>
            <AreaChart data={timelineData}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="h" fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis allowDecimals={false} fontSize={11} stroke="var(--muted-foreground)" />
              <Tooltip {...tip} />
              <Area type="monotone" dataKey="Critical" stroke="var(--destructive)" fill="var(--destructive)" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="High" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.12} strokeWidth={2} />
              <Area type="monotone" dataKey="Medium" stroke="var(--warning)" fill="var(--warning)" fillOpacity={0.1} strokeWidth={1.5} />
              <Area type="monotone" dataKey="Low" stroke="var(--muted-foreground)" fill="var(--muted-foreground)" fillOpacity={0.08} strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Filters + event list */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select className={`${selectCls} w-36`} value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}>
          <option value="All">All severities</option>
          {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={`${selectCls} w-48`} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="All">All event types</option>
          {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className={`${selectCls} w-36`} value={synthFilter} onChange={(e) => setSynthFilter(e.target.value)}>
          <option value="All">All origins</option>
          <option value="Real">Real only</option>
          <option value="Synthetic">Synthetic only</option>
        </select>
        <span className="text-xs text-muted-foreground self-center">{filtered.length} events</span>
      </div>

      {filtered.length === 0 ? (
        <Empty title="No events match filters">Go to Blue Team to inject synthetic events.</Empty>
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left py-2 pr-4 font-medium">Time</th>
                  <th className="text-left py-2 pr-4 font-medium">Type</th>
                  <th className="text-left py-2 pr-4 font-medium">Source</th>
                  <th className="text-left py-2 pr-4 font-medium">Asset</th>
                  <th className="text-left py-2 pr-4 font-medium">Message</th>
                  <th className="text-left py-2 font-medium">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.slice(0, 100).map((ev) => (
                  <tr key={ev.id} className="hover:bg-accent/40 transition-colors">
                    <td className="py-2 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">{fmt(ev.occurred_at)}</td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-primary">{ev.event_type}</span>
                        {ev.is_synthetic && <Chip tone="warn">syn</Chip>}
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-xs font-mono">{ev.source}</td>
                    <td className="py-2 pr-4 text-xs font-mono">{byAsset(ev.asset_id) ?? "—"}</td>
                    <td className="py-2 pr-4 text-xs max-w-xs truncate">{ev.message}</td>
                    <td className="py-2"><Sev s={ev.severity} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 100 && (
              <p className="text-xs text-muted-foreground text-center pt-3">Showing 100 of {filtered.length} events. Use filters to narrow down.</p>
            )}
          </div>
        </Panel>
      )}
    </>
  );
}
