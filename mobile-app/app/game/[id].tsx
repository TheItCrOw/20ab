import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View as RNView, Platform } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Text } from '@/components/Themed';
import Colors, { win, winBg, loss, lossBg, finish, finishBg, accent } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Game, Player } from '@/models/types';
import { getGames, getPlayers } from '@/services/storage';
import { getAllScores } from '@/services/gameLogic';
import GameHistory from '@/components/GameHistory';

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const accentColor = colorScheme === 'dark' ? accent.dark : accent.light;
  const winColor = colorScheme === 'dark' ? win.dark : win.light;
  const winBgColor = colorScheme === 'dark' ? winBg.dark : winBg.light;
  const lossColor = colorScheme === 'dark' ? loss.dark : loss.light;
  const lossBgColor = colorScheme === 'dark' ? lossBg.dark : lossBg.light;
  const finishColor = colorScheme === 'dark' ? finish.dark : finish.light;
  const finishBgColor = colorScheme === 'dark' ? finishBg.dark : finishBg.light;

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    Promise.all([getGames(), getPlayers()]).then(([games, p]) => {
      setGame(games.find((g) => g.id === id) ?? null);
      setPlayers(p);
    });
  }, [id]);

  const findName = (username: string | null) => {
    if (!username) return '–';
    return players.find((p) => p.username === username)?.name ?? username;
  };

  function formatDate(d: string) {
    const [y, m, day] = d.slice(0, 10).split('-');
    return `${day}.${m}.${y}`;
  }

  if (!game) {
    return (
      <>
        <Stack.Screen options={{ title: 'Game' }} />
        <RNView style={[styles.center, { backgroundColor: colors.background }]}>
          <Text style={{ color: colors.textSecondary }}>Loading...</Text>
        </RNView>
      </>
    );
  }

  const scores = getAllScores(game);

  return (
    <>
      <Stack.Screen
        options={{
          title: formatDate(game.date),
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: accentColor,
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
        }}
      />
      <ScrollView
        style={[{ flex: 1, backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {formatDate(game.date)}  ·  {game.rounds.length} rounds  ·  {game.participants.join(', ')}
        </Text>

        {/* Result cards */}
        <RNView style={styles.resultRow}>
          <RNView style={[styles.resultCard, { backgroundColor: winBgColor, borderColor: winColor + '40' }]}>
            <Text style={styles.resultEmoji}>👑</Text>
            <Text style={[styles.resultRole, { color: winColor }]}>FINISHER</Text>
            <Text style={[styles.resultName, { color: colors.text }]}>{findName(game.finisher)}</Text>
            <Text style={[styles.resultScore, { color: winColor }]}>
              {game.finisher ? scores[game.finisher] : '–'} pts
            </Text>
          </RNView>
          <RNView style={[styles.resultCard, { backgroundColor: lossBgColor, borderColor: lossColor + '40' }]}>
            <Text style={styles.resultEmoji}>💀</Text>
            <Text style={[styles.resultRole, { color: lossColor }]}>LOSER</Text>
            <Text style={[styles.resultName, { color: colors.text }]}>{findName(game.loser)}</Text>
            <Text style={[styles.resultScore, { color: lossColor }]}>
              {game.loser ? scores[game.loser] : '–'} pts
            </Text>
          </RNView>
        </RNView>

        {game.winners.length > 0 && (
          <RNView style={[styles.winnersCard, { backgroundColor: finishBgColor, borderColor: finishColor + '40' }]}>
            <Text style={[styles.sectionLabel, { color: finishColor }]}>WINNERS</Text>
            <RNView style={styles.winnersRow}>
              {game.winners.sort((a, b) => (scores[a] ?? 0) - (scores[b] ?? 0)).map((u) => (
                <RNView key={u} style={[styles.winnerChip, { backgroundColor: finishColor + '18', borderColor: finishColor + '30' }]}>
                  <Text style={[styles.winnerText, { color: finishColor }]}>
                    {findName(u)}  ·  {scores[u]} pts
                  </Text>
                </RNView>
              ))}
            </RNView>
          </RNView>
        )}

        {/* Final scores */}
        <RNView style={[styles.scoresCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>FINAL SCORES</Text>
          {game.participants
            .sort((a, b) => (scores[a] ?? 0) - (scores[b] ?? 0))
            .map((u, idx) => (
              <RNView
                key={u}
                style={[
                  styles.scoreRow,
                  { borderBottomColor: colors.border },
                  idx === game.participants.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={[styles.scoreRank, { color: colors.textTertiary }]}>{idx + 1}</Text>
                <Text style={[styles.scoreName, { color: colors.text }]}>{findName(u)}</Text>
                <Text style={[styles.scoreValue, { color: colors.text }]}>{scores[u]}</Text>
              </RNView>
            ))}
        </RNView>

        <GameHistory game={game} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  meta: { fontSize: 13, fontWeight: '500', marginBottom: 18, textAlign: 'center' },
  resultRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  resultCard: {
    flex: 1, borderRadius: 12, borderWidth: 1, padding: 16, alignItems: 'center', gap: 4,
  },
  resultEmoji: { fontSize: 28, marginBottom: 2 },
  resultRole: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  resultName: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  resultScore: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  winnersCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 10 },
  winnersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  winnerChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  winnerText: { fontSize: 13, fontWeight: '600' },
  scoresCard: {
    borderRadius: 12, borderWidth: 1, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#28285A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  scoreRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scoreRank: { width: 22, fontSize: 12, fontWeight: '600' },
  scoreName: { flex: 1, fontSize: 15, fontWeight: '500' },
  scoreValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
});
