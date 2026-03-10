import { notFound, redirect } from 'next/navigation';

import { getMemberProfile } from '@/lib/auth';
import { formatCompetitionStatus } from '@/lib/competition-status';
import { getCompetitionById } from '@/lib/competitions';
import { createClient } from '@/lib/supabase/server';

export default async function CompetitionResultsPage({ params }: { params: Promise<{ id: string }> }) {
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

  const supabase = await createClient();
  const { data: entries, error: entryError } = await supabase
    .from('entries')
    .select('id, entry_number, bjcp_category, bjcp_subcategory, bjcp_style_name')
    .eq('competition_id', competition.id)
    .eq('brewer_id', member.id)
    .order('entry_number', { ascending: true });

  if (entryError) {
    throw new Error(entryError.message);
  }

  const entryIds = (entries ?? []).map((entry) => entry.id);
  const { data: scoresheets, error: scoreError } = await supabase
    .from('scoresheets')
    .select('entry_id, total_score, status')
    .in('entry_id', entryIds.length ? entryIds : ['00000000-0000-0000-0000-000000000000']);

  if (scoreError) {
    throw new Error(scoreError.message);
  }

  const scoresByEntry = new Map<string, number[]>();

  for (const scoresheet of scoresheets ?? []) {
    const existing = scoresByEntry.get(scoresheet.entry_id) ?? [];
    if (typeof scoresheet.total_score === 'number') {
      existing.push(scoresheet.total_score);
    }
    scoresByEntry.set(scoresheet.entry_id, existing);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Results</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">{competition.name}</h1>
        <p className="mt-3 text-base leading-7 text-stone-600">Competition status: {formatCompetitionStatus(competition.status)}</p>
      </section>

      <section className="grid gap-4">
        {(entries ?? []).map((entry) => {
          const totals = scoresByEntry.get(entry.id) ?? [];
          const average = totals.length ? totals.reduce((sum, score) => sum + score, 0) / totals.length : null;

          return (
            <div key={entry.id} className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Entry #{entry.entry_number}</p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">
                {entry.bjcp_category}
                {entry.bjcp_subcategory}. {entry.bjcp_style_name}
              </h2>
              <p className="mt-3 text-sm text-stone-600">
                Judge totals: {totals.length ? totals.join(', ') : 'Scores are not available yet.'}
              </p>
              <p className="mt-1 text-sm text-stone-600">Average score: {average === null ? '—' : average.toFixed(1)}</p>
            </div>
          );
        })}
        {!entries?.length ? <p className="text-sm text-stone-600">You do not have any entries in this competition.</p> : null}
      </section>
    </div>
  );
}