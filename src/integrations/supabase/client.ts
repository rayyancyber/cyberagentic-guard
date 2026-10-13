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
  // Try direct URL first if on localhost (bypass Lovable proxy)
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.match(/^192\.168\./));

  let url: string | undefined;
  let key: string | undefined;

  if (isLocalhost) {
    // Local development: try direct Supabase URL first
    url = import.meta.env['VITE_SUPABASE_DIRECT_URL'] as string | undefined;
    key = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined;
    
    // Fallback to Lovable proxy if direct URL not configured
    if (!url || !key) {
      console.warn('[Supabase] Direct URL not configured, using Lovable proxy');
      url = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
      key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined;
    } else {
      console.log('[Supabase] Using direct URL for localhost');
    }
  } else {
    // Production or Lovable preview: use proxy
    url = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
    key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined;
  }

  // Fallback to process.env for server-side
  if (!url || !key) {
    url = url ?? (typeof process !== 'undefined' ? process.env['SUPABASE_URL'] : undefined);
    key = key ?? (typeof process !== 'undefined' ? process.env['SUPABASE_PUBLISHABLE_KEY'] : undefined);
  }

  if (!url || !key) {
    throw new Error('Missing Supabase configuration. Please check your .env file.');
  }

  console.log('[Supabase] Initializing with URL:', url);

  return createClient<Database>(url, key, {
    global: { fetch: createSupabaseFetch(key) },
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // Use PKCE flow for better security
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
  try {
    // Already have a live session? Skip
    const { data: cur } = await supabase.auth.getSession();
    if (cur.session) {
      console.log('[bridgeGoogle] Session already exists');
      return;
    }

    console.log('[bridgeGoogle] Exchanging Google token for Supabase session');

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: googleIdToken,
    });

    if (error) {
      console.error('[bridgeGoogle] Token exchange failed:', error.message);
      throw error;
    }

    if (data.session) {
      console.log('[bridgeGoogle] Successfully created Supabase session');
    } else {
      console.warn('[bridgeGoogle] No session returned from token exchange');
    }
  } catch (err) {
    console.error('[bridgeGoogle] Error:', err);
    throw err;
  }
}

// ─── RLS bridge: Email/Password ───────────────────────────────────────────────

/**
 * Create/restore a Supabase session for an email/password Firebase user.
 *
 * Flow:
 *  1. If Supabase session already exists for this email → done
 *  2. Try signInWithPassword (works if account exists and is confirmed)
 *  3. If login fails → try signUp (creates account)
 *  4. After signUp retry signIn (in case it was auto-confirmed)
 *
 * We use the same password so both Firebase and Supabase stay in sync.
 */
export async function bridgeEmail(email: string, password: string): Promise<void> {
  try {
    const { data: cur } = await supabase.auth.getSession();
    if (cur.session?.user.email === email) {
      console.log('[bridgeEmail] Session already exists for', email);
      return;
    }

    console.log('[bridgeEmail] Attempting sign in for', email);
    
    // Try to sign in first
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (!signInErr && signInData.session) {
      console.log('[bridgeEmail] Sign in successful');
      return;
    }

    console.log('[bridgeEmail] Sign in failed, attempting sign up:', signInErr?.message);

    // Account might not exist yet — sign up
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/dashboard`
          : undefined,
        data: {
          email_confirm: true, // Auto-confirm for development
        }
      },
    });

    if (signUpErr) {
      console.error('[bridgeEmail] Sign up failed:', signUpErr);
      throw signUpErr;
    }

    // If signUp returned a session (autoconfirm on) we're done
    if (signUpData.session) {
      console.log('[bridgeEmail] Sign up successful with session');
      return;
    }

    console.log('[bridgeEmail] Sign up successful, user may need to confirm email');

    // Last attempt — maybe it was already registered (email confirm pending)
    const { data: retryData } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });
    
    if (retryData.session) {
      console.log('[bridgeEmail] Retry sign in successful');
    }
  } catch (err) {
    console.error('[bridgeEmail] Error:', err);
    throw err;
  }
}

// ─── Sign out ─────────────────────────────────────────────────────────────────

export async function supabaseSignOut(): Promise<void> {
  await supabase.auth.signOut().catch(() => {});
}
