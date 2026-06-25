import { useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';

import { getThemeColors } from '@/constants/theme';

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    console.warn('[useAppTheme] must be used within ThemeProvider. Returning fallback.');
    return {
      mode: 'dark' as const,
      colors: getThemeColors('dark'),
      toggleTheme: () => {},
      setMode: () => {},
    };
  }
  return ctx;
}
