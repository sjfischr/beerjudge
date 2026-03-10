import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';

export default async function AdminCompetitionScoresPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const supabase = await createClient();
  const [{ data: competition, error: competitionError }, { data: entries, error: entryError }, { data: scoresheets, error: scoreError }, { data: members, error: memberError }] =
    await Promise.all([
      supabase.from('competitions').select('id, name').eq('id', id).maybeSingle(),
      supabase
        .from('entries')
        .select('id, entry_number, bjcp_category, bjcp_subcategory, bjcp_style_name')
        .eq('competition_id', id)
        .order('entry_number', { ascending: true }),
      supabase
        .from('scoresheets')
        .select(
          'id, entry_id, judge_id, status, total_score, aroma_comments, appearance_comments, flavor_comments, mouthfeel_comments, overall_comments, submitted_at',
        )
        .eq('competition_id', id),
      supabase.from('members').select('id, email, display_name'),
    ]);

  if (competitionError || !competition) {
    notFound();
  }

  if (entryError || scoreError || memberError) {
    throw new Error(entryError?.message ?? scoreError?.message ?? memberError?.message ?? 'Scores could not be loaded.');
  }

  const memberMap = new Map((members ?? []).map((member) => [member.id, member]));
  const scoresByEntry = new Map<string, typeof scoresheets>();

  for (const scoresheet of scoresheets ?? []) {
    const existing = scoresByEntry.get(scoresheet.entry_id) ?? [];
    existing.push(scoresheet);
    scoresByEntry.set(scoresheet.entry_id, existing);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Scores overview</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">{competition.name}</h2>
          </div>
          <Link href={`/admin/competitions/${competition.id}`} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-amber-600 hover:text-amber-700">
            Back to competition
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        {(entries ?? []).map((entry) => {
          const entryScores = scoresByEntry.get(entry.id) ?? [];
          const submittedScores = entryScores.filter((score) => typeof score.total_score === 'number');
          const averageScore = submittedScores.length
            ? submittedScores.reduce((total, score) => total + (score.total_score ?? 0), 0) / submittedScores.length
            : null;

          return (
            <details key={entry.id} className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Entry #{entry.entry_number}</p>
                  <h3 className="mt-2 text-xl font-semibold text-stone-900">
                    {entry.bjcp_category}{entry.bjcp_subcategory}. {entry.bjcp_style_name}
                  </h3>
                </div>
                <div className="grid gap-2 text-sm text-stone-600 sm:grid-cols-3 sm:text-right">
                  <div>
                    <p className="font-medium text-stone-900">Judge totals</p>
                    <p>{entryScores.map((score) => score.total_score ?? '—').join(', ') || '—'}</p>
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">Average</p>
                    <p>{averageScore === null ? '—' : averageScore.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">Statuses</p>
                    <p>{entryScores.map((score) => score.status).join(', ') || 'No scoresheets'}</p>
                  </div>
                </div>
              </summary>

              <div className="mt-5 space-y-4">
                {entryScores.map((score) => {
                  const judge = memberMap.get(score.judge_id);

                  return (
                    <div key={score.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-stone-900">{judge?.display_name || judge?.email || 'Unknown judge'}</p>
                          <p className="text-sm text-stone-500">Status: {score.status}</p>
                        </div>
                        <div className="text-right text-sm text-stone-600">
                          <p className="font-medium text-stone-900">Total score</p>
                          <p>{score.total_score ?? '—'}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-stone-600 md:grid-cols-2">
                        <div className="rounded-2xl border border-stone-200 bg-white p-4">
                          <p className="font-medium text-stone-900">Aroma & appearance</p>
                          <p className="mt-2 whitespace-pre-wrap">{score.aroma_comments || 'No aroma comments.'}</p>
                          <p className="mt-2 whitespace-pre-wrap">{score.appearance_comments || 'No appearance comments.'}</p>
                        </div>
                        <div className="rounded-2xl border border-stone-200 bg-white p-4">
                          <p className="font-medium text-stone-900">Flavor & mouthfeel</p>
                          <p className="mt-2 whitespace-pre-wrap">{score.flavor_comments || 'No flavor comments.'}</p>
                          <p className="mt-2 whitespace-pre-wrap">{score.mouthfeel_comments || 'No mouthfeel comments.'}</p>
                        </div>
                        <div className="rounded-2xl border border-stone-200 bg-white p-4 md:col-span-2">
                          <p className="font-medium text-stone-900">Overall comments</p>
                          <p className="mt-2 whitespace-pre-wrap">{score.overall_comments || 'No overall comments.'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!entryScores.length ? <p className="text-sm text-stone-500">No scoresheets exist for this entry yet.</p> : null}
              </div>
            </details>
          );
        })}

        {!entries?.length ? <p className="text-sm text-stone-600">No entries available for scoring yet.</p> : null}
      </section>
    </div>
  );
}