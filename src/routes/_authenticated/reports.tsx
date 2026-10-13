import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { Download, FileText, Upload, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, Panel, Stat, Sev, Chip, Empty, Field, selectCls, fmt } from "@/components/cg/kit";
import { useRows, useSave, OPEN_VULN, SEVERITIES, postureScore, sha256Hex, type Row } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports & Evidence — CYBERGUARD X" }] }),
  component: Reports,
});

type Evidence = Row<"evidence">;

function EvidenceUpload({ onDone }: { onDone: () => void }) {
  const findings = useRows("findings");
  const incidents = useRows("incidents");
  const save = useSave("evidence");
  const fileRef = useRef<HTMLInputElement>(null);

  const [v, setV] = useState({ description: "", finding_id: "", incident_id: "" });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Select a file first");
    if (file.size > 10 * 1024 * 1024) return toast.error("File must be < 10 MB");

    setUploading(true);
    try {
      const sha256 = await sha256Hex(file);
      const path = `${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("evidence").upload(path, file);
      if (upErr) throw upErr;
      const values: any = {
        file_name: file.name, file_path: path, sha256, size_bytes: file.size,
        mime_type: file.type, description: v.description || null,
        finding_id: v.finding_id || null, incident_id: v.incident_id || null,
      };
      save.mutate({ values }, { onSuccess: onDone });
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 p-6 text-center transition-colors"
        >
          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          {file ? (
            <div>
              <div className="font-medium text-sm">{file.name}</div>
              <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Click to select a file (max 10 MB)</div>
          )}
        </button>
      </div>
      <Field label="Description"><Textarea rows={2} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} className="sm:col-span-2" /></Field>
      <Field label="Link to finding">
        <select className={selectCls} value={v.finding_id} onChange={(e) => setV({ ...v, finding_id: e.target.value })}>
          <option value="">— none —</option>
          {(findings.data ?? []).map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
        </select>
      </Field>
      <Field label="Link to incident">
        <select className={selectCls} value={v.incident_id} onChange={(e) => setV({ ...v, incident_id: e.target.value })}>
          <option value="">— none —</option>
          {(incidents.data ?? []).map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
        </select>
      </Field>
      <Button className="sm:col-span-2" disabled={uploading || save.isPending}>
        <Upload className="mr-1.5 h-3.5 w-3.5" />{uploading ? "Uploading…" : "Upload evidence"}
      </Button>
    </form>
  );
}

function generateReportText(
  findings: Row<"findings">[],
  assessments: Row<"assessments">[],
  incidents: Row<"incidents">[],
  alerts: Row<"alerts">[]
) {
  const open = findings.filter((f) => OPEN_VULN.includes(f.status));
  const score = postureScore(findings, alerts.filter((a) => a.status === "New" || a.status === "Investigating").length);
  const lines = [
    "CYBERGUARD X — Security Posture Report",
    `Generated: ${new Date().toLocaleString()}`,
    "=".repeat(50),
    "",
    `Overall Posture Score: ${score}/100`,
    "",
    "FINDINGS SUMMARY",
    "-".repeat(30),
    `Total findings: ${findings.length}`,
    `Open / in-progress: ${open.length}`,
    ...SEVERITIES.map((s) => `  ${s}: ${open.filter((f) => f.severity === s).length} open`),
    "",
    "OPEN FINDINGS",
    "-".repeat(30),
    ...(open.length === 0 ? ["  None"] : open.map((f) => `[${f.severity}] ${f.title} — ${f.status}`)),
    "",
    "ASSESSMENTS",
    "-".repeat(30),
    ...(assessments.length === 0 ? ["  None"] : assessments.map((a) => `${a.name} (${a.status}) — ${a.progress}% complete`)),
    "",
    "INCIDENTS",
    "-".repeat(30),
    ...(incidents.length === 0 ? ["  None"] : incidents.map((i) => `[${i.severity}] ${i.title} — ${i.status}`)),
    "",
    "ALERTS",
    "-".repeat(30),
    `Total: ${alerts.length}  New: ${alerts.filter((a) => a.status === "New").length}  Resolved: ${alerts.filter((a) => a.status === "Resolved").length}`,
  ];
  return lines.join("\n");
}

function Reports() {
  const findings = useRows("findings");
  const assessments = useRows("assessments");
  const incidents = useRows("incidents");
  const alerts = useRows("alerts");
  const evidence = useRows("evidence");
  const save = useSave("evidence");

  const [uploadOpen, setUploadOpen] = useState(false);

  const open = (findings.data ?? []).filter((f) => OPEN_VULN.includes(f.status));
  const score = postureScore(findings.data ?? [], (alerts.data ?? []).filter((a) => a.status === "New" || a.status === "Investigating").length);

  const downloadReport = () => {
    const text = generateReportText(findings.data ?? [], assessments.data ?? [], incidents.data ?? [], alerts.data ?? []);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cyberguard-report-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  const evidenceList = evidence.data ?? [];

  return (
    <>
      <PageHeader
        title="Reports & evidence"
        subtitle="Generate posture reports and manage evidence files linked to findings and incidents."
        actions={
          <>
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Upload className="mr-1.5 h-3.5 w-3.5" />Upload evidence</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>Upload evidence</DialogTitle></DialogHeader>
                <EvidenceUpload onDone={() => setUploadOpen(false)} />
              </DialogContent>
            </Dialog>
            <Button size="sm" onClick={downloadReport}>
              <Download className="mr-1.5 h-3.5 w-3.5" />Download report
            </Button>
          </>
        }
      />

      {/* Posture summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Posture score" value={score} tone={score > 70 ? "ok" : score > 40 ? "warn" : "danger"} hint="out of 100" />
        <Stat label="Open findings" value={open.length} tone={open.length > 0 ? "warn" : "ok"} />
        <Stat label="Assessments" value={(assessments.data ?? []).length} />
        <Stat label="Evidence files" value={evidenceList.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Findings breakdown */}
        <Panel title="Open findings by severity">
          {open.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No open findings — great posture!</div>
          ) : (
            <div className="space-y-2">
              {SEVERITIES.map((s) => {
                const count = open.filter((f) => f.severity === s).length;
                if (!count) return null;
                const pct = Math.round((count / open.length) * 100);
                return (
                  <div key={s}>
                    <div className="flex justify-between text-sm mb-1">
                      <Sev s={s} />
                      <span className="font-mono text-xs">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${s === "Critical" ? "bg-destructive" : s === "High" ? "bg-chart-2" : s === "Medium" ? "bg-warning" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        {/* Report preview */}
        <Panel title="Report preview" action={
          <Button size="sm" variant="ghost" onClick={downloadReport}>
            <Download className="h-3.5 w-3.5" />
          </Button>
        }>
          <pre className="text-xs font-mono bg-muted/50 rounded p-3 overflow-y-auto max-h-64 whitespace-pre-wrap leading-relaxed">
            {generateReportText(findings.data ?? [], assessments.data ?? [], incidents.data ?? [], alerts.data ?? [])}
          </pre>
        </Panel>

        {/* Assessment statuses */}
        <Panel title="Assessment status" className="lg:col-span-2">
          {(assessments.data ?? []).length === 0 ? (
            <Empty title="No assessments">Create one from the Red Team workspace.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">Assessment</th>
                    <th className="text-left py-2 pr-4 font-medium">Status</th>
                    <th className="text-left py-2 pr-4 font-medium">Progress</th>
                    <th className="text-left py-2 pr-4 font-medium">Findings</th>
                    <th className="text-left py-2 font-medium">Started</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(assessments.data ?? []).map((a) => {
                    const aFindings = (findings.data ?? []).filter((f) => f.assessment_id === a.id);
                    return (
                      <tr key={a.id} className="hover:bg-accent/40 transition-colors">
                        <td className="py-2 pr-4">
                          <div className="font-medium">{a.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{a.scope}</div>
                        </td>
                        <td className="py-2 pr-4">
                          <Chip tone={a.status === "Active" ? "offense" : a.status === "Completed" ? "defense" : "muted"}>{a.status}</Chip>
                        </td>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-offense" style={{ width: `${a.progress}%` }} />
                            </div>
                            <span className="text-xs font-mono">{a.progress}%</span>
                          </div>
                        </td>
                        <td className="py-2 pr-4 font-mono text-sm">{aFindings.length}</td>
                        <td className="py-2 text-xs text-muted-foreground">{fmt(a.start_date)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {/* Evidence list */}
      <div className="mt-6">
        <Panel title="Evidence files" action={
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost"><Plus className="h-3.5 w-3.5" /></Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Upload evidence</DialogTitle></DialogHeader>
              <EvidenceUpload onDone={() => setUploadOpen(false)} />
            </DialogContent>
          </Dialog>
        }>
          {evidenceList.length === 0 ? (
            <Empty title="No evidence uploaded">Upload screenshots, logs, or proof-of-concept files.</Empty>
          ) : (
            <ul className="divide-y">
              {evidenceList.map((ev) => (
                <li key={ev.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{ev.file_name}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate">SHA-256: {ev.sha256.slice(0, 16)}…</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{(ev.size_bytes / 1024).toFixed(1)} KB</span>
                    <span className="text-xs text-muted-foreground">{fmt(ev.created_at)}</span>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => save.mutate({ id: ev.id, remove: true })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
