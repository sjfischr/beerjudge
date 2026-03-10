import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getMemberProfile } from '@/lib/auth';
import { formatCompetitionStatus } from '@/lib/competition-status';
import { getCurrentCompetition, getMemberEntries, getMemberJudgingAssignments } from '@/lib/competitions';

export default async function DashboardPage() {
  const member = await getMemberProfile();

  if (!member) {
    redirect('/login');
  }

  const [competition, myEntries, judgingAssignments] = await Promise.all([
    getCurrentCompetition(),
    getMemberEntries(member.id),
    getMemberJudgingAssignments(),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">
          Welcome back, {member.display_name || member.email}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
          Track active competitions, monitor your submitted entries, and see any judging assignments linked to your account.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-stone-200 bg-[var(--card)] p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900">Current competition</h2>
          {competition ? (
            <div className="mt-4 space-y-3 text-sm text-stone-600">
              <p className="font-medium text-stone-900">{competition.name}</p>
              <p>{formatCompetitionStatus(competition.status)}</p>
              <Link href={`/competitions/${competition.id}`} className="inline-flex rounded-full border border-stone-300 px-4 py-2 font-medium text-stone-700 transition hover:border-amber-600 hover:text-amber-700">
                Open competition
              </Link>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-stone-600">No competition is currently open.</p>
          )}
        </div>
        <div className="rounded-[2rem] border border-stone-200 bg-[var(--card)] p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900">My entries</h2>
          <div className="mt-4 space-y-3 text-sm text-stone-600">
            {myEntries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="font-medium text-stone-900">{entry.competitionName}</p>
                <p className="mt-1">
                  Entry #{entry.entryNumber} · {entry.bjcpCode} {entry.styleName}
                </p>
              </div>
            ))}
            {!myEntries.length ? <p>You have not submitted any entries yet.</p> : null}
          </div>
        </div>
        <div className="rounded-[2rem] border border-stone-200 bg-[var(--card)] p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900">My judging assignments</h2>
          <div className="mt-4 space-y-3 text-sm text-stone-600">
            {judgingAssignments.slice(0, 5).map((assignment) => (
              <div key={assignment.entryId} className="rounded-2xl border border-stone-200 bg-white p-4">
                <p className="font-medium text-stone-900">{assignment.competitionName}</p>
                <p className="mt-1">
                  Entry #{assignment.entryNumber} · {assignment.bjcpCode} {assignment.styleName}
                </p>
              </div>
            ))}
            {!judgingAssignments.length ? <p>No judging assignments are linked to your account yet.</p> : null}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-stone-900">Competition history</h2>
            <p className="mt-2 text-sm text-stone-600">Browse past events and revisit your competition activity.</p>
          </div>
          <Link href="/competitions/history" className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-amber-600 hover:text-amber-700">
            View history
          </Link>
        </div>
      </section>
    </div>
  );
}
