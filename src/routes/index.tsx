import { createFileRoute, Link } from "@tanstack/react-router";
import { Swords, ShieldCheck, FileText } from "lucide-react";
import { Logo } from "@/components/cg/kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CYBERGUARD X — Offensive & Defensive Security Lab" },
      { name: "description", content: "A team lab for authorized penetration testing, threat detection, incident response, and hardening." },
      { property: "og:title", content: "CYBERGUARD X — Offensive & Defensive Security Lab" },
      { property: "og:description", content: "Red team testing and blue team defense in one shared, database-backed lab." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const items = [
    { icon: Swords, t: "Red Team", d: "Scope-checked assessments against authorized lab targets only. Findings with CVSS, evidence and fixes.", c: "text-offense" },
    { icon: ShieldCheck, t: "Blue Team", d: "Ingest lab events, write detection rules, and triage the alerts they trigger — with the supporting events.", c: "text-defense" },
    { icon: FileText, t: "Evidence & Reports", d: "SHA-256 hashed evidence and reports generated from real records, never mock data.", c: "text-primary" },
  ];
  return (
    <div className="grid-bg min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between p-6">
        <div className="flex items-center gap-2"><Logo /><span className="font-semibold">CYBERGUARD <span className="text-primary">X</span></span></div>
        <Button asChild variant="outline"><Link to="/auth">Sign in</Link></Button>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Offensive & Defensive Security Lab</div>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
          Attack it in the lab. <span className="text-defense">Detect it.</span> Fix it. Prove it.
        </h1>
        <p className="mt-6 max-w-2xl text-muted-foreground">
          One workspace for a four-person security team: authorized targets, findings, detection rules, alerts, incidents and verified remediation.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg"><Link to="/dashboard">Open the lab</Link></Button>
        </div>
        <div className="mt-20 grid gap-4 md:grid-cols-3">
          {items.map(({ icon: I, t, d, c }) => (
            <div key={t} className="rounded-xl border bg-card/80 p-6 backdrop-blur">
              <I className={`h-6 w-6 ${c}`} />
              <div className="mt-4 font-medium">{t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
