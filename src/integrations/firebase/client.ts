// Firebase client — authentication only.
// Supabase is still used for all database operations (RLS, tables, etc).
// Firebase handles sign-in and supplies the user identity.

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type Auth,
  type UserCredential,
} from "firebase/auth";

// ─── Config ─────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyB-dU6gK9VVPMvHE6nwqqwQmi0MUklPBm0",
  authDomain: "cyberguard-6d718.firebaseapp.com",
  projectId: "cyberguard-6d718",
  storageBucket: "cyberguard-6d718.firebasestorage.app",
  messagingSenderId: "796904954594",
  appId: "1:796904954594:web:6e06fafa3e660097491cbb",
  measurementId: "G-HCVPHVCB6L",
};

// ─── Singleton init ──────────────────────────────────────────────────────────

function getFirebaseApp(): FirebaseApp {
  const existing = getApps();
  if (existing.length > 0) return existing[0];
  return initializeApp(firebaseConfig);
}

function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

// ─── Exported helpers ────────────────────────────────────────────────────────

/** Sign in with email + password. Returns Firebase User on success. */
export async function signInWithEmail(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

/** Sign up with email + password. Sends a verification email automatically. */
export async function signUpWithEmail(email: string, password: string): Promise<User> {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // Send email verification
  await sendEmailVerification(cred.user);
  return cred.user;
}

/** Sign in with Google via popup. Returns user + the raw Google ID token. */
export async function signInWithGoogle(): Promise<{ user: User; idToken: string | null }> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  // Request the ID token from the OAuth credential
  provider.addScope('email');
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const idToken = credential?.idToken ?? null;
  return { user: result.user, idToken };
}

/** Send a password reset email. */
export async function resetPassword(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  await sendPasswordResetEmail(auth, email);
}

/** Sign out the current user. */
export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
}

/** Get the currently signed-in Firebase user (null if not signed in). */
export function getCurrentUser(): User | null {
  return getFirebaseAuth().currentUser;
}

/** Subscribe to auth state changes. Returns an unsubscribe function. */
export function onFirebaseAuthChange(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), cb);
}

/** Get the Firebase ID token for the current user (for Supabase or API calls). */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = getCurrentUser();
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}

// Export Firebase auth instance for direct use if needed
export { getFirebaseAuth };
export type { User as FirebaseUser };
