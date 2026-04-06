import { useAppTheme } from '@/contexts/ThemeContext';

/** Returns the active color scheme, respecting any manual user override. */
export function useColorScheme(): 'light' | 'dark' {
  return useAppTheme().colorScheme;
}
