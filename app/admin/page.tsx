import Link from 'next/link';

import { requireAdmin } from '@/lib/admin';
import { formatCompetitionStatus } from '@/lib/competition-status';
import { getCurrentCompetition, getPastCompetitions } from '@/lib/competitions';

export default async function AdminHomePage() {
  await requireAdmin();

  const [currentCompetition, pastCompetitions] = await Promise.all([getCurrentCompetition(), getPastCompetitions()]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-stone-900">Current competition</h2>
        {currentCompetition ? (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-lg font-semibold text-stone-900">{currentCompetition.name}</p>
              <p className="mt-1 text-sm text-stone-600">{currentCompetition.description || 'No description provided yet.'}</p>
            </div>
            <dl className="grid gap-4 text-sm text-stone-600 sm:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <dt className="font-medium text-stone-900">Status</dt>
                <dd>{formatCompetitionStatus(currentCompetition.status)}</dd>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <dt className="font-medium text-stone-900">Judges per entry</dt>
                <dd>{currentCompetition.judges_per_entry}</dd>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <dt className="font-medium text-stone-900">Allowed styles</dt>
                <dd>{currentCompetition.allowed_styles?.length ?? 0}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-3">
              <Link href={`/admin/competitions/${currentCompetition.id}`} className="rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800">
                Open admin detail
              </Link>
              <Link href={`/admin/competitions/${currentCompetition.id}/scores`} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-amber-600 hover:text-amber-700">
                View scores
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6">
            <p className="text-sm leading-6 text-stone-600">No active competition exists yet.</p>
            <Link href="/admin/competitions/new" className="mt-4 inline-flex rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800">
              Create competition
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-stone-900">Recent history</h2>
        <div className="mt-4 space-y-3">
          {pastCompetitions.slice(0, 5).map((competition) => (
            <Link
              key={competition.id}
              href={`/admin/competitions/${competition.id}`}
              className="block rounded-2xl border border-stone-200 bg-stone-50 p-4 transition hover:border-amber-300"
            >
              <p className="font-medium text-stone-900">{competition.name}</p>
              <p className="mt-1 text-sm text-stone-600">{formatCompetitionStatus(competition.status)}</p>
            </Link>
          ))}
          {!pastCompetitions.length ? <p className="text-sm text-stone-600">No past competitions yet.</p> : null}
        </div>
      </section>
    </div>
  );
}