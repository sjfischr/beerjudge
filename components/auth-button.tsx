import Link from 'next/link';

import { signOutAction } from '@/lib/auth-actions';
import type { MemberProfile } from '@/lib/auth';

type AuthButtonProps = {
  member: MemberProfile | null;
};

export function AuthButton({ member }: AuthButtonProps) {
  if (!member) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-800"
      >
        Login
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className="text-sm font-semibold text-stone-900">{member.display_name || member.email}</p>
        <p className="text-xs text-stone-500">{member.is_admin ? 'Administrator' : 'Club member'}</p>
      </div>
      <form action={signOutAction}>
        <button
          type="submit"
          className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-amber-600 hover:text-amber-700"
        >
          Logout
        </button>
      </form>
    </div>
  );
}
