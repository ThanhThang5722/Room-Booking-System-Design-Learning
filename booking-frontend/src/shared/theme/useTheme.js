import { create } from 'zustand';

const STORAGE_KEY = 'booking-theme';

/**
 * Đọc theme đã được set bởi inline script trong index.html.
 * Nếu chưa có (lần đầu visit), fallback theo prefers-color-scheme.
 */
const initialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') ?? 'light';
};

export const useThemeStore = create((set, get) => ({
  theme: initialTheme(),
  toggle: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch (_) {}
    set({ theme: next });
  },
  setTheme: (t) => {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch (_) {}
    set({ theme: t });
  },
}));

export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  return { theme, toggle, isDark: theme === 'dark' };
}
