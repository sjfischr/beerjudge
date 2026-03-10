export type ScoresheetStatus = 'draft' | 'submitted';

export const BJCP_OFF_FLAVOR_DESCRIPTORS = [
  'Acetaldehyde',
  'Alcoholic',
  'Astringent',
  'Chlorophenolic',
  'Diacetyl',
  'DMS',
  'Estery',
  'Grassy',
  'Light-struck',
  'Metallic',
  'Oxidized',
  'Phenolic',
  'Solvent',
  'Sour/Acidic',
  'Sulfur',
  'Vegetal',
  'Yeasty',
] as const;

export type OffFlavorDescriptor = (typeof BJCP_OFF_FLAVOR_DESCRIPTORS)[number];

export type ScoresheetDraft = {
  aroma_score: number | null;
  aroma_comments: string;
  appearance_score: number | null;
  appearance_comments: string;
  flavor_score: number | null;
  flavor_comments: string;
  mouthfeel_score: number | null;
  mouthfeel_comments: string;
  overall_score: number | null;
  overall_comments: string;
  stylistic_accuracy: number | null;
  technical_merit: number | null;
  intangibles: number | null;
  descriptors: OffFlavorDescriptor[];
};

export const SCORE_RANGES = {
  aroma_score: { min: 0, max: 12 },
  appearance_score: { min: 0, max: 3 },
  flavor_score: { min: 0, max: 20 },
  mouthfeel_score: { min: 0, max: 5 },
  overall_score: { min: 0, max: 10 },
  stylistic_accuracy: { min: 1, max: 5 },
  technical_merit: { min: 1, max: 5 },
  intangibles: { min: 1, max: 5 },
} as const;

export function computeTotalScore(draft: ScoresheetDraft) {
  const total =
    (draft.aroma_score ?? 0) +
    (draft.appearance_score ?? 0) +
    (draft.flavor_score ?? 0) +
    (draft.mouthfeel_score ?? 0) +
    (draft.overall_score ?? 0);

  return total;
}

export function scoreTier(total: number) {
  if (total >= 45) return { label: 'World-class', className: 'text-emerald-700' };
  if (total >= 38) return { label: 'Excellent', className: 'text-emerald-700' };
  if (total >= 30) return { label: 'Very good', className: 'text-amber-700' };
  if (total >= 21) return { label: 'Good', className: 'text-amber-700' };
  if (total >= 14) return { label: 'Fair', className: 'text-stone-600' };
  return { label: 'Problematic', className: 'text-rose-700' };
}

function isNonEmpty(value: string) {
  return value.trim().length > 0;
}

export function validateFinalSubmission(draft: ScoresheetDraft) {
  const errors: Record<string, string> = {};

  for (const field of ['aroma_score', 'appearance_score', 'flavor_score', 'mouthfeel_score', 'overall_score'] as const) {
    const range = SCORE_RANGES[field];
    const value = draft[field];

    if (typeof value !== 'number') {
      errors[field] = 'Required.';
      continue;
    }

    if (value < range.min || value > range.max) {
      errors[field] = `Must be between ${range.min} and ${range.max}.`;
    }
  }

  for (const field of ['aroma_comments', 'appearance_comments', 'flavor_comments', 'mouthfeel_comments', 'overall_comments'] as const) {
    if (!isNonEmpty(draft[field])) {
      errors[field] = 'Required.';
    }
  }

  for (const field of ['stylistic_accuracy', 'technical_merit', 'intangibles'] as const) {
    const range = SCORE_RANGES[field];
    const value = draft[field];

    if (typeof value !== 'number') {
      errors[field] = 'Required.';
      continue;
    }

    if (value < range.min || value > range.max) {
      errors[field] = `Must be between ${range.min} and ${range.max}.`;
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
}
