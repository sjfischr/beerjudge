import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { getMemberProfile } from '@/lib/auth';
import { formatCompetitionStatus } from '@/lib/competition-status';
import { getCompetitionById } from '@/lib/competitions';

export default async function HistoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const member = await getMemberProfile();

  if (!member) {
    redirect('/login');
  }

  const { id } = await params;
  const competition = await getCompetitionById(id);

  if (!competition) {
    notFound();
  }

  if (!['closed', 'archived'].includes(competition.status)) {
    redirect(`/competitions/${competition.id}`);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Competition archive</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">{competition.name}</h1>
            <p className="mt-3 text-base leading-7 text-stone-600">Status: {formatCompetitionStatus(competition.status)}</p>
          </div>
          <Link
            href="/history"
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-amber-600 hover:text-amber-700"
          >
            Back to history
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Link
          href={`/competitions/${competition.id}/results`}
          className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm transition hover:border-amber-300 hover:shadow"
        >
          <h2 className="text-xl font-semibold text-stone-900">Results</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">View ranked results and your feedback for this competition.</p>
        </Link>

        <Link
          href={`/competitions/${competition.id}`}
          className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm transition hover:border-amber-300 hover:shadow"
        >
          <h2 className="text-xl font-semibold text-stone-900">Competition page</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">Review the original competition details (read-only).</p>
        </Link>
      </section>
    </div>
  );
}
