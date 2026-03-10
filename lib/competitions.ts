import { createClient } from '@/lib/supabase/server';

export type CompetitionSummary = {
  id: string;
  name: string;
  description: string | null;
  status: 'setup' | 'accepting_entries' | 'judging' | 'closed' | 'archived';
  entry_deadline: string | null;
  judging_date: string | null;
  judges_per_entry: number;
};

export async function getCurrentCompetition(): Promise<CompetitionSummary | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('competitions')
    .select('id, name, description, status, entry_deadline, judging_date, judges_per_entry')
    .in('status', ['setup', 'accepting_entries', 'judging'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}
