# CYBERGUARD X — Offensive & Defensive Security Lab

A team security lab platform for authorized red team assessments, blue team detection, incident response, evidence management, and remediation tracking.

## Stack

- **Framework** — TanStack Start (React 19, SSR)
- **Auth** — Firebase Authentication (email/password + Google OAuth)
- **Database** — Supabase (PostgreSQL with RLS)
- **Styling** — Tailwind CSS v4 · shadcn/ui · Sora + JetBrains Mono fonts
- **Charts** — Recharts
- **Build** — Vite 8 · Bun / npm

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

Sign up with your email (verification required) or sign in with Google.
The first account created automatically becomes the lab administrator.

## Environment variables

Copy `.env` and fill in your credentials:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |

Firebase credentials are embedded in `src/integrations/firebase/client.ts`.

## Features

| Module | Description |
|---|---|
| Dashboard | Live posture score, charts, recent findings + alerts |
| Red Team | Scoped assessments against authorized lab assets |
| Blue Team | Detection rule editor + synthetic event injector |
| Cyber Range | Guided labs with step-by-step instructions |
| Assets | Lab machine inventory with CRUD |
| Vulnerabilities | Full lifecycle: discovery → verified fix |
| Monitoring | Live event log with 24h area chart |
| Incidents | Alert triage + incident management (MTTA / MTTR) |
| Reports | Evidence upload (SHA-256) + posture report download |
| Team | Kanban board + team roster |
| Learning Center | Security training modules with progress tracking |
| Settings | Profile, appearance, password, team roles |
