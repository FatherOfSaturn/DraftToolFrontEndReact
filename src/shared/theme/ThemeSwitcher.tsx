import { useEffect, useRef, useState } from 'react';
import { useTheme, type ThemeDefinition } from './ThemeContext';

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const groups: Array<{ label: string; items: ThemeDefinition[] }> = [
    { label: 'Dark', items: themes.filter((t) => t.group === 'dark') },
    { label: 'Light', items: themes.filter((t) => t.group === 'light') },
  ];

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="Change theme"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-surface-container-highest/50 transition-colors"
      >
        <span className="material-symbols-outlined text-on-surface text-[24px]">palette</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container-high border border-outline-variant/30 rounded-xl shadow-xl z-50 py-2">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="px-4 pt-2 pb-1 font-label-sm text-label-sm text-on-surface-variant">
                {group.label}
              </div>
              {group.items.map((t) => {
                const active = t.id === theme;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTheme(t.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left font-label-md text-label-md transition-colors ${
                      active
                        ? 'text-primary'
                        : 'text-on-surface hover:bg-surface-container-highest/50'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border"
                      style={{
                        background: 'var(--color-background)',
                        borderColor: active ? 'var(--color-primary)' : 'var(--color-outline-variant)',
                      }}
                    />
                    <span className="flex-grow">{t.name}</span>
                    {active && <span className="material-symbols-outlined text-[18px]">check</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
