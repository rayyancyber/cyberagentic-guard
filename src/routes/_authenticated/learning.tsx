import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader, Panel, Stat, Chip, Empty } from "@/components/cg/kit";
import { useRows, useSave, useMe } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/learning")({
  head: () => ({ meta: [{ title: "Learning Center — CYBERGUARD X" }] }),
  component: Learning,
});

type Module = {
  id: string;
  title: string;
  description: string;
  track: "Red Team" | "Blue Team" | "General";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  lessons: Lesson[];
};

type Lesson = {
  id: string;
  title: string;
  content: string;
  resources: { label: string; url: string }[];
};

const MODULES: Module[] = [
  {
    id: "owasp-top10",
    title: "OWASP Top 10",
    description: "Learn the ten most critical web application security risks and how to exploit and defend against each.",
    track: "General",
    difficulty: "Beginner",
    lessons: [
      {
        id: "a01-access-control",
        title: "A01 · Broken Access Control",
        content: "Broken access control allows attackers to access unauthorized resources. Common vectors include IDOR, path traversal, and privilege escalation. Always enforce server-side authorization checks; never rely on client-side controls.",
        resources: [{ label: "OWASP A01", url: "https://owasp.org/Top10/A01_2021-Broken_Access_Control/" }],
      },
      {
        id: "a02-cryptographic",
        title: "A02 · Cryptographic Failures",
        content: "Weak or absent cryptography exposes sensitive data. Use TLS 1.2+, AES-256 at rest, bcrypt for passwords, and never roll your own crypto. Check for HTTP endpoints, weak cipher suites, and hard-coded keys.",
        resources: [{ label: "OWASP A02", url: "https://owasp.org/Top10/A02_2021-Cryptographic_Failures/" }],
      },
      {
        id: "a03-injection",
        title: "A03 · Injection",
        content: "SQL injection, command injection, and LDAP injection occur when untrusted data is sent to an interpreter. Use parameterized queries, ORM frameworks, and input validation. DVWA is great for practicing SQL injection in a safe lab.",
        resources: [{ label: "OWASP A03", url: "https://owasp.org/Top10/A03_2021-Injection/" }, { label: "PortSwigger SQLi labs", url: "https://portswigger.net/web-security/sql-injection" }],
      },
      {
        id: "a04-insecure-design",
        title: "A04 · Insecure Design",
        content: "Security must be built in, not bolted on. Threat modeling during design, security user stories, and abuse-case analysis help catch vulnerabilities before code is written.",
        resources: [{ label: "OWASP A04", url: "https://owasp.org/Top10/A04_2021-Insecure_Design/" }],
      },
      {
        id: "a07-xss",
        title: "A03 / A07 · Cross-Site Scripting",
        content: "Reflected, Stored, and DOM-based XSS let attackers inject scripts into pages viewed by other users. Escape output, use Content Security Policy headers, and validate input server-side.",
        resources: [{ label: "PortSwigger XSS", url: "https://portswigger.net/web-security/cross-site-scripting" }],
      },
    ],
  },
  {
    id: "pentest-methodology",
    title: "Penetration testing methodology",
    description: "Structured approach to offensive security: reconnaissance, scanning, exploitation, and reporting.",
    track: "Red Team",
    difficulty: "Intermediate",
    lessons: [
      {
        id: "recon",
        title: "Reconnaissance",
        content: "Passive recon includes OSINT, WHOIS, DNS enumeration, and Shodan. Active recon includes Nmap port scanning, service fingerprinting, and web crawler analysis. Always stay within authorized scope.",
        resources: [{ label: "Nmap reference", url: "https://nmap.org/book/man.html" }],
      },
      {
        id: "scanning",
        title: "Scanning & enumeration",
        content: "After identifying open ports, enumerate services: HTTP (Nikto, Gobuster), SMB (enum4linux), SSH version, and SSL certs. Correlate results with CVE databases like NVD or ExploitDB.",
        resources: [{ label: "Gobuster", url: "https://github.com/OJ/gobuster" }],
      },
      {
        id: "exploitation",
        title: "Exploitation",
        content: "Use Metasploit, custom scripts, or manual techniques to exploit confirmed vulnerabilities. Always document each exploit: CVE, steps, payload, and impact. Never exceed authorized scope.",
        resources: [{ label: "Metasploit docs", url: "https://docs.metasploit.com/" }],
      },
      {
        id: "reporting",
        title: "Writing a pentest report",
        content: "A good report includes an executive summary, findings sorted by severity, steps to reproduce, business impact, and prioritized remediation advice. Use CVSS scoring. Screenshots and proof-of-concept code add credibility.",
        resources: [],
      },
    ],
  },
  {
    id: "blue-team-fundamentals",
    title: "Blue team fundamentals",
    description: "Detection engineering, threat hunting, incident response, and SIEM rule writing.",
    track: "Blue Team",
    difficulty: "Intermediate",
    lessons: [
      {
        id: "detection-engineering",
        title: "Detection engineering",
        content: "Detection rules convert threat intelligence into actionable alerts. Use the MITRE ATT&CK framework to map detections to TTPs. Tune rules iteratively: reduce false positives without missing true positives. This platform's Blue Team page lets you write and test rules live.",
        resources: [{ label: "MITRE ATT&CK", url: "https://attack.mitre.org/" }],
      },
      {
        id: "log-analysis",
        title: "Log analysis",
        content: "Logs are the primary evidence source in incident response. Focus on authentication logs (auth.log), web access logs (access.log), and system events (syslog). Look for anomalies: off-hours logins, unusual process names, lateral movement patterns.",
        resources: [],
      },
      {
        id: "ir-process",
        title: "Incident response process",
        content: "NIST SP 800-61 defines 4 phases: Preparation, Detection & Analysis, Containment/Eradication/Recovery, and Post-Incident Activity. Document every action with timestamps. Preserve evidence with chain of custody.",
        resources: [{ label: "NIST SP 800-61r2", url: "https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-61r2.pdf" }],
      },
      {
        id: "threat-hunting",
        title: "Threat hunting",
        content: "Threat hunting is a proactive search for adversaries already in your environment. Start with a hypothesis based on threat intel, use data to validate or invalidate it, and document findings. Common hunts: unusual outbound connections, new services, unexpected scripting engine usage.",
        resources: [],
      },
    ],
  },
  {
    id: "secure-coding",
    title: "Secure coding practices",
    description: "Defensive programming techniques to prevent common vulnerability classes.",
    track: "General",
    difficulty: "Beginner",
    lessons: [
      {
        id: "input-validation",
        title: "Input validation & sanitization",
        content: "Validate all input server-side: type, length, format, and range. Whitelist allowed characters rather than blacklisting bad ones. Sanitize for the context: SQL (parameterized queries), HTML (escape), shell (avoid exec with user input entirely).",
        resources: [],
      },
      {
        id: "auth-authz",
        title: "Authentication & authorization",
        content: "Use proven auth libraries. Enforce MFA for privileged accounts. Check authorization on every request server-side. Implement RBAC with least-privilege principles. Rotate secrets regularly and use a secrets manager, never hard-code credentials.",
        resources: [],
      },
      {
        id: "secrets-mgmt",
        title: "Secrets management",
        content: "Never commit secrets to source control. Use environment variables or a secrets manager (Vault, AWS Secrets Manager, Doppler). Scan repos for leaked secrets using tools like truffleHog or GitHub Secret Scanning. Rotate leaked secrets immediately.",
        resources: [{ label: "truffleHog", url: "https://github.com/trufflesecurity/trufflehog" }],
      },
    ],
  },
];

