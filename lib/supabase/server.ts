import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { assertServerEnv, env } from '@/lib/env';

type CookieMutation = {
  name: string;
  value: string;
  options?: Parameters<Awaited<ReturnType<typeof cookies>>['set']>[2];
};

export async function createClient() {
  assertServerEnv();

  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieMutation[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components may attempt to set cookies during render.
        }
      },
    },
  });
}
