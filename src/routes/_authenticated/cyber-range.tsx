import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trophy, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader, Panel, Stat, Chip, Empty } from "@/components/cg/kit";
import { useRows, useSave, useMe } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/cyber-range")({
  head: () => ({ meta: [{ title: "Cyber Range — CYBERGUARD X" }] }),
  component: CyberRange,
});

// Static lab scenarios catalogue
const LABS = [
  {
    id: "sqli-dvwa",
    title: "SQL Injection on DVWA",
    description: "Extract database contents via classic union-based SQL injection. Works on the seeded DVWA asset.",
    category: "Offensive",
    difficulty: "Beginner",
    points: 100,
    tags: ["SQL", "Web", "DVWA"],
    steps: [
      "Open the DVWA app in your browser",
      "Navigate to SQL Injection page",
      "Submit a single quote to confirm injection",
      "Use UNION SELECT to enumerate tables",
      "Dump the users table",
    ],
  },
  {
    id: "xss-juice",
    title: "Reflected XSS — Juice Shop",
    description: "Find and exploit a reflected cross-site scripting vulnerability in the OWASP Juice Shop search endpoint.",
    category: "Offensive",
    difficulty: "Beginner",
    points: 100,
    tags: ["XSS", "Web", "Juice Shop"],
    steps: [
      "Open Juice Shop and go to the product search",
      "Inject a basic script tag payload",
      "Verify JavaScript execution in the browser console",
      "Craft a cookie-stealing payload",
    ],
  },
  {
    id: "privesc-msfable",
    title: "Privilege escalation — Metasploitable",
    description: "Gain root access on the Metasploitable VM via a misconfigured SUID binary or weak sudo rules.",
    category: "Offensive",
    difficulty: "Intermediate",
    points: 200,
    tags: ["Linux", "PrivEsc", "Metasploitable"],
    steps: [
      "Establish a low-privilege shell on the target",
      "Run LinPEAS for privilege escalation vectors",
      "Identify SUID binaries",
      "Exploit the vector to achieve root",
      "Read the /root/flag.txt file",
    ],
  },
  {
    id: "siem-rules",
    title: "Write SIEM detection rules",
    description: "Create detection rules for brute-force and privilege escalation events, then validate them by injecting synthetic events.",
    category: "Defensive",
    difficulty: "Beginner",
    points: 150,
    tags: ["SIEM", "Detection", "Blue Team"],
    steps: [
      "Go to Blue Team → Create a rule for login_failure equals brute_force",
      "Set threshold 5 in a 2-minute window",
      "Inject 6 synthetic login_failure events",
      "Verify an alert is automatically created",
      "Triage the alert in the Incidents view",
    ],
  },
  {
    id: "incident-response",
    title: "Incident response simulation",
    description: "A simulated data exfiltration alert fires. Investigate, contain, and document the incident end-to-end.",
    category: "Defensive",
    difficulty: "Intermediate",
    points: 250,
    tags: ["IR", "Blue Team", "Documentation"],
    steps: [
      "Inject a data_exfiltration event from Blue Team",
      "Observe the auto-created alert in Incidents",
      "Change status to Investigating",
      "Create an Incident linked to the alert",
      "Document root cause and lessons learned",
      "Close the incident",
    ],
  },
  {
    id: "burp-intercept",
    title: "Burp Suite intercept & replay",
    description: "Configure Burp as a proxy, intercept authentication requests, and fuzz for parameter tampering vulnerabilities.",
    category: "Offensive",
    difficulty: "Intermediate",
    points: 200,
    tags: ["Burp Suite", "Web", "Proxy"],
    steps: [
      "Configure your browser to use Burp as proxy",
      "Intercept a login request on DVWA",
      "Modify the session cookie",
      "Send to Intruder and fuzz user parameter",
      "Document a finding from the results",
    ],
  },
];

const difficultyColor: Record<string, string> = {
  Beginner: "defense",
  Intermediate: "warn",
  Advanced: "offense",
};

