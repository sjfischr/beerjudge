'use client';

import { useEffect, useState } from 'react';

type ThemePreference = 'system' | 'light' | 'dark';

function applyThemePreference(preference: ThemePreference) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolvedTheme = preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference;

  root.dataset.themePreference = preference;
  root.dataset.theme = resolvedTheme;
}

export function ThemeToggle() {
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');

  useEffect(() => {
    const storedPreference = window.localStorage.getItem('brewjudge-theme');
    const nextPreference: ThemePreference =
      storedPreference === 'light' || storedPreference === 'dark' || storedPreference === 'system'
        ? storedPreference
        : 'system';

    setThemePreference(nextPreference);
    applyThemePreference(nextPreference);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const preference = (document.documentElement.dataset.themePreference as ThemePreference | undefined) ?? 'system';
      if (preference === 'system') {
        applyThemePreference('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  function handleChange(nextPreference: ThemePreference) {
    setThemePreference(nextPreference);
    window.localStorage.setItem('brewjudge-theme', nextPreference);
    applyThemePreference(nextPreference);
  }

  return (
    <label className="theme-toggle-shell" aria-label="Theme selector">
      <span className="theme-toggle-icon" aria-hidden="true">
        ✦
      </span>
      <select
        value={themePreference}
        onChange={(event) => handleChange(event.target.value as ThemePreference)}
        className="theme-toggle-select"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}