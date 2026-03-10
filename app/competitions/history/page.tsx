import Link from 'next/link';

import { formatCompetitionStatus } from '@/lib/competition-status';
import { getPastCompetitions } from '@/lib/competitions';

export default async function CompetitionHistoryPage() {
  const competitions = await getPastCompetitions();

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">History</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">Past competitions</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Browse past GRiST competitions and revisit competition details as the platform history builds out.
        </p>
      </section>

      <section className="grid gap-4">
        {competitions.map((competition) => (
          <Link key={competition.id} href={`/competitions/${competition.id}`} className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm transition hover:border-amber-300">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-stone-900">{competition.name}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">{competition.description || 'Competition details archived for members.'}</p>
              </div>
              <div className="rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-700">
                {formatCompetitionStatus(competition.status)}
              </div>
            </div>
          </Link>
        ))}
        {!competitions.length ? <p className="text-sm text-stone-600">No past competitions are available yet.</p> : null}
      </section>
    </div>
  );
}