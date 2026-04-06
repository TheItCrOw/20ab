import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Alert, Image, View as RNView, ScrollView, Platform } from 'react-native';
import { Text } from './Themed';
import Colors, { accent, accentBg } from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { Player, MIN_PLAYERS, MAX_PLAYERS } from '@/models/types';

interface Props {
  players: Player[];
  onStart: (usernames: string[]) => void;
}

export default function PlayerSelector({ players, onStart }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const accentColor = colorScheme === 'dark' ? accent.dark : accent.light;
  const accentBgColor = colorScheme === 'dark' ? accentBg.dark : accentBg.light;

  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(username: string) {
    const next = new Set(selected);
    if (next.has(username)) {
      next.delete(username);
    } else {
      if (next.size >= MAX_PLAYERS) {
        Alert.alert('Maximum reached', `Up to ${MAX_PLAYERS} players allowed.`);
        return;
      }
      next.add(username);
    }
    setSelected(next);
  }

  function handleStart() {
    if (selected.size < MIN_PLAYERS) {
      Alert.alert('Not enough players', `Select at least ${MIN_PLAYERS} players.`);
      return;
    }
    onStart(Array.from(selected));
  }

  const canStart = selected.size >= MIN_PLAYERS;

  return (
    <RNView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <RNView style={styles.header}>
        <Image
          source={require('../assets/images/logo_transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: colors.text }]}>New Game</Text>
        <Text style={[styles.subtitle, { color: accentColor }]}>
          SELECT {MIN_PLAYERS}–{MAX_PLAYERS} PLAYERS
        </Text>
      </RNView>

      {/* Player grid */}
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {players.map((p) => {
          const isSelected = selected.has(p.username);
          return (
            <TouchableOpacity
              key={p.username}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? accentColor : colors.surface,
                  borderColor: isSelected ? accentColor : colors.border,
                },
                isSelected && styles.chipSelected,
              ]}
              onPress={() => toggle(p.username)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? '#fff' : colors.text },
                ]}
              >
                {p.username}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Count indicator */}
      <Text style={[styles.countText, { color: colors.textSecondary }]}>
        {selected.size} selected
      </Text>

      {/* Start button */}
      <TouchableOpacity
        style={[
          styles.startBtn,
          { backgroundColor: canStart ? accentColor : colors.border },
        ]}
        onPress={handleStart}
        activeOpacity={0.85}
        disabled={!canStart}
      >
        <Text style={[styles.startText, { color: canStart ? '#fff' : colors.textTertiary }]}>
          Start Game
        </Text>
      </TouchableOpacity>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingBottom: 32 },
  header: { alignItems: 'center', paddingTop: 32, paddingBottom: 20 },
  logo: { width: 80, height: 80, marginBottom: 16 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 16,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  chipSelected: {
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: { elevation: 4 },
    }),
  },
  chipText: { fontSize: 15, fontWeight: '600' },
  countText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 16,
  },
  startBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  startText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
