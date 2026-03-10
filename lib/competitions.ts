import { createClient } from '@/lib/supabase/server';

import { normalizeAllowedStyleCodes } from '@/lib/bjcp';
import type { CompetitionStatus } from '@/lib/competition-status';

export type CompetitionSummary = {
  id: string;
  name: string;
  description: string | null;
  status: CompetitionStatus;
  entry_deadline: string | null;
  judging_date: string | null;
  judges_per_entry: number;
  allowed_styles?: string[];
};

export type MemberEntrySummary = {
  id: string;
  competitionId: string;
  competitionName: string;
  competitionStatus: CompetitionStatus;
  entryNumber: number;
  styleName: string;
  bjcpCode: string;
  specialIngredients: string | null;
  createdAt: string;
};

export type MemberJudgingAssignmentSummary = {
  competitionId: string;
  competitionName: string;
  competitionStatus: CompetitionStatus;
  entryId: string;
  entryNumber: number;
  styleName: string;
  bjcpCode: string;
};

export async function getCurrentCompetition(): Promise<CompetitionSummary | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('competitions')
    .select('id, name, description, status, entry_deadline, judging_date, judges_per_entry, allowed_styles')
    .in('status', ['setup', 'accepting_entries', 'judging'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return {
    ...data,
    allowed_styles: normalizeAllowedStyleCodes(data.allowed_styles),
  };
}

export async function getCompetitionById(competitionId: string): Promise<CompetitionSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('competitions')
    .select('id, name, description, status, entry_deadline, judging_date, judges_per_entry, allowed_styles')
    .eq('id', competitionId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    ...data,
    allowed_styles: normalizeAllowedStyleCodes(data.allowed_styles),
  };
}

export async function getPastCompetitions(): Promise<CompetitionSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('competitions')
    .select('id, name, description, status, entry_deadline, judging_date, judges_per_entry, allowed_styles')
    .in('status', ['closed', 'archived'])
    .order('judging_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((competition) => ({
    ...competition,
    allowed_styles: normalizeAllowedStyleCodes(competition.allowed_styles),
  }));
}

export async function getMemberEntries(memberId: string): Promise<MemberEntrySummary[]> {
  const supabase = await createClient();
  const { data: entries, error: entryError } = await supabase
    .from('entries')
    .select('id, competition_id, entry_number, bjcp_category, bjcp_subcategory, bjcp_style_name, special_ingredients, created_at')
    .eq('brewer_id', memberId)
    .order('created_at', { ascending: false });

  if (entryError) {
    throw new Error(entryError.message);
  }

  const competitionIds = Array.from(new Set((entries ?? []).map((entry) => entry.competition_id)));
  const { data: competitions, error: competitionError } = await supabase
    .from('competitions')
    .select('id, name, status')
    .in('id', competitionIds.length ? competitionIds : ['00000000-0000-0000-0000-000000000000']);

  if (competitionError) {
    throw new Error(competitionError.message);
  }

  const competitionMap = new Map((competitions ?? []).map((competition) => [competition.id, competition]));

  return (entries ?? []).map((entry) => {
    const competition = competitionMap.get(entry.competition_id);

    return {
      id: entry.id,
      competitionId: entry.competition_id,
      competitionName: competition?.name ?? 'Unknown competition',
      competitionStatus: (competition?.status ?? 'setup') as CompetitionStatus,
      entryNumber: entry.entry_number,
      styleName: entry.bjcp_style_name,
      bjcpCode: `${entry.bjcp_category}${entry.bjcp_subcategory}`,
      specialIngredients: entry.special_ingredients,
      createdAt: entry.created_at,
    };
  });
}

export async function getMemberJudgingAssignments(): Promise<MemberJudgingAssignmentSummary[]> {
  const supabase = await createClient();

  const { data: blindEntries, error: blindEntryError } = await supabase
    .from('blind_entries')
    .select('id, competition_id, entry_number, bjcp_category, bjcp_subcategory, bjcp_style_name')
    .order('entry_number', { ascending: true });

  if (blindEntryError) {
    throw new Error(blindEntryError.message);
  }

  const competitionIds = Array.from(new Set((blindEntries ?? []).map((entry) => entry.competition_id)));
  const { data: competitions, error: competitionError } = await supabase
    .from('competitions')
    .select('id, name, status')
    .in('id', competitionIds.length ? competitionIds : ['00000000-0000-0000-0000-000000000000']);

  if (competitionError) {
    throw new Error(competitionError.message);
  }

  const competitionMap = new Map((competitions ?? []).map((competition) => [competition.id, competition]));

  return (blindEntries ?? []).map((entry) => {
    const competition = competitionMap.get(entry.competition_id);

    return {
      competitionId: entry.competition_id,
      competitionName: competition?.name ?? 'Unknown competition',
      competitionStatus: (competition?.status ?? 'setup') as CompetitionStatus,
      entryId: entry.id,
      entryNumber: entry.entry_number,
      styleName: entry.bjcp_style_name,
      bjcpCode: `${entry.bjcp_category}${entry.bjcp_subcategory}`,
    };
  });
}
