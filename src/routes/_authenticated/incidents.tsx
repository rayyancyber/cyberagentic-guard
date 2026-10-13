import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, Panel, Stat, Sev, Chip, Empty, Field, selectCls, fmt } from "@/components/cg/kit";
import { useRows, useSave, meanMinutes, type Row } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/incidents")({
  head: () => ({ meta: [{ title: "Incidents — CYBERGUARD X" }] }),
  component: Incidents,
});

type Alert = Row<"alerts">;
type Incident = Row<"incidents">;

const ALERT_STATUSES = ["New", "Investigating", "Resolved", "False Positive"] as const;
const INC_STATUSES = ["Open", "Investigating", "Contained", "Resolved", "Closed"] as const;
const SEVERITIES = ["Critical", "High", "Medium", "Low", "Info"] as const;

function AlertCard({ alert, onTriage, onEscalate }: { alert: Alert; onTriage: (id: string, status: string) => void; onEscalate: (a: Alert) => void }) {
  const statusColor: Record<string, string> = {
    New: "text-destructive border-destructive/40 bg-destructive/10",
    Investigating: "text-warning border-warning/40 bg-warning/10",
    Resolved: "text-defense border-defense/40 bg-defense/10",
    "False Positive": "text-muted-foreground border-border bg-muted",
  };

  return (
    <Panel className={`${alert.status === "New" ? "border-destructive/30" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{alert.title}</div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.reason}</p>
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
            <span>Hits: {alert.hit_count}</span>
            <span>{fmt(alert.created_at)}</span>
            {alert.acknowledged_at && <span className="text-warning">Ack: {fmt(alert.acknowledged_at)}</span>}
            {alert.resolved_at && <span className="text-defense">Resolved: {fmt(alert.resolved_at)}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Sev s={alert.severity} />
          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${statusColor[alert.status] ?? ""}`}>{alert.status}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
        {alert.status === "New" && (
          <Button size="sm" variant="outline" onClick={() => onTriage(alert.id, "Investigating")} className="text-warning border-warning/40 hover:bg-warning/10">
            <Clock className="h-3.5 w-3.5 mr-1" />Investigate
          </Button>
        )}
        {alert.status === "Investigating" && (
          <>
            <Button size="sm" variant="outline" onClick={() => onTriage(alert.id, "Resolved")} className="text-defense border-defense/40 hover:bg-defense/10">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Resolve
            </Button>
            <Button size="sm" variant="outline" onClick={() => onTriage(alert.id, "False Positive")} className="text-muted-foreground">
              False positive
            </Button>
            <Button size="sm" variant="default" onClick={() => onEscalate(alert)}>
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />Escalate to incident
            </Button>
          </>
        )}
        {(alert.status === "Resolved" || alert.status === "False Positive") && (
          <Button size="sm" variant="ghost" onClick={() => onTriage(alert.id, "New")} className="text-muted-foreground">Reopen</Button>
        )}
      </div>
    </Panel>
  );
}

