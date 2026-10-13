import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, Panel, Stat, Sev, Chip, Empty, Field, selectCls, fmt } from "@/components/cg/kit";
import { useRows, useSave, SEVERITIES, VULN_STATUSES, OPEN_VULN, type Row } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/vulnerabilities")({
  head: () => ({ meta: [{ title: "Vulnerabilities — CYBERGUARD X" }] }),
  component: Vulnerabilities,
});

type Finding = Row<"findings">;

function FindingForm({ finding, onDone }: { finding?: Finding; onDone: () => void }) {
  const save = useSave("findings");
  const assets = useRows("assets");
  const assessments = useRows("assessments");

  const [v, setV] = useState({
    title: finding?.title ?? "",
    severity: finding?.severity ?? "Medium",
    status: finding?.status ?? "Discovered",
    category: finding?.category ?? "",
    cvss: finding?.cvss ?? null as number | null,
    steps: finding?.steps ?? "",
    impact: finding?.impact ?? "",
    evidence: finding?.evidence ?? "",
    recommendation: finding?.recommendation ?? "",
    asset_id: finding?.asset_id ?? "",
    assessment_id: finding?.assessment_id ?? "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const values: any = { ...v };
    if (!values.asset_id) delete values.asset_id;
    if (!values.assessment_id) delete values.assessment_id;
    if (!values.cvss) delete values.cvss;
    save.mutate({ id: finding?.id, values }, { onSuccess: onDone });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 max-h-[70vh] overflow-y-auto pr-1">
      <Field label="Title">
        <Input required value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} className="sm:col-span-2" />
      </Field>
      <Field label="Severity">
        <select className={selectCls} value={v.severity} onChange={(e) => setV({ ...v, severity: e.target.value })}>
          {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Status">
        <select className={selectCls} value={v.status} onChange={(e) => setV({ ...v, status: e.target.value })}>
          {VULN_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Category"><Input value={v.category ?? ""} onChange={(e) => setV({ ...v, category: e.target.value })} /></Field>
      <Field label="CVSS score (0–10)"><Input type="number" min={0} max={10} step={0.1} value={v.cvss ?? ""} onChange={(e) => setV({ ...v, cvss: e.target.value ? Number(e.target.value) : null })} /></Field>
      <Field label="Linked asset">
        <select className={selectCls} value={v.asset_id} onChange={(e) => setV({ ...v, asset_id: e.target.value })}>
          <option value="">— none —</option>
          {(assets.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.hostname}</option>)}
        </select>
      </Field>
      <Field label="Assessment">
        <select className={selectCls} value={v.assessment_id} onChange={(e) => setV({ ...v, assessment_id: e.target.value })}>
          <option value="">— none —</option>
          {(assessments.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>
      <Field label="Steps to reproduce">
        <Textarea rows={3} value={v.steps ?? ""} onChange={(e) => setV({ ...v, steps: e.target.value })} className="sm:col-span-2" />
      </Field>
      <Field label="Impact">
        <Textarea rows={2} value={v.impact ?? ""} onChange={(e) => setV({ ...v, impact: e.target.value })} />
      </Field>
      <Field label="Recommendation">
        <Textarea rows={2} value={v.recommendation ?? ""} onChange={(e) => setV({ ...v, recommendation: e.target.value })} />
      </Field>
      <Field label="Evidence notes">
        <Textarea rows={2} value={v.evidence ?? ""} onChange={(e) => setV({ ...v, evidence: e.target.value })} className="sm:col-span-2" />
      </Field>
      <Button className="sm:col-span-2" disabled={save.isPending}>{finding ? "Save changes" : "Create finding"}</Button>
    </form>
  );
}

function Vulnerabilities() {
  const findings = useRows("findings");
  const assets = useRows("assets");
  const save = useSave("findings");

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Finding | null>(null);
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const list = findings.data ?? [];

  const filtered = list.filter((f) => {
    const matchSearch = !search || f.title.toLowerCase().includes(search.toLowerCase()) || (f.category ?? "").toLowerCase().includes(search.toLowerCase());
    const matchSev = sevFilter === "All" || f.severity === sevFilter;
    const matchStatus = statusFilter === "All" || f.status === statusFilter;
    return matchSearch && matchSev && matchStatus;
  });

  const open_ = list.filter((f) => OPEN_VULN.includes(f.status));
  const byAsset = (id: string) => assets.data?.find((a) => a.id === id)?.hostname ?? "—";

  return (
    <>
      <PageHeader
        title="Vulnerability tracker"
        subtitle="Full lifecycle: from discovery through remediation and verification. Link findings to assets and assessments."
        actions={
          <>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />New finding</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Create finding</DialogTitle></DialogHeader>
                <FindingForm onDone={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {SEVERITIES.map((s) => {
          const count = open_.filter((f) => f.severity === s).length;
          return <Stat key={s} label={s} value={count} tone={s === "Critical" ? "danger" : s === "High" ? "danger" : s === "Medium" ? "warn" : undefined} />;
        })}
      </div>

      {/* Filters */}
      <Panel className="mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search title, category…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className={`${selectCls} w-36`} value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}>
            <option value="All">All severities</option>
            {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className={`${selectCls} w-48`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All statuses</option>
            {VULN_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </Panel>

      {/* Edit dialog */}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit finding</DialogTitle></DialogHeader>
          {edit && <FindingForm finding={edit} onDone={() => setEdit(null)} />}
        </DialogContent>
      </Dialog>

      {filtered.length === 0 ? (
        <Empty title="No findings match your filters">Try adjusting the search or filters above.</Empty>
      ) : (
        <div className="grid gap-3">
          {filtered.map((f) => (
            <Panel key={f.id} className="hover:border-primary/40 transition-colors cursor-pointer" action={
              <div className="flex gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => setEdit(f)}>Edit</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => save.mutate({ id: f.id, values: { status: "Accepted Risk" } })}
                  className="text-muted-foreground"
                >
                  Accept risk
                </Button>
              </div>
            }>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{f.title}</span>
                    {f.is_sample && <Chip>sample</Chip>}
                    {f.category && <Chip tone="muted">{f.category}</Chip>}
                  </div>
                  <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                    {f.asset_id && <span>Asset: <span className="font-mono">{byAsset(f.asset_id)}</span></span>}
                    {f.cvss != null && <span>CVSS: <span className="text-foreground font-mono">{f.cvss.toFixed(1)}</span></span>}
                    <span>{fmt(f.created_at)}</span>
                    {f.verified_at && <span className="text-defense">Verified {fmt(f.verified_at)}</span>}
                  </div>
                  {f.impact && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{f.impact}</p>}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Sev s={f.severity} />
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${OPEN_VULN.includes(f.status) ? "border-warning/40 bg-warning/10 text-warning" : "border-defense/40 bg-defense/10 text-defense"}`}>
                    {f.status}
                  </span>
                </div>
              </div>
              {f.steps && (
                <div className="mt-3 border-t pt-3">
                  <div className="text-xs text-muted-foreground mb-1">Steps</div>
                  <p className="text-xs font-mono bg-muted/50 rounded p-2 line-clamp-3">{f.steps}</p>
                </div>
              )}
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
