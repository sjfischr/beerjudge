import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { getMemberProfile } from '@/lib/auth';
import { getCompetitionById } from '@/lib/competitions';
import { createClient } from '@/lib/supabase/server';
import type { ScoresheetDraft } from '@/lib/scoresheet';

import JudgeScoresheetClient from './JudgeScoresheetClient';

const EMPTY_DRAFT: ScoresheetDraft = {
  aroma_score: null,
  aroma_comments: '',
  appearance_score: null,
  appearance_comments: '',
  flavor_score: null,
  flavor_comments: '',
  mouthfeel_score: null,
  mouthfeel_comments: '',
  overall_score: null,
  overall_comments: '',
  stylistic_accuracy: null,
  technical_merit: null,
  intangibles: null,
  descriptors: [],
};

export default async function JudgeEntryScoresheetPage({
  params,
}: {
  params: Promise<{ id: string; entryId: string }>;
}) {
  const member = await getMemberProfile();

  if (!member) {
    redirect('/login');
  }

  const { id: competitionId, entryId } = await params;
  const competition = await getCompetitionById(competitionId);

  if (!competition) {
    notFound();
  }

  if (!['judging', 'closed', 'archived'].includes(competition.status)) {
    redirect(`/competitions/${competition.id}`);
  }

  const supabase = await createClient();

  const [{ data: blindEntry, error: blindEntryError }, { data: assignment, error: assignmentError }, { data: scoresheet, error: scoresheetError }] =
    await Promise.all([
      supabase
        .from('blind_entries')
        .select('id, entry_number, bjcp_category, bjcp_subcategory, bjcp_style_name')
        .eq('id', entryId)
        .eq('competition_id', competition.id)
        .maybeSingle(),
      supabase
        .from('judge_assignments')
        .select('id')
        .eq('competition_id', competition.id)
        .eq('judge_id', member.id)
        .eq('entry_id', entryId)
        .maybeSingle(),
      supabase
        .from('scoresheets')
        .select(
          'status, aroma_score, aroma_comments, appearance_score, appearance_comments, flavor_score, flavor_comments, mouthfeel_score, mouthfeel_comments, overall_score, overall_comments, stylistic_accuracy, technical_merit, intangibles, descriptors, submitted_at',
        )
        .eq('competition_id', competition.id)
        .eq('judge_id', member.id)
        .eq('entry_id', entryId)
        .maybeSingle(),
    ]);

  if (blindEntryError) {
    throw new Error(blindEntryError.message);
  }

  if (!blindEntry) {
    notFound();
  }

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  if (!assignment) {
    redirect(`/competitions/${competition.id}/judge`);
  }

  if (scoresheetError) {
    throw new Error(scoresheetError.message);
  }

  const judgeName = member.display_name || member.email;

  const initialDraft: ScoresheetDraft = {
    ...EMPTY_DRAFT,
    ...(scoresheet ?? {}),
    aroma_score: scoresheet?.aroma_score ?? null,
    appearance_score: scoresheet?.appearance_score ?? null,
    flavor_score: scoresheet?.flavor_score ?? null,
    mouthfeel_score: scoresheet?.mouthfeel_score ?? null,
    overall_score: scoresheet?.overall_score ?? null,
    stylistic_accuracy: scoresheet?.stylistic_accuracy ?? null,
    technical_merit: scoresheet?.technical_merit ?? null,
    intangibles: scoresheet?.intangibles ?? null,
    descriptors: ((scoresheet?.descriptors as unknown as string[]) ?? []) as unknown as import('@/lib/scoresheet').OffFlavorDescriptor[],
    aroma_comments: scoresheet?.aroma_comments ?? '',
    appearance_comments: scoresheet?.appearance_comments ?? '',
    flavor_comments: scoresheet?.flavor_comments ?? '',
    mouthfeel_comments: scoresheet?.mouthfeel_comments ?? '',
    overall_comments: scoresheet?.overall_comments ?? '',
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/competitions/${competition.id}/judge`}
        className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-amber-600 hover:text-amber-700"
      >
        ← Back to judging queue
      </Link>

      <JudgeScoresheetClient
        header={{
          entryId: blindEntry.id,
          entryNumber: blindEntry.entry_number,
          bjcpCode: `${blindEntry.bjcp_category}${blindEntry.bjcp_subcategory}`,
          styleName: blindEntry.bjcp_style_name,
          competitionName: competition.name,
          judgeName,
          status: scoresheet?.status ?? null,
          initialDraft,
          submittedAt: scoresheet?.submitted_at ?? null,
        }}
      />
    </div>
  );
}
