'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export type AuthFormState = {
  error: string | null;
  success: string | null;
};

function normalizeNextPath(next: string) {
  return next.startsWith('/') ? next : '/dashboard';
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get('origin');

  if (origin) {
    return origin;
  }

  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host');

  if (!host) {
    return null;
  }

  const protocol = headerStore.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}

export async function signInAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = normalizeNextPath(String(formData.get('next') ?? '/dashboard'));

  if (!email || !password) {
    return { error: 'Email and password are required.', success: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message, success: null };
  }

  redirect(next as `/${string}`);
}

export async function signUpAction(_: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const displayName = String(formData.get('display_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = normalizeNextPath(String(formData.get('next') ?? '/dashboard'));

  if (!email || !password) {
    return { error: 'Email and password are required.', success: null };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long.', success: null };
  }

  const origin = await getRequestOrigin();
  const emailRedirectTo = origin ? `${origin}/auth/callback?next=${encodeURIComponent(next)}` : undefined;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || undefined,
      },
      emailRedirectTo,
    },
  });

  if (error) {
    return { error: error.message, success: null };
  }

  if (data.session) {
    redirect(next as `/${string}`);
  }

  return {
    error: null,
    success: 'Account created. Check your email to confirm your address, then sign in.',
  };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
