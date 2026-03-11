'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin } from '@/lib/admin';
import { getAllBjcpStyles } from '@/lib/bjcp';
import { canTransitionCompetitionStatus, isCompetitionStatus } from '@/lib/competition-status';
import { env } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

function buildRedirectUrl(basePath: string, type: 'success' | 'error', message: string) {
  const separator = basePath.includes('?') ? '&' : '?';
  return `${basePath}${separator}${type}=${encodeURIComponent(message)}`;
}

function normalizeRedirectPath(formData: FormData, fallbackPath: string) {
  const redirectTo = String(formData.get('redirect_to') ?? fallbackPath);
  return redirectTo.startsWith('/') ? redirectTo : fallbackPath;
}

export async function toggleAdminAction(formData: FormData) {
  const admin = await requireAdmin();
  const memberId = String(formData.get('member_id') ?? '');
  const makeAdmin = String(formData.get('make_admin') ?? '') === 'true';
  const redirectTo = normalizeRedirectPath(formData, '/admin/members');

  if (!memberId) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Member id is required.'));
  }

  if (admin.id === memberId && !makeAdmin) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'You cannot remove your own admin access.'));
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.from('members').update({ is_admin: makeAdmin }).eq('id', memberId);

  if (error) {
    redirect(buildRedirectUrl(redirectTo, 'error', error.message));
  }

  revalidatePath('/admin/members');
  redirect(buildRedirectUrl(redirectTo, 'success', makeAdmin ? 'Admin access granted.' : 'Admin access removed.'));
}

