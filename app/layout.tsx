import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';

import './globals.css';

import { AuthButton } from '@/components/auth-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { getMemberProfile } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'BrewJudge',
  description: 'Blind judging and digital BJCP-style scoresheets for club competitions.',
};

const themeBootstrapScript = `
(() => {
  try {
    const storedPreference = window.localStorage.getItem('brewjudge-theme') || 'system';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolvedTheme = storedPreference === 'system' ? (prefersDark ? 'dark' : 'light') : storedPreference;
    document.documentElement.dataset.themePreference = storedPreference;
    document.documentElement.dataset.theme = resolvedTheme;
  } catch (error) {
    document.documentElement.dataset.themePreference = 'system';
    document.documentElement.dataset.theme = 'light';
  }
})();
`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const member = await getMemberProfile();

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrapScript}
        </Script>
        <div className="page-shell min-h-screen">
          <header className="glass-header border-b border-stone-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
              <div>
                <Link href="/" className="text-2xl font-semibold tracking-tight text-stone-900">
                  BrewJudge
                </Link>
                <p className="text-sm text-stone-500">GRiST competition platform</p>
              </div>
              <nav className="flex items-center gap-6">
                <div className="hidden gap-4 text-sm font-medium text-stone-600 md:flex">
                  <Link href="/" className="transition hover:text-amber-700">
                    Home
                  </Link>
                  <Link href="/competitions/history" className="transition hover:text-amber-700">
                    History
                  </Link>
                  {member ? (
                    <Link href="/dashboard" className="transition hover:text-amber-700">
                      Dashboard
                    </Link>
                  ) : null}
                  {member?.is_admin ? (
                    <Link href="/admin" className="transition hover:text-amber-700">
                      Admin
                    </Link>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <ThemeToggle />
                  <AuthButton member={member} />
                </div>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
