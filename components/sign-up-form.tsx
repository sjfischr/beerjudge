'use client';

import { useActionState } from 'react';

import { signUpAction, type AuthFormState } from '@/lib/auth-actions';

const initialState: AuthFormState = {
  error: null,
  success: null,
};

export function SignUpForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <form
      id="create-account"
      action={formAction}
      className="space-y-5 rounded-3xl border border-stone-200 bg-white p-8 shadow-sm"
    >
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">New members</p>
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Create account</h2>
        <p className="text-sm leading-6 text-stone-600">
          Create your own BrewJudge login. If email confirmation is enabled, you will verify your address before signing in.
        </p>
      </div>

      <input type="hidden" name="next" value={next ?? '/dashboard'} />

      <div className="space-y-2">
        <label htmlFor="display_name" className="block text-sm font-medium text-stone-700">
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          autoComplete="name"
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-600"
          placeholder="Your name"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="signup_email" className="block text-sm font-medium text-stone-700">
          Email
        </label>
        <input
          id="signup_email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-600"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="signup_password" className="block text-sm font-medium text-stone-700">
          Password
        </label>
        <input
          id="signup_password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-600"
          placeholder="Create a password"
        />
      </div>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-2xl border border-amber-700 bg-white px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? 'Creating account...' : 'Create account'}
      </button>
    </form>
  );
}