export async function createOrInviteMemberAction(formData: FormData) {
  await requireAdmin();

  const intent = String(formData.get('intent') ?? 'invite');
  const redirectTo = normalizeRedirectPath(formData, '/admin/members');
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const displayName = String(formData.get('display_name') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const makeAdmin = String(formData.get('is_admin') ?? '') === 'on';

  if (!email) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Email is required.'));
  }

  const adminClient = createAdminClient();

  if (intent === 'create' && password.length < 8) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Created users need a password of at least 8 characters.'));
  }

  let userId: string | null = null;

  if (intent === 'create') {
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName || undefined,
      },
    });

    if (error) {
      redirect(buildRedirectUrl(redirectTo, 'error', error.message));
    }

    userId = data.user?.id ?? null;
  } else {
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${env.siteUrl}/auth/callback`,
      data: {
        display_name: displayName || undefined,
      },
    });

    if (error) {
      redirect(buildRedirectUrl(redirectTo, 'error', error.message));
    }

    userId = data.user?.id ?? null;
  }

  if (userId) {
    const { error: profileError } = await adminClient
      .from('members')
      .update({ display_name: displayName || null, is_admin: makeAdmin })
      .eq('id', userId);

    if (profileError) {
      redirect(buildRedirectUrl(redirectTo, 'error', profileError.message));
    }
  }

  revalidatePath('/admin/members');
  redirect(
    buildRedirectUrl(
      redirectTo,
      'success',
      intent === 'create' ? 'Member account created successfully.' : 'Invitation email sent successfully.',
    ),
  );
}

export async function createCompetitionAction(formData: FormData) {
  const admin = await requireAdmin();
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const judgesPerEntry = Number(String(formData.get('judges_per_entry') ?? '2'));
  const entryDeadline = String(formData.get('entry_deadline') ?? '').trim();
  const judgingDate = String(formData.get('judging_date') ?? '').trim();
  const redirectTo = normalizeRedirectPath(formData, '/admin/competitions/new');
  const allowedStyles = Array.from(
    new Set(formData.getAll('allowed_styles').map((value) => String(value).trim()).filter(Boolean)),
  );

  if (!name) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Competition name is required.'));
  }

  if (!Number.isInteger(judgesPerEntry) || judgesPerEntry < 1 || judgesPerEntry > 10) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Judges per entry must be between 1 and 10.'));
  }

  if (!allowedStyles.length) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Select at least one BJCP style.'));
  }

  const validCodes = new Set((await getAllBjcpStyles()).map((style) => style.code));

  if (allowedStyles.some((styleCode) => !validCodes.has(styleCode))) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'One or more selected styles are invalid.'));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('competitions')
    .insert({
      name,
      description: description || null,
      judges_per_entry: judgesPerEntry,
      entry_deadline: entryDeadline || null,
      judging_date: judgingDate || null,
      allowed_styles: allowedStyles,
      created_by: admin.id,
    })
    .select('id')
    .single();

  if (error || !data) {
    redirect(buildRedirectUrl(redirectTo, 'error', error?.message ?? 'Competition could not be created.'));
  }

  revalidatePath('/');
  revalidatePath('/dashboard');
  revalidatePath('/admin');
  redirect(buildRedirectUrl(`/admin/competitions/${data.id}`, 'success', 'Competition created successfully.'));
}

export async function updateCompetitionStatusAction(formData: FormData) {
  await requireAdmin();

  const competitionId = String(formData.get('competition_id') ?? '');
  const nextStatusValue = String(formData.get('next_status') ?? '');
  const redirectTo = normalizeRedirectPath(formData, `/admin/competitions/${competitionId}`);

  if (!competitionId || !isCompetitionStatus(nextStatusValue)) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Invalid competition status transition request.'));
  }

  const supabase = await createClient();
  const { data: competition, error: competitionError } = await supabase
    .from('competitions')
    .select('status')
    .eq('id', competitionId)
    .maybeSingle();

  if (competitionError || !competition || !isCompetitionStatus(competition.status)) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Competition not found.'));
  }

  if (!canTransitionCompetitionStatus(competition.status, nextStatusValue)) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'That status transition is not allowed.'));
  }

  const { error } = await supabase.from('competitions').update({ status: nextStatusValue }).eq('id', competitionId);

  if (error) {
    redirect(buildRedirectUrl(redirectTo, 'error', error.message));
  }

  revalidatePath('/');
  revalidatePath('/dashboard');
  revalidatePath(`/admin/competitions/${competitionId}`);
  revalidatePath(`/competitions/${competitionId}`);
  redirect(buildRedirectUrl(redirectTo, 'success', 'Competition status updated.'));
}

export async function forceUpdateCompetitionStatusAction(formData: FormData) {
  await requireAdmin();

  const competitionId = String(formData.get('competition_id') ?? '');
  const nextStatusValue = String(formData.get('next_status') ?? '');
  const redirectTo = normalizeRedirectPath(formData, `/admin/competitions/${competitionId}`);

  if (!competitionId || !isCompetitionStatus(nextStatusValue)) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Invalid emergency status override request.'));
  }

  const supabase = await createClient();
  const { error } = await supabase.from('competitions').update({ status: nextStatusValue }).eq('id', competitionId);

  if (error) {
    redirect(buildRedirectUrl(redirectTo, 'error', error.message));
  }

  revalidatePath('/');
  revalidatePath('/dashboard');
  revalidatePath(`/admin/competitions/${competitionId}`);
  revalidatePath(`/competitions/${competitionId}`);
  redirect(buildRedirectUrl(redirectTo, 'success', 'Competition status override applied.'));
}

export async function assignJudgeAction(formData: FormData) {
  await requireAdmin();

  const competitionId = String(formData.get('competition_id') ?? '');
  const entryId = String(formData.get('entry_id') ?? '');
  const judgeId = String(formData.get('judge_id') ?? '');
  const redirectTo = normalizeRedirectPath(formData, `/admin/competitions/${competitionId}`);

  if (!competitionId || !entryId || !judgeId) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Competition, entry, and judge are required.'));
  }

  const supabase = await createClient();
  const [{ data: entry, error: entryError }, { data: existingAssignments, error: assignmentError }] = await Promise.all([
    supabase.from('entries').select('id, brewer_id, competition_id').eq('id', entryId).maybeSingle(),
    supabase.from('judge_assignments').select('judge_id').eq('entry_id', entryId),
  ]);

  if (entryError || !entry || entry.competition_id !== competitionId) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Entry not found for this competition.'));
  }

  if (assignmentError) {
    redirect(buildRedirectUrl(redirectTo, 'error', assignmentError.message));
  }

  if (entry.brewer_id === judgeId) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Judges cannot be assigned to their own entries.'));
  }

  if ((existingAssignments ?? []).some((assignment) => assignment.judge_id === judgeId)) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'That judge is already assigned to this entry.'));
  }

  const { error } = await supabase.from('judge_assignments').insert({
    competition_id: competitionId,
    entry_id: entryId,
    judge_id: judgeId,
  });

  if (error) {
    redirect(buildRedirectUrl(redirectTo, 'error', error.message));
  }

  revalidatePath(`/admin/competitions/${competitionId}`);
  revalidatePath(`/dashboard`);
  redirect(buildRedirectUrl(redirectTo, 'success', 'Judge assigned successfully.'));
}

export async function removeJudgeAssignmentAction(formData: FormData) {
  await requireAdmin();

  const assignmentId = String(formData.get('assignment_id') ?? '');
  const competitionId = String(formData.get('competition_id') ?? '');
  const redirectTo = normalizeRedirectPath(formData, `/admin/competitions/${competitionId}`);

  if (!assignmentId) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Assignment id is required.'));
  }

  const supabase = await createClient();
  const { error } = await supabase.from('judge_assignments').delete().eq('id', assignmentId);

  if (error) {
    redirect(buildRedirectUrl(redirectTo, 'error', error.message));
  }

  revalidatePath(`/admin/competitions/${competitionId}`);
  revalidatePath('/dashboard');
  redirect(buildRedirectUrl(redirectTo, 'success', 'Judge assignment removed.'));
}

export async function autoAssignJudgesAction(formData: FormData) {
  await requireAdmin();

  const competitionId = String(formData.get('competition_id') ?? '');
  const redirectTo = normalizeRedirectPath(formData, `/admin/competitions/${competitionId}`);

  if (!competitionId) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Competition id is required.'));
  }

  const supabase = await createClient();
  const [{ data: competition, error: competitionError }, { data: entries, error: entryError }, { data: members, error: memberError }, { data: existingAssignments, error: assignmentError }] =
    await Promise.all([
      supabase.from('competitions').select('id, judges_per_entry').eq('id', competitionId).maybeSingle(),
      supabase.from('entries').select('id, brewer_id, entry_number').eq('competition_id', competitionId).order('entry_number', { ascending: true }),
      supabase.from('members').select('id, display_name, email'),
      supabase.from('judge_assignments').select('entry_id, judge_id').eq('competition_id', competitionId),
    ]);

  if (competitionError || !competition) {
    redirect(buildRedirectUrl(redirectTo, 'error', 'Competition not found.'));
  }

  if (entryError || memberError || assignmentError) {
    redirect(buildRedirectUrl(redirectTo, 'error', entryError?.message ?? memberError?.message ?? assignmentError?.message ?? 'Auto-assignment failed.'));
  }

  const assignmentMap = new Map<string, Set<string>>();
  const loadMap = new Map<string, number>();

  for (const member of members ?? []) {
    loadMap.set(member.id, 0);
  }

  for (const assignment of existingAssignments ?? []) {
    const assignedJudges = assignmentMap.get(assignment.entry_id) ?? new Set<string>();
    assignedJudges.add(assignment.judge_id);
    assignmentMap.set(assignment.entry_id, assignedJudges);
    loadMap.set(assignment.judge_id, (loadMap.get(assignment.judge_id) ?? 0) + 1);
  }

  const inserts: Array<{ competition_id: string; entry_id: string; judge_id: string }> = [];

  for (const entry of entries ?? []) {
    const assignedJudges = assignmentMap.get(entry.id) ?? new Set<string>();

    while (assignedJudges.size < competition.judges_per_entry) {
      const eligibleJudges = (members ?? [])
        .filter((member) => member.id !== entry.brewer_id && !assignedJudges.has(member.id))
        .sort((left, right) => {
          const loadDifference = (loadMap.get(left.id) ?? 0) - (loadMap.get(right.id) ?? 0);

          if (loadDifference !== 0) {
            return loadDifference;
          }

          return (left.display_name ?? left.email).localeCompare(right.display_name ?? right.email);
        });

      const nextJudge = eligibleJudges[0];

      if (!nextJudge) {
        break;
      }

      inserts.push({
        competition_id: competitionId,
        entry_id: entry.id,
        judge_id: nextJudge.id,
      });
      assignedJudges.add(nextJudge.id);
      loadMap.set(nextJudge.id, (loadMap.get(nextJudge.id) ?? 0) + 1);
      assignmentMap.set(entry.id, assignedJudges);
    }
  }

  if (inserts.length) {
    const { error } = await supabase.from('judge_assignments').insert(inserts);

    if (error) {
      redirect(buildRedirectUrl(redirectTo, 'error', error.message));
    }
  }

  revalidatePath(`/admin/competitions/${competitionId}`);
  revalidatePath('/dashboard');
  redirect(
    buildRedirectUrl(
      redirectTo,
      'success',
      inserts.length ? `Auto-assigned ${inserts.length} judge assignments.` : 'No new assignments were needed.',
    ),
  );
}