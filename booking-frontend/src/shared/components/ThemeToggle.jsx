import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme/useTheme';

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="theme-toggle"
      aria-label={isDark ? 'Chuyển sang light mode' : 'Chuyển sang dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <span className="icon-wrap" key={isDark ? 'dark' : 'light'}>
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </span>
    </button>
  );
}