function CyberRange() {
  const me = useMe();
  const progress = useRows("progress");
  const save = useSave("progress");
  const [expandedLab, setExpandedLab] = useState<string | null>(null);

  const userId = me.data?.user.id;
  const myProgress = progress.data?.filter((p) => p.user_id === userId) ?? [];

  const getProgress = (labId: string) => myProgress.find((p) => p.item_key === labId && p.kind === "lab");
  const isCompleted = (labId: string) => getProgress(labId)?.completed ?? false;

  const completedCount = LABS.filter((l) => isCompleted(l.id)).length;
  const totalPoints = LABS.filter((l) => isCompleted(l.id)).reduce((s, l) => s + l.points, 0);
  const availablePoints = LABS.reduce((s, l) => s + l.points, 0);

  const markComplete = (labId: string) => {
    const existing = getProgress(labId);
    if (!userId) return;
    if (existing) {
      save.mutate({ id: existing.id, values: { completed: true, score: LABS.find((l) => l.id === labId)?.points } });
    } else {
      save.mutate({ values: { user_id: userId, item_key: labId, kind: "lab", completed: true, score: LABS.find((l) => l.id === labId)?.points ?? 0 } });
    }
  };

  const resetLab = (labId: string) => {
    const existing = getProgress(labId);
    if (existing) save.mutate({ id: existing.id, values: { completed: false, score: 0 } });
  };

  const categories = ["Offensive", "Defensive"];

  return (
    <>
      <PageHeader
        title="Cyber Range"
        subtitle="Hands-on labs against the seeded assets. Follow the steps, mark as complete, and build your posture score."
        actions={
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" />
            <span className="font-mono text-sm font-semibold">{totalPoints} / {availablePoints} pts</span>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Labs available" value={LABS.length} />
        <Stat label="Completed" value={completedCount} tone="ok" />
        <Stat label="Points earned" value={totalPoints} tone="ok" hint={`of ${availablePoints}`} />
        <Stat label="Completion" value={`${Math.round((completedCount / LABS.length) * 100)}%`} tone={completedCount === LABS.length ? "ok" : "warn"} />
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Overall progress</span>
          <span>{completedCount} of {LABS.length} labs</span>
        </div>
        <Progress value={(completedCount / LABS.length) * 100} className="h-2" />
      </div>

      {categories.map((cat) => (
        <div key={cat} className="mb-6">
          <div className={`font-mono text-xs uppercase tracking-widest mb-3 ${cat === "Offensive" ? "text-offense" : "text-defense"}`}>
            {cat === "Offensive" ? "Red Team · Offensive" : "Blue Team · Defensive"}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {LABS.filter((l) => l.category === cat).map((lab) => {
              const completed = isCompleted(lab.id);
              const expanded = expandedLab === lab.id;
              return (
                <div
                  key={lab.id}
                  className={`rounded-xl border bg-card transition-all ${completed ? "border-defense/40 bg-defense/5" : "hover:border-primary/40"}`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {completed ? (
                            <div className="h-5 w-5 rounded-full bg-defense flex items-center justify-center shrink-0">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3 w-3 text-white">
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            </div>
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground shrink-0" />
                          )}
                          <span className="font-medium text-sm leading-tight">{lab.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{lab.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-mono text-xs font-semibold text-warning">{lab.points}pts</span>
                        <Chip tone={difficultyColor[lab.difficulty] as any}>{lab.difficulty}</Chip>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {lab.tags.map((t) => <Chip key={t} tone="muted">{t}</Chip>)}
                    </div>
                  </div>

                  <div className="border-t px-4 pb-4 pt-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 gap-1.5"
                        onClick={() => setExpandedLab(expanded ? null : lab.id)}
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        {expanded ? "Hide steps" : "Show steps"}
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
                      </Button>
                      {completed ? (
                        <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => resetLab(lab.id)}>Reset</Button>
                      ) : (
                        <Button size="sm" variant="default" onClick={() => markComplete(lab.id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3.5 w-3.5 mr-1">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          Mark done
                        </Button>
                      )}
                    </div>

                    {expanded && (
                      <div className="mt-3 rounded-lg bg-muted/50 p-3">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Steps</div>
                        <ol className="space-y-1.5">
                          {lab.steps.map((step, i) => (
                            <li key={i} className="flex gap-2 text-xs">
                              <span className="font-mono text-primary shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
