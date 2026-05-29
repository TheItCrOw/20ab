import React from 'react';
import { StyleSheet, ScrollView, View as RNView, Platform } from 'react-native';
import { Text } from './Themed';
import Colors, { win, loss, accent } from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { Game, TRUMP_SYMBOLS, TRUMP_COLORS, STARTING_SCORE } from '@/models/types';

interface Props {
  game: Game;
}

export default function GameHistory({ game }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const winColor = colorScheme === 'dark' ? win.dark : win.light;
  const lossColor = colorScheme === 'dark' ? loss.dark : loss.light;

  if (game.rounds.length === 0) return null;

  return (
    <RNView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>GAME LOG</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <RNView style={{ minWidth: '100%' }}>
          {/* Header */}
          <RNView style={[styles.row, { borderBottomColor: colors.border }]}>
            <RNView style={styles.roundCell}>
              <Text style={[styles.colHeader, { color: colors.textTertiary }]}>RND</Text>
            </RNView>
            {game.participants.map((u) => (
              <RNView key={u} style={styles.playerCell}>
                <Text style={[styles.colHeader, { color: colors.textTertiary }]} numberOfLines={1}>
                  {u}
                </Text>
              </RNView>
            ))}
          </RNView>

          {/* Start row */}
          <RNView style={[styles.row, { borderBottomColor: colors.border, backgroundColor: colors.headerBg }]}>
            <RNView style={styles.roundCell}>
              <Text style={[styles.cellSub, { color: colors.textSecondary }]}>—</Text>
            </RNView>
            {game.participants.map((u) => (
              <RNView key={u} style={styles.playerCell}>
                <Text style={[styles.cellScore, { color: colors.textSecondary }]}>{STARTING_SCORE}</Text>
              </RNView>
            ))}
          </RNView>

          {/* Round rows (newest first) */}
          {[...game.rounds].reverse().map((round, reverseIdx) => {
            const idx = game.rounds.length - 1 - reverseIdx;
            return (
            <RNView
              key={idx}
              style={[
                styles.row,
                {
                  borderBottomColor: colors.border,
                  backgroundColor: reverseIdx % 2 !== 0 ? colors.stripeBg : 'transparent',
                },
              ]}
            >
              <RNView style={[styles.roundCell, { gap: 4 }]}>
                <Text style={[styles.cellSub, { color: colors.textSecondary }]}>{idx + 1}</Text>
                <Text style={[styles.trumpIcon, { color: TRUMP_COLORS[round.trump] }]}>
                  {TRUMP_SYMBOLS[round.trump]}
                </Text>
              </RNView>
              {game.participants.map((username) => {
                const move = round.moves.find((m) => m.username === username);
                if (!move) return (
                  <RNView key={username} style={styles.playerCell}>
                    <Text style={[styles.cellSub, { color: colors.textTertiary }]}>–</Text>
                  </RNView>
                );
                const deltaColor = move.satOut
                  ? colors.textSecondary
                  : (move.delta ?? 0) < 0 ? winColor
                  : (move.delta ?? 0) > 0 ? lossColor
                  : colors.textSecondary;

                return (
                  <RNView key={username} style={styles.playerCell}>
                    <Text style={[styles.cellScore, { color: colors.text }]}>{move.value}</Text>
                    <Text style={[styles.cellDelta, { color: deltaColor }]}>
                      {move.satOut
                        ? 'out'
                        : move.delta !== null
                          ? `${move.delta > 0 ? '+' : ''}${move.delta}`
                          : ''}
                    </Text>
                  </RNView>
                );
              })}
            </RNView>
          );
          })}
        </RNView>
      </ScrollView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#28285A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 9,
  },
  roundCell: {
    width: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  playerCell: { width: 70, alignItems: 'center' },
  colHeader: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  cellSub: { fontSize: 12, fontWeight: '500' },
  cellScore: { fontSize: 14, fontWeight: '700' },
  cellDelta: { fontSize: 10, fontWeight: '600', marginTop: 1 },
  trumpIcon: { fontSize: 14 },
});
