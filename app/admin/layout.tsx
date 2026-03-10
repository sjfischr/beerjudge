import Link from 'next/link';

import { requireAdmin } from '@/lib/admin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">Admin</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">Competition operations</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Manage members, create competitions, assign judges, and monitor scoring progress.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium">
          <Link href="/admin" className="rounded-full border border-stone-300 px-4 py-2 text-stone-700 transition hover:border-amber-600 hover:text-amber-700">
            Admin home
          </Link>
          <Link href="/admin/members" className="rounded-full border border-stone-300 px-4 py-2 text-stone-700 transition hover:border-amber-600 hover:text-amber-700">
            Members
          </Link>
          <Link href="/admin/competitions/new" className="rounded-full border border-stone-300 px-4 py-2 text-stone-700 transition hover:border-amber-600 hover:text-amber-700">
            New competition
          </Link>
        </div>
      </section>
      {children}
    </div>
  );
}