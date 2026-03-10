import { redirect } from 'next/navigation';

import { getMemberProfile } from '@/lib/auth';
import { getCurrentCompetition } from '@/lib/competitions';

export default async function DashboardPage() {
  const [member, competition] = await Promise.all([getMemberProfile(), getCurrentCompetition()]);

  if (!member) {
    redirect('/login');
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">
          Welcome back, {member.display_name || member.email}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
          Phase 1 establishes authentication, member identity, and competition visibility. Entry submission,
          assignments, and judging workflows will be layered on in later phases.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-stone-200 bg-[var(--card)] p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900">Profile</h2>
          <dl className="mt-4 space-y-3 text-sm text-stone-600">
            <div>
              <dt className="font-medium text-stone-900">Email</dt>
              <dd>{member.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-stone-900">Role</dt>
              <dd>{member.is_admin ? 'Administrator' : 'Member'}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-[2rem] border border-stone-200 bg-[var(--card)] p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900">Competition status</h2>
          {competition ? (
            <div className="mt-4 space-y-2 text-sm text-stone-600">
              <p className="font-medium text-stone-900">{competition.name}</p>
              <p className="capitalize">Status: {competition.status.replace('_', ' ')}</p>
              <p>Judges per entry: {competition.judges_per_entry}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-stone-600">No competition is currently open.</p>
          )}
        </div>
      </section>
    </div>
  );
}
