'use client';
import { useEffect, useState } from 'react';

const THEMES = ['theme-light', 'theme-dark', 'theme-dracula'] as const;
type Theme = (typeof THEMES)[number];
const STORAGE_KEY = 'highlight-demo-theme';

function isTheme(x: string): x is Theme {
  return (THEMES as readonly string[]).includes(x);
}

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('theme-light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = document.documentElement.className;
    if (isTheme(current)) setTheme(current);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    for (const t of THEMES) root.classList.remove(t);
    root.classList.add(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  return (
    <select
      className="theme"
      value={theme}
      onChange={(e) => setTheme(e.target.value as Theme)}
      aria-label="Theme"
      suppressHydrationWarning
    >
      <option value="theme-light">Light</option>
      <option value="theme-dark">Dark</option>
      <option value="theme-dracula">Dracula</option>
    </select>
  );
}
