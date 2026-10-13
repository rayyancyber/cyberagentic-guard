import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getFirebaseAuth, getIdToken } from "@/integrations/firebase/client";
import { bridgeEmail, bridgeGoogle, supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/cg/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const auth = getFirebaseAuth();

    // Firebase persists the session in IndexedDB — wait for it to restore
    if (!auth.currentUser) {
      console.log('[Route Guard] Waiting for Firebase session...');
      await new Promise<void>((resolve) => {
        const unsub = auth.onAuthStateChanged(() => { unsub(); resolve(); });
        setTimeout(resolve, 3000); // safety timeout
      });
    }

    if (!auth.currentUser) {
      console.log('[Route Guard] No Firebase user, redirecting to /auth');
      throw redirect({ to: "/auth" });
    }

    console.log('[Route Guard] Firebase user:', auth.currentUser.email);

    // ✅ FIX: Ensure Supabase session is synced with Firebase
    try {
      const { data: supaSession } = await supabase.auth.getSession();
      
      // If no Supabase session or it doesn't match Firebase user, bridge again
      if (!supaSession.session || supaSession.session.user.email !== auth.currentUser.email) {
        console.log('[Route Guard] Re-syncing Firebase → Supabase session...');
        
        // Try to get Google ID token if available
        const idToken = await getIdToken(true).catch(() => null); // force refresh
        
        if (auth.currentUser.providerData[0]?.providerId === "google.com" && idToken) {
          // Google user - use ID token
          console.log('[Route Guard] Using Google ID token bridge');
          await bridgeGoogle(idToken).catch(err => {
            console.warn('[Route Guard] Google bridge failed, trying email bridge:', err);
            // Fallback to email bridge with UID as password
            return bridgeEmail(auth.currentUser!.email!, auth.currentUser!.uid);
          });
        } else if (auth.currentUser.email) {
          // Email user - use UID as password (Firebase and Supabase stay in sync)
          console.log('[Route Guard] Using email bridge');
          await bridgeEmail(auth.currentUser.email, auth.currentUser.uid).catch(err => {
            console.error('[Route Guard] Email bridge failed:', err);
          });
        }
        
        // Verify session was created
        const { data: newSession } = await supabase.auth.getSession();
        if (!newSession.session) {
          console.error('[Route Guard] Failed to create Supabase session, but allowing navigation');
          // Don't block navigation - user can try operations and get better error messages
        } else {
          console.log('[Route Guard] Supabase session synced successfully');
        }
      } else {
        console.log('[Route Guard] Supabase session already valid');
      }
    } catch (err) {
      console.error('[Route Guard] Error syncing sessions:', err);
      // Don't block navigation on sync errors - let the app handle it
    }
  },
  component: () => <AppShell><Outlet /></AppShell>,
});
