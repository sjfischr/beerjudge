'use client';

import Link from 'next/link';
import { useActionState } from 'react';

import { signInAction, type AuthFormState } from '@/lib/auth-actions';

const initialState: AuthFormState = {
  error: null,
  success: null,
};

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-5 rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Existing members</p>
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Sign in</h2>
      </div>
      <input type="hidden" name="next" value={next ?? '/dashboard'} />
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-stone-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-600"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-stone-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-600"
          placeholder="Enter your password"
        />
      </div>
      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-amber-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? 'Signing in...' : 'Sign in'}
      </button>
      <p className="text-sm text-stone-500">
        Need an account?{' '}
        <Link href="#create-account" className="font-medium text-amber-700 transition hover:text-amber-800">
          Create one here.
        </Link>
      </p>
    </form>
  );
}
