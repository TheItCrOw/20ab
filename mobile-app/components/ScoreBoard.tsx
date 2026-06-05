import React from 'react';
import {
  StyleSheet,
  View as RNView,
  Platform,
} from 'react-native';
import { Text } from './Themed';
import Colors, { win, loss } from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { Game, SCORE_WIN, SCORE_LOSE } from '@/models/types';
import { getCurrentScore } from '@/services/gameLogic';

interface Props {
  game: Game;
  /** The canonical display order, owned by the parent. */
  playerOrder: string[];
}

export default function ScoreBoard({ game, playerOrder }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const winColor = colorScheme === 'dark' ? win.dark : win.light;
  const lossColor = colorScheme === 'dark' ? loss.dark : loss.light;

  // --- Score map & rank list ---
  const scoreMap: Record<string, number> = {};
  for (const u of game.participants) {
    scoreMap[u] = getCurrentScore(game, u);
  }
  const byScore = [...game.participants].sort((a, b) => scoreMap[a] - scoreMap[b]);

  return (
    <RNView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SCOREBOARD</Text>

      {playerOrder.map((username, idx) => {
        const score = scoreMap[username] ?? 0;
        const scoreRank = byScore.indexOf(username);
        const isLeading = scoreRank === 0;
        const isDanger = scoreRank === byScore.length - 1 && byScore.length > 1;
        const nearWin = score <= 6 && score > SCORE_WIN;
        const nearLose = score >= 35 && score < SCORE_LOSE;

        return (
          <RNView
            key={username}
            style={[
              styles.row,
              { borderBottomColor: colors.border, backgroundColor: colors.surface },
              idx === playerOrder.length - 1 && styles.rowLast,
            ]}
          >
            <RNView style={styles.rankBadge}>
              <Text style={[styles.rank, { color: colors.textTertiary }]}>
                {scoreRank + 1}
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
              {username}
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
                {score}
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
      web: {
        boxShadow: '0 2px 8px rgba(40,40,90,0.10)',
      },
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
    paddingLeft: 16,
    paddingRight: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 46,
  },
  rowLast: { borderBottomWidth: 0 },
  rankBadge: { width: 22, marginRight: 10 },
  rank: { fontSize: 12, fontWeight: '600' },
  name: { flex: 1, fontSize: 16, fontWeight: '500' },
  rightCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  score: {
    fontSize: 20,
    fontWeight: '800',
    minWidth: 36,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
});
