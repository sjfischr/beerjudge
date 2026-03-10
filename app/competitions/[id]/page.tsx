import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getMemberProfile } from '@/lib/auth';
import { formatCompetitionStatus } from '@/lib/competition-status';
import { getCompetitionById } from '@/lib/competitions';
import { createClient } from '@/lib/supabase/server';

export default async function CompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const competition = await getCompetitionById(id);

  if (!competition) {
    notFound();
  }

  const member = await getMemberProfile();
  const supabase = await createClient();
  const { data: myEntries, error } = member
    ? await supabase
        .from('entries')
        .select('id, entry_number, bjcp_category, bjcp_subcategory, bjcp_style_name, special_ingredients, created_at')
        .eq('competition_id', id)
        .eq('brewer_id', member.id)
        .order('created_at', { ascending: false })
    : { data: [], error: null };

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Competition</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-900">{competition.name}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">{competition.description || 'Competition details will be shared here as the event develops.'}</p>
          </div>
          <div className="rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700">
            {formatCompetitionStatus(competition.status)}
          </div>
        </div>

        <dl className="mt-6 grid gap-4 text-sm text-stone-600 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <dt className="font-medium text-stone-900">Judges per entry</dt>
            <dd>{competition.judges_per_entry}</dd>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <dt className="font-medium text-stone-900">Entry deadline</dt>
            <dd>{competition.entry_deadline ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(competition.entry_deadline)) : '—'}</dd>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <dt className="font-medium text-stone-900">Judging date</dt>
            <dd>{competition.judging_date ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(competition.judging_date)) : '—'}</dd>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <dt className="font-medium text-stone-900">Allowed styles</dt>
            <dd>{competition.allowed_styles?.length ?? 0}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          {member && competition.status === 'accepting_entries' ? (
            <Link href={`/competitions/${competition.id}/enter`} className="rounded-full bg-amber-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-800">
              Submit entry
            </Link>
          ) : null}
          {member && ['closed', 'archived'].includes(competition.status) ? (
            <Link href={`/competitions/${competition.id}/results`} className="rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:border-amber-600 hover:text-amber-700">
              View results
            </Link>
          ) : null}
        </div>
      </section>

      {member ? (
        <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-stone-900">My entries</h2>
          <div className="mt-4 space-y-3">
            {(myEntries ?? []).map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
                <p className="font-medium text-stone-900">Entry #{entry.entry_number}</p>
                <p className="mt-1">
                  {entry.bjcp_category}
                  {entry.bjcp_subcategory}. {entry.bjcp_style_name}
                </p>
                {entry.special_ingredients ? <p className="mt-1">Special ingredients: {entry.special_ingredients}</p> : null}
              </div>
            ))}
            {!myEntries?.length ? <p className="text-sm text-stone-600">You have not entered this competition yet.</p> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}