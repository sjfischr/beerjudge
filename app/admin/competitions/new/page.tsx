import { FormSubmitButton } from '@/components/form-submit-button';
import { StyleSelector } from '@/components/style-selector';
import { createCompetitionAction } from '@/lib/admin-actions';
import { requireAdmin } from '@/lib/admin';
import { getAllBjcpStyles, groupStylesByCategory } from '@/lib/bjcp';

export default async function NewCompetitionPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  await requireAdmin();

  const categories = groupStylesByCategory(await getAllBjcpStyles());
  const flash = await searchParams;

  return (
    <div className="space-y-6">
      {flash.success ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</p> : null}
      {flash.error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{flash.error}</p> : null}

      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-stone-900">Create competition</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Publish a new competition and decide which BJCP styles are eligible.
        </p>

        <form action={createCompetitionAction} className="mt-6 space-y-6">
          <input type="hidden" name="redirect_to" value="/admin/competitions/new" />
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="competition-name" className="block text-sm font-medium text-stone-700">
                Competition name
              </label>
              <input id="competition-name" name="name" required className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-600" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="competition-description" className="block text-sm font-medium text-stone-700">
                Description
              </label>
              <textarea id="competition-description" name="description" rows={4} className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-600" />
            </div>

            <div className="space-y-2">
              <label htmlFor="judges-per-entry" className="block text-sm font-medium text-stone-700">
                Judges per entry
              </label>
              <input id="judges-per-entry" name="judges_per_entry" type="number" min={1} max={10} defaultValue={2} required className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-600" />
            </div>

            <div className="space-y-2">
              <label htmlFor="entry-deadline" className="block text-sm font-medium text-stone-700">
                Entry deadline
              </label>
              <input id="entry-deadline" name="entry_deadline" type="datetime-local" className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-600" />
            </div>

            <div className="space-y-2">
              <label htmlFor="judging-date" className="block text-sm font-medium text-stone-700">
                Judging date
              </label>
              <input id="judging-date" name="judging_date" type="date" className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-600" />
            </div>
          </div>

          <StyleSelector categories={categories} />

          <FormSubmitButton
            idleText="Create competition"
            pendingText="Creating competition..."
            className="rounded-full bg-amber-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:opacity-70"
          />
        </form>
      </section>
    </div>
  );
}