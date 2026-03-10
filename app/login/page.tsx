import { redirect } from 'next/navigation';

import { LoginForm } from '@/components/login-form';
import { SignUpForm } from '@/components/sign-up-form';
import { getSessionUser } from '@/lib/auth';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getSessionUser();
  const { next } = await searchParams;

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="space-y-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Member access</p>
        <h1 className="text-4xl font-semibold tracking-tight text-stone-900">Sign in or create your account</h1>
        <p className="text-base leading-7 text-stone-600">
          Members can now create accounts directly from BrewJudge and sign in once their account is ready.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <LoginForm next={next} />
        <SignUpForm next={next} />
      </div>
    </div>
  );
}
