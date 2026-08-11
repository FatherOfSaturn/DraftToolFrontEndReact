import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type ThemeGroup = 'dark' | 'light';

export interface ThemeDefinition {
  id: string;
  name: string;
  group: ThemeGroup;
}

export const THEMES: ThemeDefinition[] = [
  { id: 'arcane', name: 'Arcane', group: 'dark' },
  { id: 'grimoire-night', name: 'Aetheric Grimoire Night', group: 'dark' },
  { id: 'celestial-aetheric', name: 'Celestial Aetheric', group: 'light' },
  { id: 'grimoire-parchment', name: 'Aetheric Grimoire Parchment', group: 'light' },
];

export const DEFAULT_THEME = THEMES[0].id;

const THEME_STORAGE_KEY = 'draft-tool.theme';

function getStoredTheme(): string {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && THEMES.some((t) => t.id === stored)) return stored;
  } catch {
    // localStorage unavailable — fall back to default
  }
  return DEFAULT_THEME;
}

interface ThemeContextValue {
  theme: string;
  setTheme: (theme: string) => void;
  themes: ThemeDefinition[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<string>(() => {
    const initial = getStoredTheme();
    document.documentElement.dataset.theme = initial;
    return initial;
  });

  const setTheme = useCallback((next: string) => {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore storage failures
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
