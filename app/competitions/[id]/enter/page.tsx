import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { EntryStylePicker } from '@/components/entry-style-picker';
import { FormSubmitButton } from '@/components/form-submit-button';
import { getMemberProfile } from '@/lib/auth';
import { getBjcpStylesByCodes, groupStylesByCategory } from '@/lib/bjcp';
import { getCompetitionById } from '@/lib/competitions';
import { createEntryAction } from '@/lib/entrant-actions';

export default async function CompetitionEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string; entry?: string }>;
}) {
  const member = await getMemberProfile();

  if (!member) {
    redirect('/login');
  }

  const { id } = await params;
  const competition = await getCompetitionById(id);

  if (!competition) {
    notFound();
  }

  if (competition.status !== 'accepting_entries') {
    redirect(`/competitions/${competition.id}`);
  }

  const styles = await getBjcpStylesByCodes(competition.allowed_styles ?? []);
  const categories = groupStylesByCategory(styles);
  const flash = await searchParams;

  return (
    <div className="space-y-6">
      {flash.success ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {flash.success} {flash.entry ? `Your assigned entry number is #${flash.entry}.` : ''}
        </p>
      ) : null}
      {flash.error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{flash.error}</p> : null}

      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Submit entry</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">{competition.name}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
              Choose from the competition’s allowed BJCP styles and submit your entry for blind judging.
            </p>
          </div>
          <Link href={`/competitions/${competition.id}`} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-amber-600 hover:text-amber-700">
            Back to competition
          </Link>
        </div>

        <form action={createEntryAction} className="mt-6 space-y-6">
          <input type="hidden" name="competition_id" value={competition.id} />

          <EntryStylePicker categories={categories} />

          <div className="space-y-2">
            <label htmlFor="special-ingredients" className="block text-sm font-medium text-stone-700">
              Special ingredients
            </label>
            <textarea
              id="special-ingredients"
              name="special_ingredients"
              rows={3}
              placeholder="Optional — list fruit, spices, wood, or other special ingredients."
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-600"
            />
          </div>

          <FormSubmitButton
            idleText="Submit entry"
            pendingText="Submitting entry..."
            className="rounded-full bg-amber-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-800 disabled:opacity-70"
          />
        </form>
      </section>
    </div>
  );
}