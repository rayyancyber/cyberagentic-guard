import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, MessageSquare, Clock, ArrowRight } from "lucide-react";import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader, Panel, Stat, Chip, Empty, Field, selectCls, fmt } from "@/components/cg/kit";
import { useRows, useSave, useProfiles, TASK_STATUSES, type Row } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({ meta: [{ title: "Team — CYBERGUARD X" }] }),
  component: Team,
});

type Task = Row<"team_tasks">;
type Comment = Row<"task_comments">;

function TaskForm({ task, onDone }: { task?: Task; onDone: () => void }) {
  const save = useSave("team_tasks");
  const profiles = useProfiles();
  const findings = useRows("findings");

  const [v, setV] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "To Do",
    priority: task?.priority ?? "Medium",
    due_date: task?.due_date ? task.due_date.split("T")[0] : "",
    assignee_id: task?.assignee_id ?? "",
    finding_id: task?.finding_id ?? "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const values: any = { ...v };
    if (!values.assignee_id) delete values.assignee_id;
    if (!values.finding_id) delete values.finding_id;
    if (!values.due_date) delete values.due_date;
    save.mutate({ id: task?.id, values }, { onSuccess: onDone });
  };

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
      <Field label="Title">
        <Input required value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} className="sm:col-span-2" />
      </Field>
      <Field label="Description">
        <Textarea rows={3} value={v.description ?? ""} onChange={(e) => setV({ ...v, description: e.target.value })} className="sm:col-span-2" />
      </Field>
      <Field label="Status">
        <select className={selectCls} value={v.status} onChange={(e) => setV({ ...v, status: e.target.value })}>
          {TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Priority">
        <select className={selectCls} value={v.priority} onChange={(e) => setV({ ...v, priority: e.target.value })}>
          {["Urgent", "High", "Medium", "Low"].map((p) => <option key={p}>{p}</option>)}
        </select>
      </Field>
      <Field label="Due date">
        <Input type="date" value={v.due_date} onChange={(e) => setV({ ...v, due_date: e.target.value })} />
      </Field>
      <Field label="Assignee">
        <select className={selectCls} value={v.assignee_id} onChange={(e) => setV({ ...v, assignee_id: e.target.value })}>
          <option value="">— unassigned —</option>
          {(profiles.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.display_name}</option>)}
        </select>
      </Field>
      <Field label="Linked finding" className="sm:col-span-2">
        <select className={selectCls} value={v.finding_id} onChange={(e) => setV({ ...v, finding_id: e.target.value })}>
          <option value="">— none —</option>
          {(findings.data ?? []).map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}
        </select>
      </Field>
      <Button className="sm:col-span-2" disabled={save.isPending}>{task ? "Save changes" : "Create task"}</Button>
    </form>
  );
}

