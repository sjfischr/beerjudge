import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { getMemberProfile } from '@/lib/auth';
import { formatCompetitionStatus } from '@/lib/competition-status';
import { getCompetitionById } from '@/lib/competitions';
import { createClient } from '@/lib/supabase/server';

type BlindEntryRow = {
  id: string;
  competition_id: string;
  entry_number: number;
  bjcp_category: string;
  bjcp_subcategory: string;
  bjcp_style_name: string;
  special_ingredients: string | null;
};

export default async function JudgeQueuePage({ params }: { params: Promise<{ id: string }> }) {
  const member = await getMemberProfile();

  if (!member) {
    redirect('/login');
  }

  const { id } = await params;
  const competition = await getCompetitionById(id);

  if (!competition) {
    notFound();
  }

  if (!['judging', 'closed', 'archived'].includes(competition.status)) {
    redirect(`/competitions/${competition.id}`);
  }

  const supabase = await createClient();

  const [{ data: assignments, error: assignmentError }, { data: blindEntries, error: blindEntryError }] = await Promise.all([
    supabase
      .from('judge_assignments')
      .select('entry_id, scoresheets(status)')
      .eq('competition_id', competition.id)
      .eq('judge_id', member.id),
    supabase
      .from('blind_entries')
      .select('id, competition_id, entry_number, bjcp_category, bjcp_subcategory, bjcp_style_name, special_ingredients')
      .eq('competition_id', competition.id)
      .order('entry_number', { ascending: true }),
  ]);

  if (assignmentError || blindEntryError) {
    throw new Error(assignmentError?.message ?? blindEntryError?.message ?? 'Judging assignments could not be loaded.');
  }

  const scoreStatusByEntry = new Map<string, 'draft' | 'submitted' | null>();

  for (const assignment of (assignments ?? []) as unknown as Array<{ entry_id: string; scoresheets: Array<{ status: 'draft' | 'submitted' }> }>) {
    const status = assignment.scoresheets?.[0]?.status ?? null;
    scoreStatusByEntry.set(assignment.entry_id, status);
  }

  const assignedEntryIds = new Set((assignments ?? []).map((a) => (a as unknown as { entry_id: string }).entry_id));
  const entries = (blindEntries ?? []).filter((entry) => assignedEntryIds.has(entry.id)) as BlindEntryRow[];

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Judging queue</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">{competition.name}</h1>
            <p className="mt-3 text-base leading-7 text-stone-600">Competition status: {formatCompetitionStatus(competition.status)}</p>
          </div>
          <Link
            href={`/competitions/${competition.id}`}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-amber-600 hover:text-amber-700"
          >
            Back to competition
          </Link>
        </div>
      </section>

      <section className="grid gap-4">
        {entries.map((entry) => {
          const status = scoreStatusByEntry.get(entry.id) ?? null;
          const badge = status === 'submitted' ? 'Submitted' : status === 'draft' ? 'Draft' : 'Not started';
          const badgeClass =
            status === 'submitted'
              ? 'bg-emerald-100 text-emerald-800'
              : status === 'draft'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-stone-100 text-stone-700';

          return (
            <Link
              key={entry.id}
              href={`/competitions/${competition.id}/judge/${entry.id}`}
              className="group rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-[1px] hover:border-amber-300 hover:shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Entry #{entry.entry_number}</p>
                  <h2 className="mt-2 text-xl font-semibold text-stone-900">
                    {entry.bjcp_category}
                    {entry.bjcp_subcategory}. {entry.bjcp_style_name}
                  </h2>
                  {entry.special_ingredients ? (
                    <p className="mt-2 text-sm leading-6 text-stone-600">Special ingredients: {entry.special_ingredients}</p>
                  ) : null}
                </div>
                <div className={`rounded-full px-3 py-1 text-sm font-medium ${badgeClass}`}>{badge}</div>
              </div>
              <p className="mt-4 text-sm text-stone-500 transition group-hover:text-stone-600">Open scoresheet →</p>
            </Link>
          );
        })}

        {!entries.length ? (
          <div className="rounded-[2rem] border border-dashed border-stone-300 bg-white p-8">
            <h2 className="text-xl font-semibold text-stone-900">No assigned entries</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">Once an admin assigns entries, they’ll show up here.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
