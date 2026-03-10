import { createClient } from '@/lib/supabase/server';

export type StyleOption = {
  code: string;
  categoryNumber: string;
  subcategoryLetter: string;
  categoryName: string;
  styleName: string;
  description: string | null;
  ogMin: number | null;
  ogMax: number | null;
  fgMin: number | null;
  fgMax: number | null;
  ibuMin: number | null;
  ibuMax: number | null;
  srmMin: number | null;
  srmMax: number | null;
  abvMin: number | null;
  abvMax: number | null;
};

export type StyleCategory = {
  key: string;
  label: string;
  categoryNumber: string;
  categoryName: string;
  styles: StyleOption[];
};

export function buildStyleCode(categoryNumber: string, subcategoryLetter: string | null | undefined) {
  return `${categoryNumber}${subcategoryLetter ?? ''}`;
}

export function normalizeAllowedStyleCodes(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index);
}

export function groupStylesByCategory(styles: StyleOption[]): StyleCategory[] {
  const groups = new Map<string, StyleCategory>();

  for (const style of styles) {
    const key = style.categoryNumber;
    const existing = groups.get(key);

    if (existing) {
      existing.styles.push(style);
      continue;
    }

    groups.set(key, {
      key,
      label: `${style.categoryNumber}. ${style.categoryName}`,
      categoryNumber: style.categoryNumber,
      categoryName: style.categoryName,
      styles: [style],
    });
  }

  return Array.from(groups.values())
    .sort((left, right) => left.categoryNumber.localeCompare(right.categoryNumber, undefined, { numeric: true }))
    .map((group) => ({
      ...group,
      styles: [...group.styles].sort((left, right) => left.code.localeCompare(right.code, undefined, { numeric: true })),
    }));
}

export async function getAllBjcpStyles(): Promise<StyleOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bjcp_styles')
    .select(
      'category_number, subcategory_letter, category_name, style_name, description, og_min, og_max, fg_min, fg_max, ibu_min, ibu_max, srm_min, srm_max, abv_min, abv_max',
    )
    .order('category_number', { ascending: true })
    .order('subcategory_letter', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((style) => ({
    code: buildStyleCode(style.category_number, style.subcategory_letter),
    categoryNumber: style.category_number,
    subcategoryLetter: style.subcategory_letter ?? '',
    categoryName: style.category_name,
    styleName: style.style_name,
    description: style.description,
    ogMin: style.og_min,
    ogMax: style.og_max,
    fgMin: style.fg_min,
    fgMax: style.fg_max,
    ibuMin: style.ibu_min,
    ibuMax: style.ibu_max,
    srmMin: style.srm_min,
    srmMax: style.srm_max,
    abvMin: style.abv_min,
    abvMax: style.abv_max,
  }));
}

export async function getBjcpStylesByCodes(codes: string[]) {
  const styleSet = new Set(codes);
  const styles = await getAllBjcpStyles();
  return styles.filter((style) => styleSet.has(style.code));
}