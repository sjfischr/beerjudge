const requiredClientEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;

function normalizeUrl(value: string | undefined, fallback = '') {
  return (value ?? fallback).trim().replace(/\/$/, '');
}

for (const key of requiredClientEnv) {
  if (!process.env[key]) {
    console.warn(`Missing environment variable: ${key}`);
  }
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  siteUrl: normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL, 'https://gristbrewingcomp.vercel.app'),
};

export function assertServerEnv() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured.');
  }
}
