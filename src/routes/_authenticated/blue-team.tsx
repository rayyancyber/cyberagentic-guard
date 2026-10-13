import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, ToggleLeft, ToggleRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, Panel, Stat, Sev, Chip, Empty, Field, selectCls, fmt } from "@/components/cg/kit";
import { useRows, useSave, type Row } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/blue-team")({
  head: () => ({ meta: [{ title: "Blue Team — CYBERGUARD X" }] }),
  component: BlueTeam,
});

type Rule = Row<"detection_rules">;
type Event = Row<"security_events">;

const FIELDS = ["event_type", "source", "message", "severity"] as const;
const OPERATORS = ["equals", "contains"] as const;
const SEVERITIES = ["Critical", "High", "Medium", "Low", "Info"] as const;
const EVENT_TYPES = ["login_failure", "port_scan", "privilege_escalation", "data_exfiltration", "malware_detected", "brute_force", "sql_injection", "xss_attempt"] as const;

function RuleForm({ rule, onDone }: { rule?: Rule; onDone: () => void }) {
  const save = useSave("detection_rules");
  const [v, setV] = useState({
    name: rule?.name ?? "",
    description: rule?.description ?? "",
    field: rule?.field ?? "event_type",
    operator: rule?.operator ?? "equals",
    value: rule?.value ?? "",
    severity: rule?.severity ?? "Medium",
    threshold: rule?.threshold ?? 1,
    window_minutes: rule?.window_minutes ?? 5,
    recommendation: rule?.recommendation ?? "",
    enabled: rule?.enabled ?? true,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate({ id: rule?.id, values: v }, { onSuccess: onDone });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Rule name"><Input required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className="sm:col-span-2" /></Field>
      <Field label="Description">
        <Textarea rows={2} value={v.description ?? ""} onChange={(e) => setV({ ...v, description: e.target.value })} />
      </Field>
      <Field label="Recommendation">
        <Textarea rows={2} value={v.recommendation ?? ""} onChange={(e) => setV({ ...v, recommendation: e.target.value })} />
      </Field>
      <Field label="Field to match">
        <select className={selectCls} value={v.field} onChange={(e) => setV({ ...v, field: e.target.value })}>
          {FIELDS.map((f) => <option key={f}>{f}</option>)}
        </select>
      </Field>
      <Field label="Operator">
        <select className={selectCls} value={v.operator} onChange={(e) => setV({ ...v, operator: e.target.value })}>
          {OPERATORS.map((o) => <option key={o}>{o}</option>)}
        </select>
      </Field>
      <Field label="Value to match"><Input required value={v.value} onChange={(e) => setV({ ...v, value: e.target.value })} /></Field>
      <Field label="Severity">
        <select className={selectCls} value={v.severity} onChange={(e) => setV({ ...v, severity: e.target.value })}>
          {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Threshold (hits)"><Input type="number" min={1} value={v.threshold} onChange={(e) => setV({ ...v, threshold: Number(e.target.value) })} /></Field>
      <Field label="Window (minutes)"><Input type="number" min={1} value={v.window_minutes} onChange={(e) => setV({ ...v, window_minutes: Number(e.target.value) })} /></Field>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" checked={v.enabled} onChange={(e) => setV({ ...v, enabled: e.target.checked })} />
        Rule enabled (will fire on matching new events)
      </label>
      <Button className="sm:col-span-2" disabled={save.isPending}>{rule ? "Save rule" : "Create rule"}</Button>
    </form>
  );
}

function EventInjector() {
  const saveEvent = useSave("security_events", ["alerts"]);
  const assets = useRows("assets");
  const [v, setV] = useState({ event_type: "login_failure", source: "lab-siem", message: "", severity: "Medium", asset_id: "" });

  const inject = (e: React.FormEvent) => {
    e.preventDefault();
    const values: any = { ...v, is_synthetic: true };
    if (!values.asset_id) delete values.asset_id;
    saveEvent.mutate({ values }, { onSuccess: () => setV({ ...v, message: "" }) });
  };

  return (
    <Panel title="Inject synthetic event" className="border-defense/30">
      <form onSubmit={inject} className="grid gap-3 sm:grid-cols-2">
        <Field label="Event type">
          <select className={selectCls} value={v.event_type} onChange={(e) => setV({ ...v, event_type: e.target.value })}>
            {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Source"><Input value={v.source} onChange={(e) => setV({ ...v, source: e.target.value })} /></Field>
        <Field label="Message (required)" ><Input required value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} /></Field>
        <Field label="Severity">
          <select className={selectCls} value={v.severity} onChange={(e) => setV({ ...v, severity: e.target.value })}>
            {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Asset (optional)">
          <select className={selectCls} value={v.asset_id} onChange={(e) => setV({ ...v, asset_id: e.target.value })}>
            <option value="">— none —</option>
            {(assets.data ?? []).filter((a) => !a.archived).map((a) => <option key={a.id} value={a.id}>{a.hostname}</option>)}
          </select>
        </Field>
        <div className="flex items-end sm:col-span-2">
          <Button type="submit" className="gap-2" disabled={saveEvent.isPending}>
            <Zap className="h-3.5 w-3.5" />Inject event
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function BlueTeam() {
  const rules = useRows("detection_rules");
  const events = useRows("security_events", { order: "occurred_at", limit: 30 });
  const alerts = useRows("alerts");
  const save = useSave("detection_rules");

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Rule | null>(null);

  const ruleList = rules.data ?? [];
  const enabledCount = ruleList.filter((r) => r.enabled).length;
  const alertCount = (alerts.data ?? []).filter((a) => a.status === "New").length;
  const eventCount = (events.data ?? []).length;

  return (
    <>
      <PageHeader
        title="Blue Team — Detection"
        subtitle="Write detection rules and watch them fire. Inject synthetic events to validate coverage before threats arrive."
        tone="defense"
        actions={
          <>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />New rule</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>Create detection rule</DialogTitle></DialogHeader>
                <RuleForm onDone={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total rules" value={ruleList.length} />
        <Stat label="Active rules" value={enabledCount} tone="ok" />
        <Stat label="New alerts" value={alertCount} tone={alertCount > 0 ? "danger" : "ok"} />
        <Stat label="Recent events" value={eventCount} hint="last 30" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 grid gap-4">
          {/* Detection rules */}
          <Panel title="Detection rules">
            {ruleList.length === 0 ? (
              <Empty title="No rules">Create your first detection rule above.</Empty>
            ) : (
              <ul className="divide-y">
                {ruleList.map((r) => (
                  <li key={r.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{r.name}</span>
                          <Sev s={r.severity} />
                          {!r.enabled && <Chip tone="muted">disabled</Chip>}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground mt-1">
                          <span className="text-primary">{r.field}</span>
                          {" "}<span className="text-offense">{r.operator}</span>{" "}
                          <span className="bg-muted rounded px-1">"{r.value}"</span>
                          {" · "}threshold {r.threshold} / {r.window_minutes}min
                        </div>
                        {r.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.description}</p>}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => save.mutate({ id: r.id, values: { enabled: !r.enabled } })}
                          title={r.enabled ? "Disable rule" : "Enable rule"}
                        >
                          {r.enabled ? <ToggleRight className="h-5 w-5 text-defense" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                        <Button size="sm" variant="ghost" onClick={() => setEdit(r)}>Edit</Button>
                      </div>
                    </div>
                    {r.recommendation && (
                      <div className="mt-1.5 text-xs text-defense bg-defense/10 rounded px-2 py-1">
                        Rec: {r.recommendation}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Event injector */}
          <EventInjector />
        </div>

        {/* Recent events feed */}
        <div className="lg:col-span-2">
          <Panel title="Recent security events">
            {(events.data ?? []).length === 0 ? (
              <Empty title="No events">Inject a synthetic event to see detections fire.</Empty>
            ) : (
              <ul className="divide-y text-sm space-y-0">
                {(events.data ?? []).map((ev) => (
                  <li key={ev.id} className="py-2.5 grid gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-primary">{ev.event_type}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {ev.is_synthetic && <Chip tone="warn">synthetic</Chip>}
                        <Sev s={ev.severity} />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{ev.message}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{ev.source}</span>
                      <span>{fmt(ev.occurred_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Edit rule: {edit?.name}</DialogTitle></DialogHeader>
          {edit && <RuleForm rule={edit} onDone={() => setEdit(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
