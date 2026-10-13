import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Crosshair, Target, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, Panel, Stat, Sev, Chip, Empty, Field, selectCls, fmt } from "@/components/cg/kit";
import { useRows, useSave, type Row } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/red-team")({
  head: () => ({ meta: [{ title: "Red Team — CYBERGUARD X" }] }),
  component: RedTeam,
});

type Assessment = Row<"assessments">;

const STATUS = ["Planned", "Active", "Completed", "Cancelled"] as const;

function AssessmentForm({ item, onDone }: { item?: Assessment; onDone: () => void }) {
  const save = useSave("assessments");
  const assets = useRows("assets");
  const authorized = (assets.data ?? []).filter((a) => a.authorized && !a.archived);

  const [v, setV] = useState({
    name: item?.name ?? "",
    scope: item?.scope ?? "",
    description: item?.description ?? "",
    authorization_note: item?.authorization_note ?? "",
    status: item?.status ?? "Planned",
    asset_ids: item?.asset_ids ?? [] as string[],
    progress: item?.progress ?? 0,
  });

  const toggleAsset = (id: string) => {
    setV((prev) => ({
      ...prev,
      asset_ids: prev.asset_ids.includes(id)
        ? prev.asset_ids.filter((x) => x !== id)
        : [...prev.asset_ids, id],
    }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate({ id: item?.id, values: v }, { onSuccess: onDone });
  };

  return (
    <form onSubmit={submit} className="grid gap-3">
      <Field label="Assessment name">
        <Input required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
      </Field>
      <Field label="Scope description">
        <Input required value={v.scope} onChange={(e) => setV({ ...v, scope: e.target.value })} />
      </Field>
      <Field label="Description">
        <Textarea rows={2} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
      </Field>
      <Field label="Authorization note (required)">
        <Input required value={v.authorization_note} onChange={(e) => setV({ ...v, authorization_note: e.target.value })} />
      </Field>
      <Field label="Status">
        <select className={selectCls} value={v.status} onChange={(e) => setV({ ...v, status: e.target.value })}>
          {STATUS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Progress (%)">
        <Input type="number" min={0} max={100} value={v.progress} onChange={(e) => setV({ ...v, progress: Number(e.target.value) })} />
      </Field>
      <Field label="Authorized assets in scope">
        <div className="grid gap-1 max-h-40 overflow-y-auto rounded-md border border-input p-2">
          {authorized.length === 0 ? (
            <p className="text-xs text-muted-foreground">No authorized assets. Authorize assets first.</p>
          ) : authorized.map((a) => (
            <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent rounded px-1 py-0.5">
              <input type="checkbox" checked={v.asset_ids.includes(a.id)} onChange={() => toggleAsset(a.id)} />
              <span className="font-mono">{a.hostname}</span>
              <span className="text-xs text-muted-foreground">{a.ip_address}</span>
            </label>
          ))}
        </div>
      </Field>
      <Button disabled={save.isPending}>{item ? "Save changes" : "Create assessment"}</Button>
    </form>
  );
}

function RedTeam() {
  const assessments = useRows("assessments");
  const findings = useRows("findings");
  const assets = useRows("assets");
  const save = useSave("assessments", ["findings"]);

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Assessment | null>(null);
  const [filter, setFilter] = useState("All");

  const list = assessments.data ?? [];
  const filtered = filter === "All" ? list : list.filter((a) => a.status === filter);

  const getAssetNames = (ids: string[]) =>
    ids.map((id) => assets.data?.find((a) => a.id === id)?.hostname ?? id).join(", ");

  const getFindings = (id: string) => (findings.data ?? []).filter((f) => f.assessment_id === id);

  return (
    <>
      <PageHeader
        title="Red Team — Assessments"
        subtitle="Manage authorized penetration tests. Scope is validated server-side: only non-archived, authorized assets are accepted."
        tone="offense"
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/vulnerabilities">View all findings</Link>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />New assessment</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>Create assessment</DialogTitle></DialogHeader>
                <AssessmentForm onDone={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {/* Status stats */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-5 mb-6">
        {["All", ...STATUS].map((s) => {
          const count = s === "All" ? list.length : list.filter((a) => a.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-xl border p-3 text-left transition-colors ${filter === s ? "border-offense/60 bg-offense/10" : "bg-card hover:bg-accent"}`}
            >
              <div className="font-mono text-xl font-semibold text-offense">{count}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s}</div>
            </button>
          );
        })}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Edit {edit?.name}</DialogTitle></DialogHeader>
          {edit && <AssessmentForm item={edit} onDone={() => setEdit(null)} />}
        </DialogContent>
      </Dialog>

      {filtered.length === 0 ? (
        <Empty title="No assessments">Create your first authorized assessment above.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((a) => {
            const aFindings = getFindings(a.id);
            const critHigh = aFindings.filter((f) => f.severity === "Critical" || f.severity === "High").length;
            return (
              <Panel key={a.id} className="relative overflow-hidden">
                {/* Accent bar */}
                <div className={`absolute inset-x-0 top-0 h-0.5 ${a.status === "Active" ? "bg-offense" : a.status === "Completed" ? "bg-defense" : "bg-border"}`} />

                <div className="flex items-start justify-between gap-3 mt-1">
                  <div>
                    <div className="font-semibold leading-tight">{a.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-mono">{a.scope}</div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end shrink-0">
                    <Chip tone={a.status === "Active" ? "offense" : a.status === "Completed" ? "defense" : "muted"}>
                      {a.status}
                    </Chip>
                    {a.is_sample && <Chip>sample</Chip>}
                  </div>
                </div>

                {a.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.description}</p>}

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{a.progress}%</span>
                  </div>
                  <Progress value={a.progress} className="h-1.5" />
                </div>

                {a.asset_ids.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs">
                    <Target className="h-3 w-3 text-offense shrink-0" />
                    <span className="text-muted-foreground truncate">{getAssetNames(a.asset_ids)}</span>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{aFindings.length} findings</span>
                    {critHigh > 0 && <span className="text-destructive font-medium">{critHigh} crit/high</span>}
                    <span>{fmt(a.created_at)}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="ghost" onClick={() => setEdit(a)}>Edit</Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => save.mutate({ id: a.id, values: { status: a.status === "Active" ? "Planned" : "Active" } })}
                    >
                      {a.status === "Active" ? <RefreshCw className="h-3.5 w-3.5" /> : <Crosshair className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </>
  );
}
