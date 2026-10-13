import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getFirebaseAuth } from "@/integrations/firebase/client";
import { AppShell } from "@/components/cg/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const auth = getFirebaseAuth();

    // Firebase persists the session in IndexedDB — wait for it to restore
    if (!auth.currentUser) {
      await new Promise<void>((resolve) => {
        const unsub = auth.onAuthStateChanged(() => { unsub(); resolve(); });
        setTimeout(resolve, 3000); // safety timeout
      });
    }

    if (!auth.currentUser) throw redirect({ to: "/auth" });
  },
  component: () => <AppShell><Outlet /></AppShell>,
});
