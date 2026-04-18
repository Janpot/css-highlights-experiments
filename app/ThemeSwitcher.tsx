'use client';
import { useEffect, useState } from 'react';

const THEMES = ['theme-light', 'theme-dark', 'theme-dracula'] as const;
type Theme = (typeof THEMES)[number];
const STORAGE_KEY = 'highlight-demo-theme';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('theme-light');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (THEMES as readonly string[]).includes(saved)) {
      setTheme(saved as Theme);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    for (const t of THEMES) root.classList.remove(t);
    root.classList.add(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <select
      className="theme"
      value={theme}
      onChange={(e) => setTheme(e.target.value as Theme)}
      aria-label="Theme"
    >
      <option value="theme-light">Light</option>
      <option value="theme-dark">Dark</option>
      <option value="theme-dracula">Dracula</option>
    </select>
  );
}
