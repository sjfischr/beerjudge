export const competitionStatuses = ['setup', 'accepting_entries', 'judging', 'closed', 'archived'] as const;

export type CompetitionStatus = (typeof competitionStatuses)[number];

export const competitionStatusLabels: Record<CompetitionStatus, string> = {
  setup: 'Setup',
  accepting_entries: 'Accepting entries',
  judging: 'Judging',
  closed: 'Closed',
  archived: 'Archived',
};

export const competitionStatusTransitions: Record<CompetitionStatus, CompetitionStatus[]> = {
  setup: ['accepting_entries', 'archived'],
  accepting_entries: ['judging', 'archived'],
  judging: ['closed', 'archived'],
  closed: ['archived'],
  archived: [],
};

export function isCompetitionStatus(value: string): value is CompetitionStatus {
  return competitionStatuses.includes(value as CompetitionStatus);
}

export function canTransitionCompetitionStatus(from: CompetitionStatus, to: CompetitionStatus) {
  return competitionStatusTransitions[from].includes(to);
}

export function formatCompetitionStatus(status: CompetitionStatus) {
  return competitionStatusLabels[status] ?? status;
}