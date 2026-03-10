import { createClient } from '@/lib/supabase/server';

export type CompetitionResultRow = {
  entry_id: string;
  entry_number: number;
  bjcp_category: string;
  bjcp_subcategory: string;
  bjcp_style_name: string;
  submitted_scoresheets: number;
  average_score: number | null;
  best_score: number | null;
};

export async function getCompetitionResults(competitionId: string): Promise<CompetitionResultRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('competition_results')
    .select('entry_id, entry_number, bjcp_category, bjcp_subcategory, bjcp_style_name, submitted_scoresheets, average_score, best_score')
    .eq('competition_id', competitionId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CompetitionResultRow[];
}
