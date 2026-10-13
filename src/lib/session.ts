// Session management utilities for Firebase ↔ Supabase synchronization
import { supabase, bridgeGoogle, bridgeEmail } from "@/integrations/supabase/client";
import { getCurrentUser, getIdToken } from "@/integrations/firebase/client";
import type { Session } from "@supabase/supabase-js";

/**
 * Ensures a valid Supabase session exists, syncing with Firebase if needed.
 * Returns the session or null if unable to establish one.
 */
export async function ensureSupabaseSession(): Promise<Session | null> {
  console.log("🔄 [Session] Checking Supabase session...");
  
  // 1. Check if Supabase already has a valid session
  const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error("❌ [Session] Error getting session:", sessionError);
  }
  
  if (existingSession) {
    console.log("✅ [Session] Found existing Supabase session, expires:", new Date(existingSession.expires_at! * 1000).toLocaleString());
    
    // Check if session is about to expire (within 5 minutes)
    const expiresAt = existingSession.expires_at! * 1000;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (expiresAt - now < fiveMinutes) {
      console.log("⚠️ [Session] Session expiring soon, refreshing...");
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error("❌ [Session] Failed to refresh:", refreshError);
      } else if (refreshedSession) {
        console.log("✅ [Session] Session refreshed successfully");
        return refreshedSession;
      }
    }
    
    return existingSession;
  }
  
  console.log("⚠️ [Session] No Supabase session found, checking Firebase...");
  
  // 2. Check if Firebase has a user
  const firebaseUser = getCurrentUser();
  if (!firebaseUser) {
    console.log("❌ [Session] No Firebase user found");
    return null;
  }
  
  console.log("✅ [Session] Firebase user found:", firebaseUser.email);
  
  // 3. Try to sync Firebase → Supabase
  try {
    const idToken = await getIdToken(true); // Force refresh
    if (!idToken) {
      console.error("❌ [Session] Could not get Firebase ID token");
      return null;
    }
    
    console.log("🔄 [Session] Syncing Firebase → Supabase...");
    
    // Determine which provider was used
    const providerData = firebaseUser.providerData[0];
    if (providerData?.providerId === "google.com") {
      console.log("🔄 [Session] Using Google auth bridge...");
      const session = await bridgeGoogle(idToken);
      if (session) {
        console.log("✅ [Session] Google bridge successful");
        return session;
      }
    } else {
      // Email/password auth
      console.log("🔄 [Session] Using email/password bridge...");
      const email = firebaseUser.email;
      if (!email) {
        console.error("❌ [Session] Firebase user has no email");
        return null;
      }
      
      // For email/password, we need to use the ID token as a password proxy
      // This assumes the user's password is the same in both systems
      // In production, you'd want a more robust approach
      const session = await bridgeEmail(email, idToken);
      if (session) {
        console.log("✅ [Session] Email bridge successful");
        return session;
      }
    }
    
    console.error("❌ [Session] All bridge attempts failed");
    return null;
    
  } catch (error) {
    console.error("❌ [Session] Error during Firebase→Supabase sync:", error);
    return null;
  }
}

/**
 * Validates that a session has the required user_id.
 * Returns user_id or null if invalid.
 */
export function validateSession(session: Session | null): string | null {
  if (!session?.user?.id) {
    console.error("❌ [Session] Invalid session: missing user.id");
    return null;
  }
  return session.user.id;
}

/**
 * Gets the current user ID from Supabase session, ensuring session is valid.
 * Returns user_id or null.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await ensureSupabaseSession();
  return validateSession(session);
}

/**
 * Checks if user is authenticated (has both Firebase and Supabase sessions).
 */
export async function isAuthenticated(): Promise<boolean> {
  const firebaseUser = getCurrentUser();
  if (!firebaseUser) return false;
  
  const userId = await getCurrentUserId();
  return !!userId;
}
