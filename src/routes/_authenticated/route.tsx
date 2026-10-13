import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getFirebaseAuth } from "@/integrations/firebase/client";
import { ensureSupabaseSession } from "@/lib/session";
import { AppShell } from "@/components/cg/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const auth = getFirebaseAuth();

    console.log('[Route Guard] 🔒 Checking authentication...');

    // Firebase persists the session in IndexedDB — wait for it to restore
    if (!auth.currentUser) {
      console.log('[Route Guard] ⏳ Waiting for Firebase session...');
      await new Promise<void>((resolve) => {
        const unsub = auth.onAuthStateChanged(() => { unsub(); resolve(); });
        setTimeout(resolve, 3000); // safety timeout
      });
    }

    if (!auth.currentUser) {
      console.log('[Route Guard] ❌ No Firebase user, redirecting to /auth');
      throw redirect({ to: "/auth" });
    }

    console.log('[Route Guard] ✅ Firebase user authenticated:', auth.currentUser.email);

    // Ensure Supabase session is valid and synced with Firebase
    console.log('[Route Guard] 🔄 Ensuring Supabase session...');
    const session = await ensureSupabaseSession();
    
    if (!session) {
      console.error('[Route Guard] ⚠️ Could not establish Supabase session, but allowing navigation');
      // Don't block navigation - let the app operations handle auth errors with better messages
    } else {
      console.log('[Route Guard] ✅ Supabase session valid, user:', session.user.email);
    }
  },
  component: () => <AppShell><Outlet /></AppShell>,
});
