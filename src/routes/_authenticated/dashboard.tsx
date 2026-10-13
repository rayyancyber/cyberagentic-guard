import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel, Stat, Sev, Empty, fmt, Chip } from "@/components/cg/kit";
import { OPEN_VULN, SEVERITIES, postureScore, useRows } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Overview — CYBERGUARD X" }, { name: "description", content: "Live lab security posture." }] }),
  component: Dashboard,
});

const sevColor: Record<string, string> = { Critical: "var(--chart-1)", High: "var(--chart-2)", Medium: "var(--chart-3)", Low: "var(--chart-4)", Info: "var(--chart-5)" };
const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 } };

function Dashboard() {
  const assets = useRows("assets");
  const findings = useRows("findings");
  const alerts = useRows("alerts");
  const incidents = useRows("incidents");
  const events = useRows("security_events", { order: "occurred_at", limit: 500 });
  const assessments = useRows("assessments");
  const tasks = useRows("team_tasks");

  const f = findings.data ?? [];
  const a = alerts.data ?? [];
  const open = f.filter((x) => OPEN_VULN.includes(x.status));
  const openAlerts = a.filter((x) => x.status === "New" || x.status === "Investigating");
  const sevData = SEVERITIES.map((s) => ({ s, n: open.filter((x) => x.severity === s).length }));

  const hours = Array.from({ length: 12 }, (_, i) => {
    const end = Date.now() - (11 - i) * 3600_000;
    const inHour = (t: string) => { const d = new Date(t).getTime(); return d > end - 3600_000 && d <= end; };
    return { h: new Date(end).getHours() + ":00", events: (events.data ?? []).filter((e) => inHour(e.occurred_at)).length, alerts: a.filter((x) => inHour(x.created_at)).length };
  });
  const fixed = f.filter((x) => x.status === "Verified Fixed").length;
  const progress = [
    { k: "Red Team", Found: f.length, Assessments: (assessments.data ?? []).length },
    { k: "Blue Team", Found: a.length, Assessments: fixed },
  ];
  const doneTasks = (tasks.data ?? []).filter((t) => t.status === "Done").length;
  const score = postureScore(f, openAlerts.length);

  return (
    <>
      <PageHeader
        title="Operations overview"
        subtitle="All numbers come from the lab database. Records marked sample are seeded training data."
        actions={<>
          <Button asChild variant="outline" size="sm"><Link to="/cyber-range">Open a lab</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/red-team">New assessment</Link></Button>
          <Button asChild variant="outline" size="sm"><Link to="/incidents">Investigate alert</Link></Button>
          <Button asChild size="sm"><Link to="/reports">Generate report</Link></Button>
        </>}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
        <Stat label="Posture score" value={score} tone={score > 70 ? "ok" : score > 40 ? "warn" : "danger"} />
        <Stat label="Lab assets" value={(assets.data ?? []).filter((x) => !x.archived).length} />
        <Stat label="Active assessments" value={(assessments.data ?? []).filter((x) => x.status === "Active").length} tone="offense" />
        <Stat label="Open vulns" value={open.length} tone="warn" />
        <Stat label="Critical / High" value={open.filter((x) => x.severity === "Critical" || x.severity === "High").length} tone="danger" />
        <Stat label="Open alerts" value={openAlerts.length} tone="danger" />
        <Stat label="Open incidents" value={(incidents.data ?? []).filter((x) => x.status !== "Closed").length} tone="warn" />
        <Stat label="Verified fixes" value={fixed} hint={`${doneTasks} tasks done`} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Open vulnerabilities by severity">
          <div className="h-56"><ResponsiveContainer><BarChart data={sevData}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="s" fontSize={11} stroke="var(--muted-foreground)" /><YAxis allowDecimals={false} fontSize={11} stroke="var(--muted-foreground)" /><Tooltip {...tip} cursor={{ fill: "var(--accent)" }} /><Bar dataKey="n" name="Findings" radius={[4, 4, 0, 0]}>{sevData.map((d) => <Cell key={d.s} fill={sevColor[d.s]} />)}</Bar></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Detection activity · last 12h">
          <div className="h-56"><ResponsiveContainer><LineChart data={hours}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="h" fontSize={11} stroke="var(--muted-foreground)" /><YAxis allowDecimals={false} fontSize={11} stroke="var(--muted-foreground)" /><Tooltip {...tip} /><Legend wrapperStyle={{ fontSize: 11 }} /><Line dataKey="events" stroke="var(--primary)" dot={false} strokeWidth={2} /><Line dataKey="alerts" stroke="var(--destructive)" dot={false} strokeWidth={2} /></LineChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Red vs Blue progress">
          <div className="h-56"><ResponsiveContainer><BarChart data={progress}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="k" fontSize={11} stroke="var(--muted-foreground)" /><YAxis allowDecimals={false} fontSize={11} stroke="var(--muted-foreground)" /><Tooltip {...tip} cursor={{ fill: "var(--accent)" }} /><Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => (v === "Found" ? "Findings / Alerts" : "Assessments / Verified fixes")} /><Bar dataKey="Found" fill="var(--offense)" radius={[4, 4, 0, 0]} /><Bar dataKey="Assessments" fill="var(--defense)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Panel>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Recent findings" action={<Link to="/vulnerabilities" className="text-xs text-primary">View all</Link>}>
          {f.length === 0 ? <Empty title="No findings yet">Create one from the Red Team workspace.</Empty> : (
            <ul className="divide-y">{f.slice(0, 6).map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="truncate">{x.title} {x.is_sample && <Chip>sample</Chip>}</span>
                <span className="flex shrink-0 items-center gap-2"><span className="text-xs text-muted-foreground">{x.status}</span><Sev s={x.severity} /></span>
              </li>))}</ul>)}
        </Panel>
        <Panel title="Latest alerts" action={<Link to="/incidents" className="text-xs text-primary">Triage</Link>}>
          {a.length === 0 ? <Empty title="No alerts">Alerts appear when events match a detection rule.</Empty> : (
            <ul className="divide-y">{a.slice(0, 6).map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="truncate">{x.title}</span>
                <span className="flex shrink-0 items-center gap-2"><span className="text-xs text-muted-foreground">{fmt(x.created_at)} · {x.status}</span><Sev s={x.severity} /></span>
              </li>))}</ul>)}
        </Panel>
      </div>
    </>
  );
}
