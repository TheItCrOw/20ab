import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppColorScheme = 'light' | 'dark';

interface ThemeContextValue {
  colorScheme: AppColorScheme;
  /** Explicitly toggle to light or dark, persisted to storage. */
  setColorScheme: (scheme: AppColorScheme) => void;
  /** Whether the user has set a manual preference (vs following system). */
  isManual: boolean;
  /** Revert to following the system setting. */
  resetToSystem: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: 'dark',
  setColorScheme: () => {},
  isManual: false,
  resetToSystem: () => {},
});

const STORAGE_KEY = 'user_theme_preference';

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = (useSystemColorScheme() ?? 'dark') as AppColorScheme;
  const [manualScheme, setManualScheme] = useState<AppColorScheme | null>(null);
  const [ready, setReady] = useState(false);

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setManualScheme(stored);
      }
      setReady(true);
    });
  }, []);

  const colorScheme: AppColorScheme = manualScheme ?? systemScheme;

  function setColorScheme(scheme: AppColorScheme) {
    setManualScheme(scheme);
    AsyncStorage.setItem(STORAGE_KEY, scheme);
  }

  function resetToSystem() {
    setManualScheme(null);
    AsyncStorage.removeItem(STORAGE_KEY);
  }

  // Don't render children until the stored preference is loaded,
  // to avoid a flash of the wrong theme.
  if (!ready) return null;

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme, isManual: manualScheme !== null, resetToSystem }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
