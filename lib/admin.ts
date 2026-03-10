import { redirect } from 'next/navigation';

import { getMemberProfile } from '@/lib/auth';

export async function requireAdmin() {
  const member = await getMemberProfile();

  if (!member) {
    redirect('/login');
  }

  if (!member.is_admin) {
    redirect('/dashboard');
  }

  return member;
}