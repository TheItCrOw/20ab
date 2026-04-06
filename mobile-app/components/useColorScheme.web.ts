import { useAppTheme } from '@/contexts/ThemeContext';

/** Web override — still reads from ThemeContext so user preference is respected. */
export function useColorScheme(): 'light' | 'dark' {
  return useAppTheme().colorScheme;
}
