import React from 'react';
import { StyleSheet, TouchableOpacity, View as RNView, Platform } from 'react-native';
import { Text } from './Themed';
import Colors, { accent } from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { TrumpSuit, TRUMP_LABELS, TRUMP_SYMBOLS, TRUMP_COLORS } from '@/models/types';

const SUITS: TrumpSuit[] = ['hearts', 'clubs', 'diamonds', 'spades'];

interface Props {
  onSelect: (suit: TrumpSuit) => void;
  roundNumber: number;
}

export default function TrumpSelector({ onSelect, roundNumber }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const accentColor = colorScheme === 'dark' ? accent.dark : accent.light;

  return (
    <RNView style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Text style={[styles.roundLabel, { color: colors.textSecondary }]}>
        ROUND {roundNumber}
      </Text>
      <Text style={[styles.title, { color: colors.text }]}>Choose Trump</Text>

      <RNView style={styles.grid}>
        {SUITS.map((suit) => (
          <TouchableOpacity
            key={suit}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => onSelect(suit)}
            activeOpacity={0.75}
          >
            <Text style={[styles.symbol, { color: TRUMP_COLORS[suit] }]}>
              {TRUMP_SYMBOLS[suit]}
            </Text>
            <Text style={[styles.label, { color: colors.text }]}>
              {TRUMP_LABELS[suit]}
            </Text>
            {suit === 'hearts' && (
              <RNView style={[styles.badge, { backgroundColor: `${TRUMP_COLORS.hearts}18` }]}>
                <Text style={[styles.badgeText, { color: TRUMP_COLORS.hearts }]}>×2 points</Text>
              </RNView>
            )}
            {suit === 'clubs' && (
              <RNView style={[styles.badge, { backgroundColor: `${accentColor}14` }]}>
                <Text style={[styles.badgeText, { color: accentColor }]}>all must play</Text>
              </RNView>
            )}
          </TouchableOpacity>
        ))}
      </RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 12 },
  roundLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  card: {
    width: '45%',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  symbol: { fontSize: 34, lineHeight: 40 },
  label: { fontSize: 15, fontWeight: '700' },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    marginTop: 2,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
});
