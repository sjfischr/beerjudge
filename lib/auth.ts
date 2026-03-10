import { cache } from 'react';

import { createClient } from '@/lib/supabase/server';

export type MemberProfile = {
  id: string;
  email: string;
  display_name: string | null;
  is_admin: boolean;
};

export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

export const getMemberProfile = cache(async (): Promise<MemberProfile | null> => {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('members')
    .select('id, email, display_name, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    return {
      id: user.id,
      email: user.email ?? '',
      display_name: user.user_metadata?.display_name ?? null,
      is_admin: false,
    };
  }

  return data;
});
