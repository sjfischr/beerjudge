import { createOrInviteMemberAction, toggleAdminAction } from '@/lib/admin-actions';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@/lib/supabase/server';
import { FormSubmitButton } from '@/components/form-submit-button';

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const currentAdmin = await requireAdmin();
  const supabase = await createClient();
  const { data: members, error } = await supabase
    .from('members')
    .select('id, email, display_name, bjcp_rank, is_admin, created_at')
    .order('display_name', { ascending: true, nullsFirst: false })
    .order('email', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const flash = await searchParams;

  return (
    <div className="space-y-6">
      {flash.success ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</p> : null}
      {flash.error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{flash.error}</p> : null}

      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-stone-900">Invite or create member</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          For small clubs, send an invite email or create a ready-to-use account with a temporary password.
        </p>

        <form action={createOrInviteMemberAction} className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <input type="hidden" name="redirect_to" value="/admin/members" />
          <div className="space-y-2">
            <label htmlFor="member-email" className="block text-sm font-medium text-stone-700">
              Email
            </label>
            <input id="member-email" name="email" type="email" required className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-600" />
          </div>
          <div className="space-y-2">
            <label htmlFor="member-display-name" className="block text-sm font-medium text-stone-700">
              Display name
            </label>
            <input id="member-display-name" name="display_name" type="text" className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-600" />
          </div>
          <div className="space-y-2">
            <label htmlFor="member-password" className="block text-sm font-medium text-stone-700">
              Temporary password
            </label>
            <input id="member-password" name="password" type="password" minLength={8} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-600" />
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <input type="checkbox" name="is_admin" />
              Grant admin access
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              name="intent"
              value="invite"
              className="rounded-full border border-stone-300 px-4 py-3 text-sm font-medium text-stone-700 transition hover:border-amber-600 hover:text-amber-700"
            >
              Send invite
            </button>
            <button
              type="submit"
              name="intent"
              value="create"
              className="rounded-full bg-amber-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-800"
            >
              Create user
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-stone-900">Members</h2>
            <p className="mt-2 text-sm text-stone-600">{members?.length ?? 0} club accounts</p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead>
              <tr className="text-left text-stone-500">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Rank</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(members ?? []).map((member) => (
                <tr key={member.id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="font-medium text-stone-900">{member.display_name || 'Unnamed member'}</p>
                    <p className="text-stone-500">{member.email}</p>
                  </td>
                  <td className="px-4 py-4 text-stone-600">{member.bjcp_rank || '—'}</td>
                  <td className="px-4 py-4 text-stone-600">{member.is_admin ? 'Administrator' : 'Member'}</td>
                  <td className="px-4 py-4 text-stone-600">
                    {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(member.created_at))}
                  </td>
                  <td className="px-4 py-4">
                    <form action={toggleAdminAction} className="flex flex-wrap gap-2">
                      <input type="hidden" name="redirect_to" value="/admin/members" />
                      <input type="hidden" name="member_id" value={member.id} />
                      <input type="hidden" name="make_admin" value={member.is_admin ? 'false' : 'true'} />
                      <FormSubmitButton
                        idleText={member.is_admin ? 'Remove admin' : 'Make admin'}
                        pendingText="Saving..."
                        className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-amber-600 hover:text-amber-700 disabled:opacity-70"
                      />
                      {member.id === currentAdmin.id ? <span className="self-center text-xs text-stone-500">Signed in as this user</span> : null}
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}