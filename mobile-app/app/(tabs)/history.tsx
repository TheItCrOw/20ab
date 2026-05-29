import React, { useCallback, useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View as RNView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { Text } from '@/components/Themed';
import Colors, { win, loss, finish } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Game, Player, TRUMP_SYMBOLS } from '@/models/types';
import { getGames, getPlayers } from '@/services/storage';

export default function HistoryScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const winColor = colorScheme === 'dark' ? win.dark : win.light;
  const lossColor = colorScheme === 'dark' ? loss.dark : loss.light;
  const finishColor = colorScheme === 'dark' ? finish.dark : finish.light;
  const router = useRouter();

  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getGames(), getPlayers()]).then(([g, p]) => {
        setGames(g.sort((a, b) => b.date.localeCompare(a.date)));
        setPlayers(p);
      });
    }, [])
  );

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.slice(0, 10).split('-');
    return `${d}.${m}.${y}`;
  }

  function findName(username: string | null) {
    if (!username) return '–';
    return players.find((p) => p.username === username)?.name ?? username;
  }

  if (games.length === 0) {
    return (
      <RNView style={[styles.empty, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyIcon]}>🃏</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No games yet</Text>
        <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
          Start a game in the Game tab!
        </Text>
      </RNView>
    );
  }

  return (
    <FlatList
      style={[{ flex: 1, backgroundColor: colors.background }]}
      contentContainerStyle={styles.list}
      data={games}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const trumps = item.rounds.map((r) => TRUMP_SYMBOLS[r.trump]);
        return (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push(`/game/${item.id}` as any)}
          >
            <RNView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Header row */}
              <RNView style={styles.cardHeader}>
                <Text style={[styles.dateText, { color: colors.text }]}>
                  {formatDate(item.date)}
                </Text>
                <Text style={[styles.roundsBadge, { color: colors.textSecondary, backgroundColor: colors.headerBg }]}>
                  {item.rounds.length} rounds
                </Text>
              </RNView>

              {/* Result row */}
              <RNView style={styles.resultRow}>
                <RNView style={styles.resultItem}>
                  <Text style={[styles.resultRoleLabel, { color: winColor }]}>FINISHER</Text>
                  <Text style={[styles.resultName, { color: colors.text }]}>
                    {findName(item.finisher)}
                  </Text>
                </RNView>
                <RNView style={[styles.resultDivider, { backgroundColor: colors.border }]} />
                <RNView style={styles.resultItem}>
                  <Text style={[styles.resultRoleLabel, { color: lossColor }]}>LOSER</Text>
                  <Text style={[styles.resultName, { color: colors.text }]}>
                    {findName(item.loser)}
                  </Text>
                </RNView>
                {item.winners.length > 0 && (
                  <>
                    <RNView style={[styles.resultDivider, { backgroundColor: colors.border }]} />
                    <RNView style={styles.resultItem}>
                      <Text style={[styles.resultRoleLabel, { color: finishColor }]}>WINNERS</Text>
                      <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>
                        {item.winners.map((u) => findName(u)).join(', ')}
                      </Text>
                    </RNView>
                  </>
                )}
              </RNView>

              {/* Footer */}
              <Text style={[styles.participants, { color: colors.textTertiary }]}>
                {item.participants.join(' · ')}
              </Text>
            </RNView>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyHint: { fontSize: 14, textAlign: 'center' },
  list: { padding: 16, gap: 10 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#28285A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  dateText: { fontSize: 15, fontWeight: '700' },
  roundsBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  resultItem: { flex: 1 },
  resultRoleLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 3 },
  resultName: { fontSize: 14, fontWeight: '600' },
  resultDivider: { width: 1, height: 32, marginHorizontal: 12 },
  participants: { fontSize: 12, fontWeight: '500' },
});