function KanbanColumn({ title, tasks, onEdit, onMove, statusColor }: {
  title: string;
  tasks: Task[];
  onEdit: (t: Task) => void;
  onMove: (id: string, status: string) => void;
  statusColor: string;
}) {
  const nextStatus = TASK_STATUSES[TASK_STATUSES.indexOf(title as any) + 1];

  return (
    <div className="min-w-0">
      <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${statusColor}`}>
        <span className="font-medium text-sm">{title}</span>
        <span className="text-xs bg-muted rounded-full px-1.5 py-0.5 font-mono">{tasks.length}</span>
      </div>
      <div className="grid gap-2">
        {tasks.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">Empty</div>
        ) : tasks.map((t) => (
          <div
            key={t.id}
            className="rounded-lg border bg-card p-3 hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => onEdit(t)}
          >
            <div className="text-sm font-medium leading-snug">{t.title}</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Chip tone={t.priority === "Urgent" || t.priority === "High" ? "offense" : t.priority === "Medium" ? "warn" : "muted"}>
                {t.priority}
              </Chip>
              {t.due_date && (
                <Chip tone={new Date(t.due_date) < new Date() ? "offense" : "muted"}>
                  <Clock className="h-2.5 w-2.5 mr-0.5" />
                  {new Date(t.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </Chip>
              )}
            </div>
            {nextStatus && (
              <button
                className="mt-2 text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-colors"
                onClick={(e) => { e.stopPropagation(); onMove(t.id, nextStatus); }}
              >
                Move to {nextStatus} <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Team() {
  const tasks = useRows("team_tasks");
  const profiles = useProfiles();
  const save = useSave("team_tasks");

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Task | null>(null);
  const [view, setView] = useState<"kanban" | "list">("kanban");

  const taskList = tasks.data ?? [];
  const done = taskList.filter((t) => t.status === "Done").length;
  const overdue = taskList.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "Done").length;

  const getName = (id: string | null) => profiles.data?.find((p) => p.id === id)?.display_name ?? "Unassigned";

  const handleMove = (id: string, status: string) => save.mutate({ id, values: { status } });

  const columnColors: Record<string, string> = {
    "Backlog": "text-muted-foreground",
    "To Do": "text-primary",
    "In Progress": "text-warning",
    "Review": "text-offense",
    "Done": "text-defense",
  };

  return (
    <>
      <PageHeader
        title="Team workspace"
        subtitle="Kanban board for team tasks. Link tasks to findings and track progress from backlog to done."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setView(view === "kanban" ? "list" : "kanban")}>
              {view === "kanban" ? "List view" : "Kanban view"}
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" />New task</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>Create task</DialogTitle></DialogHeader>
                <TaskForm onDone={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Total tasks" value={taskList.length} />
        <Stat label="Done" value={done} tone="ok" />
        <Stat label="Overdue" value={overdue} tone={overdue > 0 ? "danger" : "ok"} />
        <Stat label="Team members" value={(profiles.data ?? []).length} />
      </div>

      {/* Edit dialog */}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Edit task</DialogTitle></DialogHeader>
          {edit && <TaskForm task={edit} onDone={() => setEdit(null)} />}
        </DialogContent>
      </Dialog>

      {taskList.length === 0 ? (
        <Empty title="No tasks yet">Create your first task above.</Empty>
      ) : view === "kanban" ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 overflow-x-auto">
          {TASK_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              title={status}
              tasks={taskList.filter((t) => t.status === status)}
              onEdit={setEdit}
              onMove={handleMove}
              statusColor={columnColors[status] ?? ""}
            />
          ))}
        </div>
      ) : (
        <Panel>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left py-2 pr-4 font-medium">Title</th>
                <th className="text-left py-2 pr-4 font-medium">Status</th>
                <th className="text-left py-2 pr-4 font-medium">Priority</th>
                <th className="text-left py-2 pr-4 font-medium">Assignee</th>
                <th className="text-left py-2 font-medium">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {taskList.map((t) => (
                <tr key={t.id} className="hover:bg-accent/40 cursor-pointer" onClick={() => setEdit(t)}>
                  <td className="py-2 pr-4 font-medium">{t.title}</td>
                  <td className="py-2 pr-4">
                    <Chip tone={t.status === "Done" ? "defense" : t.status === "In Progress" ? "warn" : "muted"}>{t.status}</Chip>
                  </td>
                  <td className="py-2 pr-4">
                    <Chip tone={t.priority === "Urgent" || t.priority === "High" ? "offense" : t.priority === "Medium" ? "warn" : "muted"}>{t.priority}</Chip>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">{getName(t.assignee_id)}</td>
                  <td className={`py-2 text-xs ${t.due_date && new Date(t.due_date) < new Date() && t.status !== "Done" ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    {t.due_date ? new Date(t.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {/* Team roster */}
      <div className="mt-6">
        <Panel title="Team members">
          {(profiles.data ?? []).length === 0 ? (
            <Empty title="No profiles">Profiles are created automatically on first sign-in.</Empty>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {(profiles.data ?? []).map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                    {p.display_name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{p.display_name}</div>
                    <div className="text-xs text-muted-foreground">{p.team_focus}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
