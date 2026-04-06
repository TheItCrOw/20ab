import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import Colors, { accent } from '@/constants/Colors';
import SplashOverlay from '@/components/SplashOverlay';
import { ThemeContextProvider } from '@/contexts/ThemeContext';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  // SafeAreaProvider must wrap everything so useSafeAreaInsets works in child components.
  // ThemeContextProvider must wrap everything so useColorScheme() works everywhere.
  return (
    <SafeAreaProvider>
      <ThemeContextProvider>
        <RootLayoutNav />
      </ThemeContextProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [showSplash, setShowSplash] = useState(true);

  const navTheme = colorScheme === 'dark'
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: accent.dark,
          background: Colors.dark.background,
          card: Colors.dark.surface,
          border: Colors.dark.border,
          text: Colors.dark.text,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: accent.light,
          background: Colors.light.background,
          card: Colors.light.surface,
          border: Colors.light.border,
          text: Colors.light.text,
        },
      };

  return (
    <ThemeProvider value={navTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="game/[id]" options={{ title: 'Game' }} />
      </Stack>
      {showSplash && <SplashOverlay onDone={() => setShowSplash(false)} />}
    </ThemeProvider>
  );
}