function IncidentForm({ incident, linkedAlertId, onDone }: { incident?: Incident; linkedAlertId?: string; onDone: () => void }) {
  const save = useSave("incidents", ["alerts"]);
  const [v, setV] = useState({
    title: incident?.title ?? "",
    severity: incident?.severity ?? "High",
    status: incident?.status ?? "Open",
    summary: incident?.summary ?? "",
    timeline: incident?.timeline ?? "",
    root_cause: incident?.root_cause ?? "",
    lessons: incident?.lessons ?? "",
    alert_ids: incident?.alert_ids ?? (linkedAlertId ? [linkedAlertId] : [] as string[]),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate({ id: incident?.id, values: v }, { onSuccess: onDone });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 max-h-[70vh] overflow-y-auto pr-1">
      <Field label="Title"><Input required value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Severity">
          <select className={selectCls} value={v.severity} onChange={(e) => setV({ ...v, severity: e.target.value })}>
            {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className={selectCls} value={v.status} onChange={(e) => setV({ ...v, status: e.target.value })}>
            {INC_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Summary"><Textarea rows={2} value={v.summary ?? ""} onChange={(e) => setV({ ...v, summary: e.target.value })} /></Field>
      <Field label="Timeline of events"><Textarea rows={3} value={v.timeline ?? ""} onChange={(e) => setV({ ...v, timeline: e.target.value })} /></Field>
      <Field label="Root cause"><Textarea rows={2} value={v.root_cause ?? ""} onChange={(e) => setV({ ...v, root_cause: e.target.value })} /></Field>
      <Field label="Lessons learned"><Textarea rows={2} value={v.lessons ?? ""} onChange={(e) => setV({ ...v, lessons: e.target.value })} /></Field>
      <Button disabled={save.isPending}>{incident ? "Save changes" : "Create incident"}</Button>
    </form>
  );
}

function Incidents() {
  const alerts = useRows("alerts");
  const incidents = useRows("incidents");
  const alertSave = useSave("alerts", ["incidents"]);

  const [tab, setTab] = useState<"alerts" | "incidents">("alerts");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Incident | null>(null);
  const [escalateAlert, setEscalateAlert] = useState<Alert | null>(null);

  const alertList = alerts.data ?? [];
  const incList = incidents.data ?? [];

  const newAlerts = alertList.filter((a) => a.status === "New").length;
  const investigating = alertList.filter((a) => a.status === "Investigating").length;
  const openInc = incList.filter((i) => i.status !== "Closed" && i.status !== "Resolved").length;

  const mtta = meanMinutes(alertList, (a) => a.created_at, (a) => a.acknowledged_at);
  const mttr = meanMinutes(alertList, (a) => a.created_at, (a) => a.resolved_at);

  const handleTriage = (id: string, status: string) => alertSave.mutate({ id, values: { status } });

  return (
    <>
      <PageHeader
        title="Alerts & incidents"
        subtitle="Triage incoming alerts, escalate to incidents, and track resolution from discovery to close."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />New incident</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Create incident</DialogTitle></DialogHeader>
              <IncidentForm onDone={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="New alerts" value={newAlerts} tone={newAlerts > 0 ? "danger" : "ok"} />
        <Stat label="Investigating" value={investigating} tone={investigating > 0 ? "warn" : "ok"} />
        <Stat label="Open incidents" value={openInc} tone={openInc > 0 ? "warn" : "ok"} />
        <Stat label="MTTA / MTTR" value={mtta !== null ? `${mtta}m` : "—"} hint={mttr !== null ? `MTTR: ${mttr}min` : "No resolved alerts"} />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-4 border-b">
        <button
          onClick={() => setTab("alerts")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "alerts" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Alerts ({alertList.length})
        </button>
        <button
          onClick={() => setTab("incidents")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === "incidents" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Incidents ({incList.length})
        </button>
      </div>

      {/* Edit incident dialog */}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Edit incident</DialogTitle></DialogHeader>
          {edit && <IncidentForm incident={edit} onDone={() => setEdit(null)} />}
        </DialogContent>
      </Dialog>

      {/* Escalate to incident dialog */}
      <Dialog open={!!escalateAlert} onOpenChange={(o) => !o && setEscalateAlert(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Escalate to incident</DialogTitle></DialogHeader>
          {escalateAlert && (
            <IncidentForm
              linkedAlertId={escalateAlert.id}
              incident={undefined}
              onDone={() => {
                alertSave.mutate({ id: escalateAlert.id, values: { status: "Investigating" } });
                setEscalateAlert(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Alerts tab */}
      {tab === "alerts" && (
        alertList.length === 0 ? (
          <Empty title="No alerts yet">Alerts are auto-created when events match detection rules.</Empty>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {alertList.map((a) => (
              <AlertCard
                key={a.id}
                alert={a}
                onTriage={handleTriage}
                onEscalate={setEscalateAlert}
              />
            ))}
          </div>
        )
      )}

      {/* Incidents tab */}
      {tab === "incidents" && (
        incList.length === 0 ? (
          <Empty title="No incidents">Escalate an alert or create one manually.</Empty>
        ) : (
          <div className="grid gap-4">
            {incList.map((inc) => (
              <Panel key={inc.id} className={inc.status === "Open" ? "border-destructive/30" : ""}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{inc.title}</span>
                      <Chip tone={inc.status === "Closed" || inc.status === "Resolved" ? "defense" : inc.status === "Open" ? "offense" : "warn"}>
                        {inc.status}
                      </Chip>
                    </div>
                    {inc.summary && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{inc.summary}</p>}
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>{inc.alert_ids.length} linked alerts</span>
                      <span>{fmt(inc.created_at)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <Sev s={inc.severity} />
                    <Button size="sm" variant="ghost" onClick={() => setEdit(inc)}>Edit</Button>
                  </div>
                </div>
                {(inc.root_cause || inc.lessons) && (
                  <div className="mt-3 grid grid-cols-1 gap-2 border-t pt-3 sm:grid-cols-2">
                    {inc.root_cause && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-0.5">Root cause</div>
                        <p className="text-xs line-clamp-2">{inc.root_cause}</p>
                      </div>
                    )}
                    {inc.lessons && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-0.5">Lessons learned</div>
                        <p className="text-xs line-clamp-2">{inc.lessons}</p>
                      </div>
                    )}
                  </div>
                )}
              </Panel>
            ))}
          </div>
        )
      )}
    </>
  );
}
