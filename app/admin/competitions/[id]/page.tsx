import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ConfirmSubmitButton } from '@/components/confirm-submit-button';
import { FormSubmitButton } from '@/components/form-submit-button';
import {
  assignJudgeAction,
  autoAssignJudgesAction,
  forceUpdateCompetitionStatusAction,
  removeJudgeAssignmentAction,
  updateCompetitionStatusAction,
} from '@/lib/admin-actions';
import { requireAdmin } from '@/lib/admin';
import { formatCompetitionStatus, competitionStatusTransitions, isCompetitionStatus } from '@/lib/competition-status';
import { createClient } from '@/lib/supabase/server';

export default async function AdminCompetitionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const flash = await searchParams;
  const supabase = await createClient();

  const [{ data: competition, error: competitionError }, { data: entries, error: entryError }, { data: assignments, error: assignmentError }, { data: members, error: memberError }] =
    await Promise.all([
      supabase
        .from('competitions')
        .select('id, name, description, status, judges_per_entry, entry_deadline, judging_date, allowed_styles')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('entries')
        .select('id, brewer_id, entry_number, bjcp_category, bjcp_subcategory, bjcp_style_name, special_ingredients')
        .eq('competition_id', id)
        .order('entry_number', { ascending: true }),
      supabase.from('judge_assignments').select('id, entry_id, judge_id').eq('competition_id', id),
      supabase.from('members').select('id, email, display_name').order('display_name', { ascending: true, nullsFirst: false }).order('email', { ascending: true }),
    ]);

  if (competitionError || !competition || !isCompetitionStatus(competition.status)) {
    notFound();
  }

  if (entryError || assignmentError || memberError) {
    throw new Error(entryError?.message ?? assignmentError?.message ?? memberError?.message ?? 'Competition details could not be loaded.');
  }

  const memberMap = new Map((members ?? []).map((member) => [member.id, member]));
  const assignmentsByEntry = new Map<string, Array<{ id: string; judge_id: string }>>();

  for (const assignment of assignments ?? []) {
    const existing = assignmentsByEntry.get(assignment.entry_id) ?? [];
    existing.push(assignment);
    assignmentsByEntry.set(assignment.entry_id, existing);
  }

  const nextStatuses = competitionStatusTransitions[competition.status];

  return (
    <div className="space-y-6">
      {flash.success ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</p> : null}
      {flash.error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{flash.error}</p> : null}

      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Competition detail</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">{competition.name}</h2>
            <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">{competition.description || 'No competition description provided.'}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/competitions/${competition.id}`} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-amber-600 hover:text-amber-700">
              Public page
            </Link>
            <Link href={`/competitions/${competition.id}/enter`} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-amber-600 hover:text-amber-700">
              Create admin entry
            </Link>
            <Link href={`/admin/competitions/${competition.id}/scores`} className="rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800">
              Scores overview
            </Link>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 text-sm text-stone-600 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <dt className="font-medium text-stone-900">Status</dt>
            <dd>{formatCompetitionStatus(competition.status)}</dd>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <dt className="font-medium text-stone-900">Judges per entry</dt>
            <dd>{competition.judges_per_entry}</dd>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <dt className="font-medium text-stone-900">Entry deadline</dt>
            <dd>{competition.entry_deadline ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(competition.entry_deadline)) : '—'}</dd>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <dt className="font-medium text-stone-900">Judging date</dt>
            <dd>{competition.judging_date ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(competition.judging_date)) : '—'}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          {nextStatuses.map((status) => (
            <form action={updateCompetitionStatusAction} key={status}>
              <input type="hidden" name="competition_id" value={competition.id} />
              <input type="hidden" name="next_status" value={status} />
              <input type="hidden" name="redirect_to" value={`/admin/competitions/${competition.id}`} />
              <ConfirmSubmitButton
                idleText={`Move to ${formatCompetitionStatus(status)}`}
                pendingText="Updating..."
                confirmMessage={`Change competition status to ${formatCompetitionStatus(status)}?`}
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-amber-600 hover:text-amber-700 disabled:opacity-70"
              />
            </form>
          ))}
          {!nextStatuses.length ? <p className="self-center text-sm text-stone-500">No further status transitions are available.</p> : null}
        </div>

        <div className="glass-panel-strong mt-6 rounded-3xl border border-amber-200 p-5 text-sm text-stone-700">
          <p className="font-semibold text-stone-900">Emergency flexibility</p>
          <p className="mt-2 leading-6 text-stone-600">
            If a live competition needs a manual recovery path, admins can force a status change and continue working.
          </p>
          <form action={forceUpdateCompetitionStatusAction} className="mt-4 flex flex-wrap items-end gap-3">
            <input type="hidden" name="competition_id" value={competition.id} />
            <input type="hidden" name="redirect_to" value={`/admin/competitions/${competition.id}`} />
            <div className="min-w-56 space-y-2">
              <label htmlFor="override-status" className="block text-sm font-medium text-stone-700">
                Force status
              </label>
              <select id="override-status" name="next_status" defaultValue={competition.status} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-600">
                {Object.entries({
                  setup: 'Setup',
                  accepting_entries: 'Accepting entries',
                  judging: 'Judging',
                  closed: 'Closed',
                  archived: 'Archived',
                }).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <ConfirmSubmitButton
              idleText="Apply override"
              pendingText="Applying..."
              confirmMessage="Force this competition to the selected status? Use only when recovering from an operational issue."
              className="rounded-full border border-amber-300 px-4 py-3 text-sm font-semibold text-amber-900 transition hover:border-amber-500 hover:text-amber-950 disabled:opacity-70"
            />
          </form>
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-stone-900">Entries and assignments</h2>
            <p className="mt-2 text-sm text-stone-600">Assign judges without exposing brewer identities outside the admin view.</p>
          </div>
          <form action={autoAssignJudgesAction}>
            <input type="hidden" name="competition_id" value={competition.id} />
            <input type="hidden" name="redirect_to" value={`/admin/competitions/${competition.id}`} />
            <ConfirmSubmitButton
              idleText="Auto-assign judges"
              pendingText="Assigning..."
              confirmMessage="Auto-assign judges for all entries with the lowest-current-load rule?"
              className="rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:opacity-70"
            />
          </form>
        </div>

        <div className="mt-6 space-y-4">
          {(entries ?? []).map((entry) => {
            const brewer = memberMap.get(entry.brewer_id);
            const assignedJudges = assignmentsByEntry.get(entry.id) ?? [];
            const eligibleJudges = (members ?? []).filter(
              (member) => member.id !== entry.brewer_id && !assignedJudges.some((assignment) => assignment.judge_id === member.id),
            );

            return (
              <div key={entry.id} className="rounded-3xl border border-stone-200 bg-stone-50 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Entry #{entry.entry_number}</p>
                    <h3 className="mt-2 text-xl font-semibold text-stone-900">
                      {entry.bjcp_category}{entry.bjcp_subcategory}. {entry.bjcp_style_name}
                    </h3>
                    <p className="mt-2 text-sm text-stone-600">Brewer: {brewer?.display_name || brewer?.email || 'Unknown member'}</p>
                    {entry.special_ingredients ? <p className="mt-1 text-sm text-stone-500">Special ingredients: {entry.special_ingredients}</p> : null}
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                    Assigned judges: {assignedJudges.length} / {competition.judges_per_entry}
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {assignedJudges.length ? (
                    assignedJudges.map((assignment) => {
                      const judge = memberMap.get(assignment.judge_id);

                      return (
                        <div key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                          <span>{judge?.display_name || judge?.email || 'Unknown judge'}</span>
                          <form action={removeJudgeAssignmentAction}>
                            <input type="hidden" name="assignment_id" value={assignment.id} />
                            <input type="hidden" name="competition_id" value={competition.id} />
                            <input type="hidden" name="redirect_to" value={`/admin/competitions/${competition.id}`} />
                            <FormSubmitButton
                              idleText="Remove"
                              pendingText="Removing..."
                              className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-red-400 hover:text-red-600 disabled:opacity-70"
                            />
                          </form>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-stone-500">No judges assigned yet.</p>
                  )}
                </div>

                <form action={assignJudgeAction} className="mt-5 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="competition_id" value={competition.id} />
                  <input type="hidden" name="entry_id" value={entry.id} />
                  <input type="hidden" name="redirect_to" value={`/admin/competitions/${competition.id}`} />
                  <div className="min-w-64 flex-1 space-y-2">
                    <label htmlFor={`judge-${entry.id}`} className="block text-sm font-medium text-stone-700">
                      Assign judge
                    </label>
                    <select id={`judge-${entry.id}`} name="judge_id" className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-600">
                      <option value="">Select a judge</option>
                      {eligibleJudges.map((judge) => (
                        <option key={judge.id} value={judge.id}>
                          {judge.display_name || judge.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <FormSubmitButton
                    idleText="Assign judge"
                    pendingText="Assigning..."
                    className="rounded-full bg-amber-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:opacity-70"
                  />
                </form>
              </div>
            );
          })}

          {!entries?.length ? <p className="text-sm text-stone-600">No entries have been submitted for this competition yet.</p> : null}
        </div>
      </section>
    </div>
  );
}