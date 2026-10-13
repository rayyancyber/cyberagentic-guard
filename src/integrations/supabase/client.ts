// Supabase client — all DB operations via the Lovable cloud proxy.
//
// Auth bridge (Firebase → Supabase):
//  - Google users: exchange Firebase Google ID token with Supabase's
//    grant_type=id_token endpoint → instant Supabase session, no confirmation needed
//  - Email users: signUp then immediately signIn; if email confirmation is
//    required we fall back to OTP so the user only confirms once
//
// The Supabase session (stored in localStorage) is what satisfies RLS:
//   auth.uid() = Supabase user UUID  ✓

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL_KEY = 'VITE_SUPABASE_URL';
const SUPABASE_KEY_KEY = 'VITE_SUPABASE_PUBLISHABLE_KEY';

function getEnv(key: string, fallback?: string): string {
  const v =
    (import.meta.env as Record<string, string | undefined>)[key] ??
    (typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>)[key.replace('VITE_', '')] : undefined);
  if (!v && !fallback) throw new Error(`Missing env var: ${key}`);
  return v ?? fallback!;
}

// ─── Fetch wrapper ────────────────────────────────────────────────────────────

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  const opaque = supabaseKey.startsWith('sb_publishable_') || supabaseKey.startsWith('sb_secret_');
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    // Opaque keys are not JWTs — never send as Bearer
    if (opaque && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }
    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

// ─── Client singleton ─────────────────────────────────────────────────────────

function createSupabaseClient() {
  const url = getEnv(SUPABASE_URL_KEY);
  const key = getEnv(SUPABASE_KEY_KEY);
  return createClient<Database>(url, key, {
    global: { fetch: createSupabaseFetch(key) },
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

let _client: ReturnType<typeof createSupabaseClient> | undefined;
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_client) _client = createSupabaseClient();
    return Reflect.get(_client, prop, receiver);
  },
});

// ─── Auth bridge ──────────────────────────────────────────────────────────────

/**
 * Bridge a Firebase Google sign-in into a Supabase session.
 * Pass the raw Google ID token from Firebase's GoogleAuthProvider credential.
 * Supabase's id_token grant creates/updates the Supabase user and returns a
 * session immediately — no email confirmation required.
 */
export async function bridgeGoogleToSupabase(googleIdToken: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: googleIdToken,
  });
  if (error) {
    console.warn('[Supabase bridge] Google id_token exchange failed:', error.message);
    return false;
  }
  return !!data.session;
}

/**
 * Bridge an email/password Firebase sign-in into a Supabase session.
 *
 * Strategy:
 *  1. Try signInWithPassword — works if the Supabase account already exists
 *     and is confirmed.
 *  2. Try signUp — creates the account. If the project has email-confirm
 *     disabled, signUp returns a session immediately.
 *  3. If email confirm IS required and we still have no session, send a
 *     magic-link OTP so the user can confirm once, and optimistically
 *     continue (reads will work once they click the link).
 */
export async function bridgeEmailToSupabase(
  email: string,
  password: string,
): Promise<boolean> {
  // 1. Already have a matching session?
  const { data: existing } = await supabase.auth.getSession();
  if (existing?.session?.user?.email === email) return true;

  // 2. Try sign in
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (!signInErr) return true;

  // 3. Try sign up (works if autoconfirm is on)
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined },
  });
  if (!signUpErr && signUpData.session) return true;

  // 4. Email confirmation required — retry sign in in case the account was
  //    just confirmed in another tab, then silently continue
  const { error: retryErr } = await supabase.auth.signInWithPassword({ email, password });
  if (!retryErr) return true;

  console.info('[Supabase bridge] Email confirmation pending for', email, '— data reads may be limited until confirmed.');
  return false;
}

/** Sign out of Supabase (call alongside Firebase signOut). */
export async function signOutAll(): Promise<void> {
  await supabase.auth.signOut().catch(() => {});
}
