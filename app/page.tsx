import Link from 'next/link';

import { getMemberProfile } from '@/lib/auth';
import { formatCompetitionStatus } from '@/lib/competition-status';
import { getCurrentCompetition, getPastCompetitions } from '@/lib/competitions';

function formatDate(date: string | null) {
  if (!date) {
    return 'TBD';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(new Date(date));
}

export default async function HomePage() {
  const [member, competition, pastCompetitions] = await Promise.all([
    getMemberProfile(),
    getCurrentCompetition(),
    getPastCompetitions(),
  ]);

  const latestClosed = pastCompetitions[0] ?? null;

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">BrewJudge</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-900">
            Run blind homebrew competitions without paper scoresheets.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
            BrewJudge gives GRiST a lightweight, self-hosted workflow for club competitions with digital
            BJCP-style judging, secure member access, and preserved competition history.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={member ? '/dashboard' : '/login'}
              className="inline-flex items-center rounded-full bg-amber-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-800"
            >
              {member ? 'Open dashboard' : 'Member login'}
            </Link>
            <Link
              href="/history"
              className="inline-flex items-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-amber-400 hover:text-amber-800"
            >
              Browse history
            </Link>
          </div>

          {latestClosed ? (
            <div className="mt-8 rounded-[1.75rem] border border-amber-200 bg-white/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Most recent results</p>
              <h2 className="mt-3 text-xl font-semibold text-stone-900">{latestClosed.name}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Status: {formatCompetitionStatus(latestClosed.status)}. View ranked results and your feedback.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/competitions/${latestClosed.id}/results`}
                  className="inline-flex items-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
                >
                  View results
                </Link>
                <Link
                  href={`/history/${latestClosed.id}`}
                  className="inline-flex items-center rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-amber-400 hover:text-amber-800"
                >
                  Archive details
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-[1.75rem] border border-dashed border-amber-200 bg-white/60 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Most recent results</p>
              <h2 className="mt-3 text-xl font-semibold text-stone-900">No closed competitions yet</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">Once a competition closes, results will show here.</p>
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-[var(--card)] p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Current competition</p>
          {competition ? (
            <div className="mt-4 space-y-4">
              <div>
                <h2 className="text-2xl font-semibold text-stone-900">{competition.name}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {competition.description || 'Competition details are available after member sign-in.'}
                </p>
              </div>
              <dl className="grid gap-4 text-sm text-stone-600 sm:grid-cols-2">
                <div className="rounded-2xl border border-stone-200 bg-white p-4">
                  <dt className="font-medium text-stone-900">Status</dt>
                  <dd className="mt-1 capitalize">{competition.status.replace('_', ' ')}</dd>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white p-4">
                  <dt className="font-medium text-stone-900">Judges per entry</dt>
                  <dd className="mt-1">{competition.judges_per_entry}</dd>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white p-4">
                  <dt className="font-medium text-stone-900">Entry deadline</dt>
                  <dd className="mt-1">{formatDate(competition.entry_deadline)}</dd>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white p-4">
                  <dt className="font-medium text-stone-900">Judging date</dt>
                  <dd className="mt-1">{formatDate(competition.judging_date)}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-white p-6">
              <h2 className="text-xl font-semibold text-stone-900">No active competitions</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                The next competition has not been published yet. Members can still sign in to access their dashboard
                once a new competition opens.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
