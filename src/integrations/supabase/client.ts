/**
 * Supabase client — ALL database operations via the Lovable cloud proxy.
 *
 * Auth architecture:
 *  - Firebase handles the sign-in UI (email/password + Google popup)
 *  - After every Firebase sign-in we create a matching Supabase session
 *    so Supabase RLS can resolve auth.uid() for every DB operation
 *
 * RLS bridge strategies (in priority order):
 *  1. Google users  → signInWithIdToken({ provider:'google', token: googleIdToken })
 *     Works instantly, no email confirmation needed.
 *  2. Email users   → signInWithPassword if account exists + confirmed
 *                  → signUp if new (may need confirmation)
 *  3. Page refresh  → Supabase session already in localStorage, autoRefresh keeps it alive
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// ─── Fetch: always inject apikey, never send opaque key as Bearer ─────────────

function createSupabaseFetch(key: string): typeof fetch {
  const opaque = key.startsWith('sb_publishable_') || key.startsWith('sb_secret_');
  return (input, init) => {
    const h = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => h.set(k, v));
    if (opaque && h.get('Authorization') === `Bearer ${key}`) h.delete('Authorization');
    h.set('apikey', key);
    return fetch(input, { ...init, headers: h });
  };
}

// ─── Singleton ────────────────────────────────────────────────────────────────

function buildClient() {
  const url =
    (import.meta.env['VITE_SUPABASE_URL'] as string | undefined) ??
    (typeof process !== 'undefined' ? process.env['SUPABASE_URL'] : undefined);
  const key =
    (import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined) ??
    (typeof process !== 'undefined' ? process.env['SUPABASE_PUBLISHABLE_KEY'] : undefined);
  if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY');
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

let _sb: ReturnType<typeof buildClient> | undefined;
export const supabase = new Proxy({} as ReturnType<typeof buildClient>, {
  get(_, p, r) {
    if (!_sb) _sb = buildClient();
    return Reflect.get(_sb, p, r);
  },
});

// ─── RLS bridge: Google ───────────────────────────────────────────────────────

/**
 * Exchange a Firebase Google ID token for a Supabase session.
 * Supabase's id_token grant auto-confirms the email — no confirmation email needed.
 * Call this right after signInWithPopup when you have the credential idToken.
 */
export async function bridgeGoogle(googleIdToken: string): Promise<void> {
  // Already have a live session? Skip
  const { data: cur } = await supabase.auth.getSession();
  if (cur.session) return;

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: googleIdToken,
  });
  if (error) console.warn('[Supabase RLS bridge] Google token exchange failed:', error.message);
}

// ─── RLS bridge: Email/Password ───────────────────────────────────────────────

/**
 * Create/restore a Supabase session for an email/password Firebase user.
 *
 * Flow:
 *  1. If Supabase session already exists for this email → done
 *  2. Try signInWithPassword (works if account exists and is confirmed)
 *  3. If login fails → try signUp (creates account; if autoconfirm off, session
 *     will be missing but we keep the Supabase signup attempt on record)
 *  4. After signUp retry signIn (in case it was auto-confirmed)
 *
 * We use the same password so both Firebase and Supabase stay in sync.
 */
export async function bridgeEmail(email: string, password: string): Promise<void> {
  const { data: cur } = await supabase.auth.getSession();
  if (cur.session?.user.email === email) return;

  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (!signInErr) return;

  // Account might not exist yet — sign up
  const { data: up } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: typeof window !== 'undefined'
        ? `${window.location.origin}/dashboard`
        : undefined,
    },
  });
  // If signUp returned a session (autoconfirm on) we're done
  if (up.session) return;

  // Last attempt — maybe it was already registered (email confirm pending)
  await supabase.auth.signInWithPassword({ email, password }).catch(() => {});
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

export async function supabaseSignOut(): Promise<void> {
  await supabase.auth.signOut().catch(() => {});
}
