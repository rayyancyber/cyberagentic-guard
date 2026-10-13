import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getFirebaseAuth } from "@/integrations/firebase/client";
import { AppShell } from "@/components/cg/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Wait for Firebase to restore the persisted session before deciding
    // whether the user is logged in. getCurrentUser() can return null briefly
    // at startup while Firebase reads from localStorage.
    const auth = getFirebaseAuth();

    // If already resolved, use it immediately
    if (auth.currentUser) return;

    // Otherwise wait up to 3 seconds for Firebase to initialise
    await new Promise<void>((resolve) => {
      const unsub = auth.onAuthStateChanged((user) => {
        unsub();
        resolve();
      });
      // Safety timeout — if Firebase doesn't respond, treat as logged out
      setTimeout(resolve, 3000);
    });

    if (!auth.currentUser) throw redirect({ to: "/auth" });
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
