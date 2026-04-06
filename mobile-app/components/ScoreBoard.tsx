import React from 'react';
import { StyleSheet, View as RNView, Platform } from 'react-native';
import { Text } from './Themed';
import Colors, { win, loss, accent } from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { Game, SCORE_WIN, SCORE_LOSE } from '@/models/types';
import { getCurrentScore } from '@/services/gameLogic';

interface Props {
  game: Game;
}

export default function ScoreBoard({ game }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const winColor = colorScheme === 'dark' ? win.dark : win.light;
  const lossColor = colorScheme === 'dark' ? loss.dark : loss.light;

  const scores = game.participants
    .map((username) => ({ username, score: getCurrentScore(game, username) }))
    .sort((a, b) => a.score - b.score);

  return (
    <RNView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SCOREBOARD</Text>
      {scores.map((entry, idx) => {
        const isLeading = idx === 0;
        const isDanger = idx === scores.length - 1 && scores.length > 1;
        const nearWin = entry.score <= 6 && entry.score > SCORE_WIN;
        const nearLose = entry.score >= 35 && entry.score < SCORE_LOSE;

        return (
          <RNView
            key={entry.username}
            style={[
              styles.row,
              { borderBottomColor: colors.border },
              idx === scores.length - 1 && styles.rowLast,
            ]}
          >
            <RNView style={styles.rankBadge}>
              <Text style={[styles.rank, { color: colors.textTertiary }]}>
                {idx + 1}
              </Text>
            </RNView>
            <Text
              style={[
                styles.name,
                { color: colors.text },
                isLeading && { color: winColor, fontWeight: '700' },
                isDanger && { color: lossColor },
              ]}
            >
              {entry.username}
            </Text>
            <RNView style={styles.rightCol}>
              {nearWin && (
                <RNView style={[styles.badge, { backgroundColor: `${winColor}18` }]}>
                  <Text style={[styles.badgeText, { color: winColor }]}>almost done</Text>
                </RNView>
              )}
              {nearLose && (
                <RNView style={[styles.badge, { backgroundColor: `${lossColor}18` }]}>
                  <Text style={[styles.badgeText, { color: lossColor }]}>danger</Text>
                </RNView>
              )}
              <Text
                style={[
                  styles.score,
                  { color: colors.text },
                  isLeading && { color: winColor },
                  isDanger && { color: lossColor },
                ]}
              >
                {entry.score}
              </Text>
            </RNView>
          </RNView>
        );
      })}
    </RNView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#28285A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: { borderBottomWidth: 0 },
  rankBadge: { width: 22, marginRight: 10 },
  rank: { fontSize: 12, fontWeight: '600' },
  name: { flex: 1, fontSize: 16, fontWeight: '500' },
  rightCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  score: {
    fontSize: 20,
    fontWeight: '800',
    minWidth: 36,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
});
