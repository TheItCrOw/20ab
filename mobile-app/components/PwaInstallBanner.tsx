import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors, { accent } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

// Stored globally so we don't lose the event between re-renders / navigation.
let deferredPrompt: any = null;

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

type InstallState = 'available' | 'ios-manual' | 'installed' | 'hidden';

function getInstallState(): InstallState {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'hidden';

  // Already running as installed PWA
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
  if (isStandalone) return 'installed';

  // Chrome/Edge/Android: we captured the install prompt
  if (deferredPrompt) return 'available';

  // iOS Safari: no beforeinstallprompt, must instruct user manually
  const ua = navigator.userAgent;
  const isIos = /iP(hone|od|ad)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  if (isIos && isSafari) return 'ios-manual';

  return 'hidden';
}

export default function PwaInstallBanner() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const accentColor = colorScheme === 'dark' ? accent.dark : accent.light;
  const [state, setState] = useState<InstallState>('hidden');

  useEffect(() => {
    setState(getInstallState());

    // Re-check when beforeinstallprompt fires (may arrive late)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handler = () => setState(getInstallState());
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  if (state === 'hidden' || state === 'installed') return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setState('installed');
    }
    deferredPrompt = null;
  }

  const s = makeStyles(colors, accentColor);

  if (state === 'ios-manual') {
    return (
      <View style={s.card}>
        <View style={s.iconRow}>
          <View style={[s.iconWrap, { backgroundColor: accentColor + '1A' }]}>
            <FontAwesome name="download" size={16} color={accentColor} />
          </View>
          <Text style={s.title}>Install as App</Text>
        </View>
        <Text style={s.description}>
          Tap the <Text style={s.bold}>Share</Text> button{' '}
          <FontAwesome name="share" size={12} color={colors.textSecondary} />{' '}
          in Safari, then tap <Text style={s.bold}>"Add to Home Screen"</Text>.
        </Text>
      </View>
    );
  }

  // state === 'available' (Chrome/Edge/Android)
  return (
    <View style={s.card}>
      <View style={s.iconRow}>
        <View style={[s.iconWrap, { backgroundColor: accentColor + '1A' }]}>
          <FontAwesome name="download" size={16} color={accentColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Install as App</Text>
          <Text style={s.subtitle}>Add to your home screen for the full experience</Text>
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [s.button, pressed && { opacity: 0.7 }]}
        onPress={handleInstall}
      >
        <Text style={s.buttonText}>Install</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: typeof Colors['dark'], accentColor: string) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: accentColor + '40',
      padding: 16,
      gap: 12,
      marginBottom: 20,
    },
    iconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 2,
    },
    description: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    bold: {
      fontWeight: '700',
      color: colors.text,
    },
    button: {
      backgroundColor: accentColor,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#fff',
    },
  });
}
