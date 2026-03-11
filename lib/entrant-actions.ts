'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getMemberProfile, getSessionUser } from '@/lib/auth';
import { getBjcpStylesByCodes, normalizeAllowedStyleCodes } from '@/lib/bjcp';
import { createClient } from '@/lib/supabase/server';

function buildRedirectUrl(basePath: string, type: 'success' | 'error', message: string, entryNumber?: number) {
  const params = new URLSearchParams();
  params.set(type, message);

  if (entryNumber !== undefined) {
    params.set('entry', String(entryNumber));
  }

  return `${basePath}?${params.toString()}`;
}

export async function createEntryAction(formData: FormData) {
  const user = await getSessionUser();
  const member = await getMemberProfile();

  if (!user) {
    redirect('/login');
  }

  const competitionId = String(formData.get('competition_id') ?? '');
  const styleCode = String(formData.get('style_code') ?? '').trim();
  const specialIngredients = String(formData.get('special_ingredients') ?? '').trim();
  const redirectTo = `/competitions/${competitionId}/enter`;

  if (!competitionId || !styleCode) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Competition and style selection are required.'));
  }

  const supabase = await createClient();
  const { data: competition, error: competitionError } = await supabase
    .from('competitions')
    .select('id, status, allowed_styles')
    .eq('id', competitionId)
    .maybeSingle();

  if (competitionError || !competition) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Competition not found.'));
  }

  if (competition.status !== 'accepting_entries' && !member?.is_admin) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'This competition is not accepting entries right now.'));
  }

  const allowedStyles = normalizeAllowedStyleCodes(competition.allowed_styles);

  if (!allowedStyles.includes(styleCode)) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Selected style is not available for this competition.'));
  }

  const matchingStyles = await getBjcpStylesByCodes([styleCode]);
  const selectedStyle = matchingStyles[0];

  if (!selectedStyle) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Style reference data could not be found.'));
  }

  const { data, error } = await supabase
    .from('entries')
    .insert({
      competition_id: competitionId,
      brewer_id: user.id,
      bjcp_category: selectedStyle.categoryNumber,
      bjcp_subcategory: selectedStyle.subcategoryLetter,
      bjcp_style_name: selectedStyle.styleName,
      special_ingredients: specialIngredients || null,
    })
    .select('entry_number')
    .single();

  if (error || !data) {
    redirect(buildRedirectUrl(redirectTo, 'error', error?.message ?? 'Entry could not be created.'));
  }

  revalidatePath('/dashboard');
  revalidatePath(`/competitions/${competitionId}`);
  revalidatePath(`/competitions/${competitionId}/enter`);
  revalidatePath(`/admin/competitions/${competitionId}`);
  redirect(buildRedirectUrl(redirectTo, 'success', 'Entry submitted successfully.', data.entry_number));
}