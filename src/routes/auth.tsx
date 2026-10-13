import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldCheck, Swords, Lock, Mail, RefreshCw } from "lucide-react";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  resetPassword,
  onFirebaseAuthChange,
  getCurrentUser,
} from "@/integrations/firebase/client";
import { bridgeGoogle, bridgeEmail } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo, Field } from "@/components/cg/kit";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — CYBERGUARD X" },
      { name: "description", content: "Sign in to the CYBERGUARD X team security lab." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "reset";

function friendlyFirebaseError(code: string, fallback: string): string {
  const m: Record<string, string> = {
    "auth/user-not-found":       "No account with that email.",
    "auth/wrong-password":       "Wrong password.",
    "auth/invalid-credential":   "Wrong email or password.",
    "auth/invalid-email":        "Enter a valid email address.",
    "auth/email-already-in-use": "That email already has an account. Sign in instead.",
    "auth/weak-password":        "Password must be at least 6 characters.",
    "auth/too-many-requests":    "Too many attempts — wait a moment.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/popup-closed-by-user": "Popup was closed. Try again.",
    "auth/popup-blocked":        "Your browser blocked the popup. Allow popups and retry.",
    "auth/cancelled-popup-request": "",
    "auth/user-disabled":        "This account has been disabled.",
  };
  return m[code] ?? fallback;
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode]           = useState<Mode>("signin");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [busy, setBusy]           = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [verifyPending, setVerifyPending] = useState(false);

  // Redirect if Firebase already has a session
  useEffect(() => {
    if (getCurrentUser()) { navigate({ to: "/dashboard", replace: true }); return; }
    return onFirebaseAuthChange((u) => { if (u) navigate({ to: "/dashboard", replace: true }); });
  }, [navigate]);

  // ── Google ──────────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleBusy(true);
    try {
      console.log('[Auth] Starting Google sign-in');
      const { user, idToken } = await signInWithGoogle();
      console.log('[Auth] Google sign-in successful for', user.email);
      
      // Bridge to Supabase for RLS
      try {
        if (idToken) {
          console.log('[Auth] Bridging with Google ID token');
          await bridgeGoogle(idToken);
        } else if (user.email) {
          console.log('[Auth] Bridging with email (no ID token)');
          await bridgeEmail(user.email, user.uid);
        }
        console.log('[Auth] Supabase bridge successful');
        toast.success("Signed in with Google!");
      } catch (bridgeErr) {
        console.warn('[Auth] Supabase bridge failed:', bridgeErr);
        toast.warning("Signed in, syncing database...");
        // Still allow navigation - route guard will retry
      }
      
      // onFirebaseAuthChange will navigate
    } catch (err: any) {
      console.error('[Auth] Google sign-in error:', err);
      const msg = friendlyFirebaseError(err.code ?? "", err.message ?? "Google sign-in failed.");
      if (msg) toast.error(msg);
    } finally {
      setGoogleBusy(false);
    }
  };

  // ── Email / password / reset ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    if (mode === "reset") {
      try {
        await resetPassword(email);
        setResetSent(true);
      } catch (err: any) {
        toast.error(friendlyFirebaseError(err.code ?? "", err.message ?? "Reset failed."));
      }
      setBusy(false);
      return;
    }

    if (mode === "signup") {
      try {
        console.log('[Auth] Starting signup for', email);
        const user = await signUpWithEmail(email, password);
        console.log('[Auth] Firebase signup successful, bridging to Supabase');
        
        // Bridge Supabase (may need email confirm first, but we try)
        try {
          await bridgeEmail(email, password);
          console.log('[Auth] Supabase bridge successful');
        } catch (bridgeErr) {
          console.warn('[Auth] Supabase bridge failed:', bridgeErr);
          // Don't fail the whole signup if bridge fails - user can retry login
        }
        
        setBusy(false);
        if (!user.emailVerified) {
          setVerifyPending(true);
        } else {
          toast.success("Account created! Redirecting...");
        }
      } catch (err: any) {
        setBusy(false);
        console.error('[Auth] Signup error:', err);
        toast.error(friendlyFirebaseError(err.code ?? "", err.message ?? "Sign-up failed."));
      }
      return;
    }

    // sign in
    try {
      console.log('[Auth] Starting signin for', email);
      await signInWithEmail(email, password);
      console.log('[Auth] Firebase signin successful, bridging to Supabase');
      
      try {
        await bridgeEmail(email, password);
        console.log('[Auth] Supabase bridge successful');
        toast.success("Signed in successfully!");
      } catch (bridgeErr) {
        console.warn('[Auth] Supabase bridge failed:', bridgeErr);
        toast.warning("Signed in to Firebase, syncing database...");
        // Still allow navigation - the route guard will retry the bridge
      }
      
      // onFirebaseAuthChange will navigate
    } catch (err: any) {
      setBusy(false);
      const code = err.code ?? "";
      console.error('[Auth] Signin error:', code, err.message);
      
      if (code === "auth/email-not-verified") {
        setVerifyPending(true);
      } else {
        toast.error(friendlyFirebaseError(code, err.message ?? "Sign-in failed."));
      }
    }
  };

  const label = { signin: "Sign in", signup: "Create account", reset: "Send reset link" }[mode];

  return (
    <div className="grid-bg flex min-h-screen items-center justify-center p-4">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-offense/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-defense/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="rounded-2xl border bg-card/95 p-8 shadow-glow backdrop-blur-sm">

          {/* Brand header */}
          <div className="mb-6 flex items-center gap-2.5">
            <Logo className="h-8 w-8" />
            <div>
              <div className="font-semibold tracking-tight">CYBERGUARD <span className="text-primary">X</span></div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Security Lab</div>
            </div>
          </div>

          <h1 className="text-xl font-semibold">
            {mode === "signin" && "Sign in to the lab"}
            {mode === "signup" && "Create analyst account"}
            {mode === "reset" && "Reset your password"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" && "First registered account becomes lab administrator."}
            {mode === "signup" && "Use a real email — verification required. First account gets admin."}
            {mode === "reset" && "Enter your email and we'll send a reset link."}
          </p>

          {/* ── States ── */}

          {verifyPending ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm text-center">
                <Mail className="h-6 w-6 mx-auto mb-2 text-primary" />
                <div className="font-medium mb-1">Verify your email</div>
                <div className="text-muted-foreground text-xs">
                  A verification link was sent to <strong className="text-foreground">{email}</strong>.
                  Click it, then sign in.
                </div>
              </div>
              <button className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { setVerifyPending(false); setMode("signin"); }}>
                ← Back to sign in
              </button>
            </div>

          ) : resetSent ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border border-defense/40 bg-defense/10 p-4 text-sm text-center">
                <ShieldCheck className="h-5 w-5 mx-auto mb-2 text-defense" />
                <div className="font-medium mb-1">Reset link sent</div>
                <div className="text-muted-foreground text-xs">
                  Check your inbox at <strong className="text-foreground">{email}</strong>.
                </div>
              </div>
              <button className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => { setResetSent(false); setMode("signin"); }}>
                ← Back to sign in
              </button>
            </div>

          ) : (
            <div className="mt-6 space-y-3">

              {/* Google button */}
              {mode !== "reset" && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={googleBusy}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {googleBusy ? "Signing in…" : "Continue with Google"}
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 border-t border-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 border-t border-border" />
                  </div>
                </>
              )}

              {/* Email / password form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Email">
                  <Input type="email" required autoComplete="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} placeholder="analyst@yourmail.com" />
                </Field>

                {mode !== "reset" && (
                  <Field label="Password">
                    <div className="relative">
                      <Input
                        type={showPw ? "text" : "password"} required minLength={6}
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••" className="pr-10"
                      />
                      <button type="button" tabIndex={-1} onClick={() => setShowPw(!showPw)}
                        aria-label={showPw ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                )}

                {mode === "signin" && (
                  <div className="flex justify-end -mt-1">
                    <button type="button" onClick={() => setMode("reset")}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      Please wait…
                    </span>
                  ) : label}
                </Button>
              </form>
            </div>
          )}

          {/* Mode switcher */}
          {!verifyPending && !resetSent && (
            <div className="mt-4 text-center text-sm">
              {mode === "signin" && (
                <button onClick={() => setMode("signup")} className="text-muted-foreground hover:text-foreground transition-colors">
                  No account? <span className="text-primary font-medium">Sign up</span>
                </button>
              )}
              {mode === "signup" && (
                <button onClick={() => setMode("signin")} className="text-muted-foreground hover:text-foreground transition-colors">
                  Have an account? <span className="text-primary font-medium">Sign in</span>
                </button>
              )}
              {mode === "reset" && (
                <button onClick={() => setMode("signin")} className="text-muted-foreground hover:text-foreground transition-colors">
                  ← Back to sign in
                </button>
              )}
            </div>
          )}
        </div>

        {/* Feature pills */}
        <div className="mt-6 flex justify-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1.5 text-xs backdrop-blur">
            <Swords className="h-3 w-3 text-offense" /><span className="text-muted-foreground">Red Team</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1.5 text-xs backdrop-blur">
            <ShieldCheck className="h-3 w-3 text-defense" /><span className="text-muted-foreground">Blue Team</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1.5 text-xs backdrop-blur">
            <Lock className="h-3 w-3 text-primary" /><span className="text-muted-foreground">Evidence & Reports</span>
          </div>
        </div>
      </div>
    </div>
  );
}