const trackColor: Record<string, string> = {
  "Red Team": "offense",
  "Blue Team": "defense",
  "General": "muted",
};

function LessonItem({ lesson, completed, onToggle }: { lesson: Lesson; completed: boolean; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`rounded-lg border transition-colors ${completed ? "border-defense/30 bg-defense/5" : "bg-card"}`}>
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <button
          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${completed ? "border-defense bg-defense" : "border-muted-foreground"}`}
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
        >
          {completed && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-2.5 w-2.5 text-white">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </button>
        <span className={`flex-1 text-sm font-medium ${completed ? "line-through text-muted-foreground" : ""}`}>{lesson.title}</span>
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-0 ml-8 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">{lesson.content}</p>
          {lesson.resources.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {lesson.resources.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />{r.label}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Learning() {
  const me = useMe();
  const progress = useRows("progress");
  const save = useSave("progress");

  const userId = me.data?.user.id;
  const myProgress = (progress.data ?? []).filter((p) => p.user_id === userId && p.kind === "lesson");

  const isCompleted = (lessonId: string) => myProgress.some((p) => p.item_key === lessonId && p.completed);

  const toggleLesson = (lessonId: string) => {
    const existing = myProgress.find((p) => p.item_key === lessonId);
    const nowCompleted = !isCompleted(lessonId);
    if (!userId) return;
    if (existing) {
      save.mutate({ id: existing.id, values: { completed: nowCompleted } });
    } else {
      save.mutate({ values: { user_id: userId, item_key: lessonId, kind: "lesson", completed: true } });
    }
  };

  const totalLessons = MODULES.reduce((s, m) => s + m.lessons.length, 0);
  const completedLessons = MODULES.reduce((s, m) => s + m.lessons.filter((l) => isCompleted(l.id)).length, 0);

  const [trackFilter, setTrackFilter] = useState("All");
  const filteredModules = trackFilter === "All" ? MODULES : MODULES.filter((m) => m.track === trackFilter);

  return (
    <>
      <PageHeader
        title="Learning center"
        subtitle="Security training modules for red and blue team practitioners. Mark lessons complete to track your progress."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Modules" value={MODULES.length} />
        <Stat label="Lessons" value={totalLessons} />
        <Stat label="Completed" value={completedLessons} tone="ok" />
        <Stat label="Progress" value={`${Math.round((completedLessons / totalLessons) * 100)}%`} tone={completedLessons === totalLessons ? "ok" : "warn"} />
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Learning progress</span>
          <span>{completedLessons} / {totalLessons} lessons</span>
        </div>
        <Progress value={(completedLessons / totalLessons) * 100} className="h-2" />
      </div>

      {/* Track filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["All", "Red Team", "Blue Team", "General"].map((t) => (
          <button
            key={t}
            onClick={() => setTrackFilter(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${trackFilter === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Modules */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredModules.map((mod) => {
          const completedInModule = mod.lessons.filter((l) => isCompleted(l.id)).length;
          const pct = Math.round((completedInModule / mod.lessons.length) * 100);
          return (
            <Panel key={mod.id} className="flex flex-col gap-0">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{mod.title}</span>
                    <Chip tone={trackColor[mod.track] as any}>{mod.track}</Chip>
                    <Chip tone={mod.difficulty === "Beginner" ? "defense" : mod.difficulty === "Intermediate" ? "warn" : "offense"}>
                      {mod.difficulty}
                    </Chip>
                  </div>
                  <p className="text-xs text-muted-foreground">{mod.description}</p>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{completedInModule} / {mod.lessons.length} lessons</span>
                  <span>{pct}%</span>
                </div>
                <Progress value={pct} className="h-1.5" />
              </div>
              <div className="space-y-2">
                {mod.lessons.map((lesson) => (
                  <LessonItem
                    key={lesson.id}
                    lesson={lesson}
                    completed={isCompleted(lesson.id)}
                    onToggle={() => toggleLesson(lesson.id)}
                  />
                ))}
              </div>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
