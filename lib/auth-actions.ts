'use server';

import { redirect } from 'next/navigation';

import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export type AuthFormState = {
  error: string | null;
  success: string | null;
};

function normalizeNextPath(next: string) {
  return next.startsWith('/') ? next : '/dashboard';
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

  const emailRedirectTo = `${env.siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;

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
