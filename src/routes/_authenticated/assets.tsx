import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, Panel, Chip, Empty, Field, selectCls } from "@/components/cg/kit";
import { useRows, useSave, OPEN_VULN, type Row } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/assets")({
  head: () => ({ meta: [{ title: "Assets & Targets — CYBERGUARD X" }, { name: "description", content: "Authorized lab asset inventory." }] }),
  component: Assets,
});

type A = Row<"assets">;

function AssetForm({ asset, onDone }: { asset?: A; onDone: () => void }) {
  const save = useSave("assets");
  const [v, setV] = useState({
    hostname: asset?.hostname ?? "", ip_address: asset?.ip_address ?? "", environment: asset?.environment ?? "Lab", owner_name: asset?.owner_name ?? "",
    os: asset?.os ?? "", services: asset?.services ?? "", tags: (asset?.tags ?? []).join(", "), authorized: asset?.authorized ?? false, permitted_methods: asset?.permitted_methods ?? "",
  });
  const set = (k: string, val: unknown) => setV({ ...v, [k]: val });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const values = { ...v, tags: v.tags.split(",").map((t) => t.trim()).filter(Boolean) };
    save.mutate({ id: asset?.id, values }, { onSuccess: onDone });
  };
  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Hostname"><Input required value={v.hostname} onChange={(e) => set("hostname", e.target.value)} /></Field>
      <Field label="Private lab IP"><Input value={v.ip_address} pattern="^(10|172\.(1[6-9]|2\d|3[01])|192\.168)\..*" title="Use a private (RFC1918) address" onChange={(e) => set("ip_address", e.target.value)} /></Field>
      <Field label="Environment"><select className={selectCls} value={v.environment} onChange={(e) => set("environment", e.target.value)}>{["Lab", "Development", "Production"].map((x) => <option key={x}>{x}</option>)}</select></Field>
      <Field label="Owner"><Input value={v.owner_name} onChange={(e) => set("owner_name", e.target.value)} /></Field>
      <Field label="Operating system"><Input value={v.os} onChange={(e) => set("os", e.target.value)} /></Field>
      <Field label="Services"><Input value={v.services} onChange={(e) => set("services", e.target.value)} /></Field>
      <Field label="Tags (comma separated)"><Input value={v.tags} onChange={(e) => set("tags", e.target.value)} /></Field>
      <Field label="Permitted testing methods"><Input value={v.permitted_methods} onChange={(e) => set("permitted_methods", e.target.value)} /></Field>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" checked={v.authorized} onChange={(e) => set("authorized", e.target.checked)} />
        Authorized for offensive testing (Production assets are rejected by the server)
      </label>
      <Button className="sm:col-span-2" disabled={save.isPending}>{asset ? "Save changes" : "Add asset"}</Button>
    </form>
  );
}

function Assets() {
  const assets = useRows("assets");
  const findings = useRows("findings");
  const alerts = useRows("alerts");
  const save = useSave("assets");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<A | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const list = (assets.data ?? []).filter((a) => showArchived || !a.archived);

  return (
    <>
      <PageHeader
        title="Assets & authorized targets"
        subtitle="Only authorized, non-archived assets can be put in an assessment scope. This is enforced in the database, not just here."
        actions={<>
          <Button variant="outline" size="sm" onClick={() => setShowArchived(!showArchived)}>{showArchived ? "Hide archived" : "Show archived"}</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm">Add asset</Button></DialogTrigger>
            <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>New asset</DialogTitle></DialogHeader><AssetForm onDone={() => setOpen(false)} /></DialogContent>
          </Dialog>
        </>}
      />
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Edit {edit?.hostname}</DialogTitle></DialogHeader>{edit && <AssetForm asset={edit} onDone={() => setEdit(null)} />}</DialogContent>
      </Dialog>
      {list.length === 0 ? <Empty title="No assets">Add your first lab machine.</Empty> : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((a) => {
            const af = (findings.data ?? []).filter((f) => f.asset_id === a.id);
            const aa = (alerts.data ?? []).filter((x) => x.asset_id === a.id);
            return (
              <Panel key={a.id} className={a.archived ? "opacity-60" : ""}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono font-medium">{a.hostname}</div>
                    <div className="font-mono text-xs text-muted-foreground">{a.ip_address ?? "no IP"} · {a.os ?? "unknown OS"}</div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    <Chip tone={a.environment === "Production" ? "warn" : "muted"}>{a.environment}</Chip>
                    {a.authorized ? <Chip tone="defense">Authorized</Chip> : <Chip tone="warn">Not authorized</Chip>}
                    {a.is_sample && <Chip>sample</Chip>}
                  </div>
                </div>
                <div className="mt-3 text-sm text-muted-foreground">{a.services}</div>
                {a.permitted_methods && <div className="mt-1 text-xs">Permitted: {a.permitted_methods}</div>}
                <div className="mt-3 flex flex-wrap gap-1">{a.tags.map((t) => <Chip key={t}>#{t}</Chip>)}</div>
                <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs">
                  <span className="text-muted-foreground">{af.filter((f) => OPEN_VULN.includes(f.status)).length} open findings · {aa.length} alerts</span>
                  <span className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEdit(a)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => save.mutate({ id: a.id, values: { archived: !a.archived } })}>{a.archived ? "Restore" : "Archive"}</Button>
                  </span>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </>
  );
}
