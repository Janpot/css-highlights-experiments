'use client';

const THEMES = ['theme-light', 'theme-dark', 'theme-dracula'] as const;
type Theme = (typeof THEMES)[number];
const STORAGE_KEY = 'highlight-demo-theme';

const LABELS: Record<Theme, string> = {
  'theme-light': 'Light',
  'theme-dark': 'Dark',
  'theme-dracula': 'Dracula',
};

export default function ThemeSwitcher() {
  return (
    <div className="theme-switcher" role="radiogroup" aria-label="Theme">
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          data-theme={t}
          aria-label={LABELS[t]}
          onClick={() => {
            const root = document.documentElement;
            for (const x of THEMES) root.classList.remove(x);
            root.classList.add(t);
            try {
              localStorage.setItem(STORAGE_KEY, t);
            } catch {
              /* ignore */
            }
          }}
        >
          {LABELS[t]}
        </button>
      ))}
    </div>
  );
}
