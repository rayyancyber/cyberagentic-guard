import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Panel, Stat, Chip, Field, selectCls } from "@/components/cg/kit";
import { useMe, useRows, useSave, useProfiles } from "@/lib/data";
import { toast } from "sonner";
import {
  signOut as firebaseSignOut,
  getCurrentUser,
  getFirebaseAuth,
} from "@/integrations/firebase/client";
import { signOutAll } from "@/integrations/supabase/client";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — CYBERGUARD X" }] }),
  component: Settings,
});

function ProfileSection() {
  const me = useMe();
  const profiles = useProfiles();
  const save = useSave("profiles");
  const fbUser = getCurrentUser();

  const myProfile = profiles.data?.find((p) => p.id === me.data?.user.id);
  const [displayName, setDisplayName] = useState("");
  const [teamFocus, setTeamFocus] = useState("General");
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
          {fbUser?.photoURL ? (
            <img src={fbUser.photoURL} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            (myProfile?.display_name ?? fbUser?.email ?? "?").slice(0, 1).toUpperCase()
          )}
        </div>
        <div>
          <div className="font-semibold">{myProfile?.display_name ?? fbUser?.displayName ?? "—"}</div>
          <div className="text-sm text-muted-foreground">{fbUser?.email}</div>
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

function AppearanceSection() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  const toggleTheme = (t: "dark" | "light") => {
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    localStorage.setItem("cg-theme", t);
  };

  return (
    <Panel title="Appearance">
      <div className="flex gap-3">
        <button
          onClick={() => toggleTheme("dark")}
          className={`flex-1 rounded-lg border p-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${theme === "dark" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
        >
          <Moon className="h-4 w-4" />Dark (default)
        </button>
        <button
          onClick={() => toggleTheme("light")}
          className={`flex-1 rounded-lg border p-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${theme === "light" ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}`}
        >
          <Sun className="h-4 w-4" />Light
        </button>
      </div>
    </Panel>
  );
}

function SecuritySection() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [loading, setLoading] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      const user = getCurrentUser();
      if (!user || !user.email) throw new Error("Not signed in");
      // Re-authenticate before changing password
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      toast.success("Password updated");
      setCurrentPw("");
      setNewPw("");
    } catch (err: any) {
      const code = err.code ?? "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        toast.error("Current password is incorrect.");
      } else {
        toast.error(err.message ?? "Password change failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel title="Security">
      <form onSubmit={changePassword} className="grid gap-3 sm:grid-cols-2">
        <Field label="Current password">
          <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" />
        </Field>
        <Field label="New password (min 6 chars)">
          <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" />
        </Field>
        <Button type="submit" className="w-fit" disabled={loading || !newPw || !currentPw}>
          {loading ? "Updating…" : "Change password"}
        </Button>
      </form>
    </Panel>
  );
}

function TeamRolesSection() {
  const me = useMe();
  const profiles = useProfiles();
  const roles = useRows("user_roles");
  const saveRole = useSave("user_roles");

  if (!me.data?.isAdmin) return null;

  const getUserRoles = (userId: string) => (roles.data ?? []).filter((r) => r.user_id === userId).map((r) => r.role);

  const addRole = (userId: string, role: "red_team" | "blue_team") => {
    const exists = (roles.data ?? []).find((r) => r.user_id === userId && r.role === role);
    if (!exists) saveRole.mutate({ values: { user_id: userId, role } });
  };

  const removeRole = (id: string) => saveRole.mutate({ id, remove: true });

  return (
    <Panel title="Team roles (admin only)">
      <p className="text-xs text-muted-foreground mb-4">Assign red_team or blue_team roles. The first registered user is always admin.</p>
      <ul className="divide-y">
        {(profiles.data ?? []).map((p) => {
          const userRoles = getUserRoles(p.id);
          const roleRecords = (roles.data ?? []).filter((r) => r.user_id === p.id);
          return (
            <li key={p.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <div className="font-medium text-sm">{p.display_name}</div>
                <div className="flex gap-1 mt-0.5">
                  {roleRecords.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => removeRole(r.id)}
                      className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded border hover:bg-destructive/10 hover:border-destructive/40 transition-colors"
                      title="Click to remove role"
                    >
                      {r.role} ×
                    </button>
                  ))}
                  {userRoles.length === 0 && <span className="text-xs text-muted-foreground">member (no team role)</span>}
                </div>
              </div>
              <div className="flex gap-1.5">
                {!userRoles.includes("red_team") && (
                  <Button size="sm" variant="outline" className="text-offense border-offense/40 hover:bg-offense/10" onClick={() => addRole(p.id, "red_team")}>
                    + Red
                  </Button>
                )}
                {!userRoles.includes("blue_team") && (
                  <Button size="sm" variant="outline" className="text-defense border-defense/40 hover:bg-defense/10" onClick={() => addRole(p.id, "blue_team")}>
                    + Blue
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

function DatabaseSection() {
  const assets = useRows("assets");
  const findings = useRows("findings");
  const events = useRows("security_events");
  const evidence = useRows("evidence");

  return (
    <Panel title="Database overview">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-3">
          <div className="font-mono text-xl font-semibold">{(assets.data ?? []).length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Assets</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="font-mono text-xl font-semibold">{(findings.data ?? []).length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Findings</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="font-mono text-xl font-semibold">{(events.data ?? []).length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Security events</div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="font-mono text-xl font-semibold">{(evidence.data ?? []).length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Evidence files</div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Powered by Supabase · PostgreSQL with Row Level Security. All team members can read and write their own data; only admins can delete records.
      </p>
    </Panel>
  );
}

function Settings() {
  const me = useMe();
  const fbUser = getCurrentUser();

  const handleSignOut = async () => {
    await signOutAll();
    await firebaseSignOut();
  };

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your profile, appearance, and team configuration."
        actions={
          <Button variant="outline" size="sm" onClick={handleSignOut} className="text-destructive border-destructive/40 hover:bg-destructive/10">
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
