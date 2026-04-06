import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Image, Easing, View as RNView } from 'react-native';
import { Text } from './Themed';
import Colors, { accent } from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

interface Props {
  onDone: () => void;
}

export default function SplashOverlay({ onDone }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const bgColor = Colors[colorScheme].background;
  const accentColor = colorScheme === 'dark' ? accent.dark : accent.light;

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const ease = Easing.bezier(0.4, 0, 0.2, 1);

    // 1. Entrance: fade + slide up
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        easing: ease,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        easing: ease,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Exit: fade out overlay after hold
    const exitTimer = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 480,
        easing: ease,
        useNativeDriver: true,
      }).start(() => onDone());
    }, 1800);

    return () => clearTimeout(exitTimer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.overlay,
        { backgroundColor: bgColor, opacity: overlayOpacity },
      ]}
      pointerEvents="none"
    >
      <Animated.View style={{ opacity, transform: [{ translateY }], alignItems: 'center' }}>
        <Image
          source={require('../assets/images/logo_transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: Colors[colorScheme].text }]}>
          20 ab
        </Text>
        <Text style={[styles.subtitle, { color: accentColor }]}>
          Mobile App
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1.2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
});
