import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { getMemberProfile } from '@/lib/auth';
import { formatCompetitionStatus } from '@/lib/competition-status';
import { getCompetitionById } from '@/lib/competitions';
import { createClient } from '@/lib/supabase/server';

type ResultRow = {
  entry_id: string;
  entry_number: number;
  bjcp_category: string;
  bjcp_subcategory: string;
  bjcp_style_name: string;
  submitted_scoresheets: number;
  average_score: number | null;
  best_score: number | null;
};

type ScoresheetFeedbackRow = {
  id: string;
  entry_id: string;
  judge_id: string;
  status: 'draft' | 'submitted';
  aroma_score: number | null;
  aroma_comments: string | null;
  appearance_score: number | null;
  appearance_comments: string | null;
  flavor_score: number | null;
  flavor_comments: string | null;
  mouthfeel_score: number | null;
  mouthfeel_comments: string | null;
  overall_score: number | null;
  overall_comments: string | null;
  total_score: number | null;
  descriptors: unknown;
  submitted_at: string | null;
};

function formatAverage(value: number | null) {
  if (value === null || typeof value !== 'number') return '—';
  return value.toFixed(1);
}

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

  const [{ data: results, error: resultsError }, { data: myEntries, error: entriesError }] = await Promise.all([
    supabase
      .from('competition_results')
      .select('entry_id, entry_number, bjcp_category, bjcp_subcategory, bjcp_style_name, submitted_scoresheets, average_score, best_score')
      .eq('competition_id', competition.id),
    supabase
      .from('entries')
      .select('id, entry_number, bjcp_category, bjcp_subcategory, bjcp_style_name')
      .eq('competition_id', competition.id)
      .eq('brewer_id', member.id)
      .order('entry_number', { ascending: true }),
  ]);

  if (resultsError || entriesError) {
    throw new Error(resultsError?.message ?? entriesError?.message ?? 'Results could not be loaded.');
  }

  const ranked = [...((results ?? []) as ResultRow[])].sort((a, b) => {
    if ((a.average_score ?? -1) === (b.average_score ?? -1)) {
      return (b.best_score ?? -1) - (a.best_score ?? -1);
    }
    return (b.average_score ?? -1) - (a.average_score ?? -1);
  });

  const myEntryIds = (myEntries ?? []).map((entry) => entry.id);
  const { data: myScoresheets, error: myScoresheetsError } = await supabase
    .from('scoresheets')
    .select(
      'id, entry_id, judge_id, status, aroma_score, aroma_comments, appearance_score, appearance_comments, flavor_score, flavor_comments, mouthfeel_score, mouthfeel_comments, overall_score, overall_comments, total_score, descriptors, submitted_at',
    )
    .in('entry_id', myEntryIds.length ? myEntryIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('status', 'submitted');

  if (myScoresheetsError) {
    throw new Error(myScoresheetsError.message);
  }

  const sheetsByEntry = new Map<string, ScoresheetFeedbackRow[]>();
  for (const sheet of (myScoresheets ?? []) as ScoresheetFeedbackRow[]) {
    const existing = sheetsByEntry.get(sheet.entry_id) ?? [];
    existing.push(sheet);
    sheetsByEntry.set(sheet.entry_id, existing);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Results</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">{competition.name}</h1>
            <p className="mt-3 text-base leading-7 text-stone-600">Competition status: {formatCompetitionStatus(competition.status)}</p>
          </div>
          <Link
            href={competition.status === 'archived' ? `/history/${competition.id}` : `/competitions/${competition.id}`}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-amber-600 hover:text-amber-700"
          >
            Back
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900">Overall ranking</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">Only submitted scoresheets are included.</p>

          <div className="mt-5 space-y-3">
            {ranked.map((row, index) => {
              const hasScores = row.submitted_scoresheets > 0;

              return (
                <div key={row.entry_id} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">#{index + 1}</p>
                      <h3 className="mt-2 text-base font-semibold text-stone-900">
                        Entry #{row.entry_number} — {row.bjcp_category}
                        {row.bjcp_subcategory}. {row.bjcp_style_name}
                      </h3>
                      <p className="mt-2 text-sm text-stone-600">
                        Submitted sheets: {row.submitted_scoresheets}{' '}
                        {!hasScores ? <span className="font-medium text-amber-700">(pending)</span> : null}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Avg</p>
                      <p className="mt-1 text-2xl font-semibold text-stone-950">{formatAverage(row.average_score)}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {!ranked.length ? <p className="text-sm text-stone-600">No entries have been scored yet.</p> : null}
          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-stone-900">Your feedback</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">Read-only copies of your submitted scoresheets.</p>

          <div className="mt-5 space-y-4">
            {(myEntries ?? []).map((entry) => {
              const sheets = sheetsByEntry.get(entry.id) ?? [];

              return (
                <details key={entry.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Entry #{entry.entry_number}</p>
                        <h3 className="mt-2 text-base font-semibold text-stone-900">
                          {entry.bjcp_category}
                          {entry.bjcp_subcategory}. {entry.bjcp_style_name}
                        </h3>
                        <p className="mt-2 text-sm text-stone-600">
                          {sheets.length ? `${sheets.length} submitted scoresheet(s)` : 'Pending — no submitted sheets yet.'}
                        </p>
                      </div>
                      <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-stone-800 ring-1 ring-stone-200">
                        Avg: {formatAverage((results ?? []).find((row) => (row as ResultRow).entry_id === entry.id)?.average_score ?? null)}
                      </div>
                    </div>
                  </summary>

                  <div className="mt-4 space-y-3">
                    {sheets.map((sheet) => (
                      <div key={sheet.id} className="rounded-3xl border border-stone-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-stone-900">Total score: {sheet.total_score ?? '—'} / 50</p>
                            <p className="mt-1 text-xs text-stone-500">
                              Submitted: {sheet.submitted_at ? new Date(sheet.submitted_at).toLocaleString() : '—'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm text-stone-600 md:grid-cols-2">
                          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                            <p className="font-semibold text-stone-900">Aroma ({sheet.aroma_score ?? '—'}/12)</p>
                            <p className="mt-2 whitespace-pre-wrap">{sheet.aroma_comments || '—'}</p>
                          </div>
                          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                            <p className="font-semibold text-stone-900">Appearance ({sheet.appearance_score ?? '—'}/3)</p>
                            <p className="mt-2 whitespace-pre-wrap">{sheet.appearance_comments || '—'}</p>
                          </div>
                          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                            <p className="font-semibold text-stone-900">Flavor ({sheet.flavor_score ?? '—'}/20)</p>
                            <p className="mt-2 whitespace-pre-wrap">{sheet.flavor_comments || '—'}</p>
                          </div>
                          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                            <p className="font-semibold text-stone-900">Mouthfeel ({sheet.mouthfeel_score ?? '—'}/5)</p>
                            <p className="mt-2 whitespace-pre-wrap">{sheet.mouthfeel_comments || '—'}</p>
                          </div>
                          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 md:col-span-2">
                            <p className="font-semibold text-stone-900">Overall ({sheet.overall_score ?? '—'}/10)</p>
                            <p className="mt-2 whitespace-pre-wrap">{sheet.overall_comments || '—'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}

            {!myEntries?.length ? <p className="text-sm text-stone-600">You did not enter this competition.</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
