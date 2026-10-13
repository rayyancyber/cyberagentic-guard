import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel, Chip, Field, selectCls } from "@/components/cg/kit";
import { useMe, useRows, useSave, useProfiles } from "@/lib/data";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, signOut as firebaseSignOut } from "@/integrations/firebase/client";
import { supabaseSignOut } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — CYBERGUARD X" }] }),
  component: Settings,
});

// ─── Profile ──────────────────────────────────────────────────────────────────
function ProfileSection() {
  const me       = useMe();
  const profiles = useProfiles();
  const save     = useSave("profiles");
  const fbUser   = getCurrentUser();

  const myProfile = profiles.data?.find((p) => p.id === me.data?.user.id);
  const [displayName, setDisplayName] = useState("");
  const [teamFocus,   setTeamFocus]   = useState("General");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (myProfile && !initialized) {
      setDisplayName(myProfile.display_name ?? fbUser?.displayName ?? "");
      setTeamFocus(myProfile.team_focus ?? "General");
      setInitialized(true);
    }
  }, [myProfile, initialized, fbUser]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!me.data?.user.id) return;
    save.mutate({ id: me.data.user.id, values: { display_name: displayName, team_focus: teamFocus } });
  };

  return (
    <Panel title="Profile">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg overflow-hidden shrink-0">
          {fbUser?.photoURL
            ? <img src={fbUser.photoURL} alt="avatar" className="h-full w-full object-cover" />
            : (myProfile?.display_name ?? fbUser?.email ?? "?").slice(0, 1).toUpperCase()
          }
        </div>
        <div>
          <div className="font-semibold">{myProfile?.display_name ?? fbUser?.displayName ?? "—"}</div>
          <div className="text-sm text-muted-foreground">{fbUser?.email ?? me.data?.user.email}</div>
          <div className="flex gap-1 mt-1">
            {me.data?.roles.map((r) => (
              <Chip key={r} tone={r === "admin" ? "offense" : r === "red_team" ? "offense" : r === "blue_team" ? "defense" : "muted"}>{r}</Chip>
            ))}
          </div>
        </div>
      </div>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Display name">
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </Field>
        <Field label="Team focus">
          <select className={selectCls} value={teamFocus} onChange={(e) => setTeamFocus(e.target.value)}>
            {["Red Team", "Blue Team", "General", "Management"].map((f) => <option key={f}>{f}</option>)}
          </select>
        </Field>
        <Button className="sm:col-span-2 w-fit" disabled={save.isPending}>Save profile</Button>
      </form>
    </Panel>
  );
}

// ─── Appearance ───────────────────────────────────────────────────────────────
function AppearanceSection() {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    typeof window !== "undefined"
      ? (document.documentElement.classList.contains("dark") ? "dark" : "light")
      : "dark"
  );

  const pick = (t: "dark" | "light") => {
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    localStorage.setItem("cg-theme", t);
  };

  return (
    <Panel title="Appearance">
      <div className="flex gap-3">
        {(["dark", "light"] as const).map((t) => (
          <button key={t} onClick={() => pick(t)}
            className={`flex-1 rounded-lg border p-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${theme === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}>
            {t === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {t === "dark" ? "Dark (default)" : "Light"}
          </button>
        ))}
      </div>
    </Panel>
  );
}

// ─── Security / password ─────────────────────────────────────────────────────
function SecuritySection() {
  const [newPw,   setNewPw]   = useState("");
  const [loading, setLoading] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    setNewPw("");
  };

  return (
    <Panel title="Security">
      <form onSubmit={changePassword} className="grid gap-3 sm:grid-cols-2">
        <Field label="New password (min 8 chars)">
          <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" />
        </Field>
        <div className="flex items-end">
          <Button type="submit" className="w-fit" disabled={loading || !newPw}>
            {loading ? "Updating…" : "Change password"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}

// ─── Team roles (admin only) ──────────────────────────────────────────────────
function TeamRolesSection() {
  const me       = useMe();
  const profiles = useProfiles();
  const roles    = useRows("user_roles");
  const saveRole = useSave("user_roles");

  if (!me.data?.isAdmin) return null;

  const getUserRoles = (uid: string) => (roles.data ?? []).filter((r) => r.user_id === uid).map((r) => r.role);

  const addRole = (uid: string, role: "red_team" | "blue_team") => {
    if (!(roles.data ?? []).find((r) => r.user_id === uid && r.role === role))
      saveRole.mutate({ values: { user_id: uid, role } });
  };

  return (
    <Panel title="Team roles (admin only)">
      <p className="text-xs text-muted-foreground mb-4">
        Assign red_team or blue_team roles. First registered user is always admin.
      </p>
      <ul className="divide-y">
        {(profiles.data ?? []).map((p) => {
          const userRoles   = getUserRoles(p.id);
          const roleRecords = (roles.data ?? []).filter((r) => r.user_id === p.id);
          return (
            <li key={p.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <div className="font-medium text-sm">{p.display_name}</div>
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  {roleRecords.map((r) => (
                    <button key={r.id} onClick={() => saveRole.mutate({ id: r.id, remove: true })}
                      className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded border hover:bg-destructive/10 hover:border-destructive/40 transition-colors"
                      title="Click to remove">
                      {r.role} ×
                    </button>
                  ))}
                  {userRoles.length === 0 && <span className="text-xs text-muted-foreground">member</span>}
                </div>
              </div>
              <div className="flex gap-1.5">
                {!userRoles.includes("red_team") && (
                  <Button size="sm" variant="outline" className="text-offense border-offense/40 hover:bg-offense/10" onClick={() => addRole(p.id, "red_team")}>+ Red</Button>
                )}
                {!userRoles.includes("blue_team") && (
                  <Button size="sm" variant="outline" className="text-defense border-defense/40 hover:bg-defense/10" onClick={() => addRole(p.id, "blue_team")}>+ Blue</Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

// ─── DB overview ─────────────────────────────────────────────────────────────
function DatabaseSection() {
  const assets   = useRows("assets");
  const findings = useRows("findings");
  const events   = useRows("security_events");
  const evidence = useRows("evidence");

  const stats = [
    { label: "Assets",          n: (assets.data   ?? []).length },
    { label: "Findings",        n: (findings.data ?? []).length },
    { label: "Security events", n: (events.data   ?? []).length },
    { label: "Evidence files",  n: (evidence.data ?? []).length },
  ];

  return (
    <Panel title="Database overview">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ label, n }) => (
          <div key={label} className="rounded-lg border bg-card p-3">
            <div className="font-mono text-xl font-semibold">{n}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Database: Supabase PostgreSQL · Row Level Security enabled on all tables.
      </p>
    </Panel>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function Settings() {
  const handleSignOut = async () => {
    await supabaseSignOut();
    await firebaseSignOut();
  };

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, appearance, security, and team configuration."
        actions={
          <Button variant="outline" size="sm" onClick={handleSignOut}
            className="text-destructive border-destructive/40 hover:bg-destructive/10">
            Sign out
          </Button>
        }
      />
      <div className="grid gap-6 max-w-3xl">
        <ProfileSection />
        <AppearanceSection />
        <SecuritySection />
        <TeamRolesSection />
        <DatabaseSection />
      </div>
    </>
  );
}
