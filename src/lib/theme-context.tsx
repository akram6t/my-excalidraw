'use client';

import {
  createContext,
  useContext,
  useCallback,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  themes: Theme[];
}

const STORAGE_KEY = 'theme';
const DEFAULT_THEME: Theme = 'light';

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  resolvedTheme: 'light',
  setTheme: () => {},
  themes: ['light', 'dark', 'system'],
});

// ── External store: read theme from localStorage ──

function subscribeToStorage(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('theme-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('theme-change', callback);
  };
}

function getStorageSnapshot(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // private browsing, etc.
  }
  return DEFAULT_THEME;
}

function getStorageServerSnapshot(): Theme {
  return DEFAULT_THEME;
}

// ── External store: read system color scheme preference ──

function subscribeToMediaQuery(callback: () => void) {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getMediaSnapshot(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getMediaServerSnapshot(): ResolvedTheme {
  return 'light';
}

// ── Apply theme class to <html> ──

function applyThemeToDOM(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

// ── Provider ──

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Read stored preference from localStorage (cross-tab sync via storage event)
  const theme = useSyncExternalStore(
    subscribeToStorage,
    getStorageSnapshot,
    getStorageServerSnapshot,
  );

  // Read system preference (auto-updates when OS changes)
  const systemPreference = useSyncExternalStore(
    subscribeToMediaQuery,
    getMediaSnapshot,
    getMediaServerSnapshot,
  );

  // Derive resolved theme
  const resolvedTheme: ResolvedTheme = useMemo(
    () => (theme === 'system' ? systemPreference : theme),
    [theme, systemPreference],
  );

  // Apply to DOM synchronously before paint (no FOUC after hydration)
  useLayoutEffect(() => {
    applyThemeToDOM(resolvedTheme);
  }, [resolvedTheme]);

  // Persist and notify when user changes theme
  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // ignore
    }
    // Dispatch custom event so useSyncExternalStore re-reads
    window.dispatchEvent(new Event('theme-change'));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme, themes: ['light', 'dark', 'system'] }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ── Hook ──

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
