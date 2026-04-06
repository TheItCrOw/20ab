import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Alert, ScrollView, View as RNView, Platform } from 'react-native';
import { Text } from './Themed';
import Colors, { accent, win, loss } from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { Game, Player, TrumpSuit, MIN_DELTA, MAX_DELTA, TRUMP_SYMBOLS, TRUMP_LABELS, TRUMP_COLORS } from '@/models/types';
import { getCurrentScore, canSitOut, getMultiplier } from '@/services/gameLogic';

interface Props {
  game: Game;
  players: Player[];
  trump: TrumpSuit;
  onSubmit: (deltas: Record<string, number>, sittingOut: Set<string>) => void;
  onBack: () => void;
}

export default function RoundInput({ game, players, trump, onSubmit, onBack }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const accentColor = colorScheme === 'dark' ? accent.dark : accent.light;
  const winColor = colorScheme === 'dark' ? win.dark : win.light;
  const lossColor = colorScheme === 'dark' ? loss.dark : loss.light;

  const multiplier = getMultiplier(trump);
  const isClubs = trump === 'clubs';

  const [deltas, setDeltas] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    game.participants.forEach((u) => (init[u] = 0));
    return init;
  });
  const [sittingOut, setSittingOut] = useState<Set<string>>(new Set());

  function adjustDelta(username: string, change: number) {
    setDeltas((prev) => {
      const next = Math.max(MIN_DELTA, Math.min(MAX_DELTA, (prev[username] ?? 0) + change));
      return { ...prev, [username]: next };
    });
  }

  function toggleSitOut(username: string) {
    setSittingOut((prev) => {
      const next = new Set(prev);
      next.has(username) ? next.delete(username) : next.add(username);
      return next;
    });
  }

  function handleSubmit() {
    if (game.participants.every((u) => sittingOut.has(u))) {
      Alert.alert('Error', 'At least one player must participate.');
      return;
    }
    onSubmit(deltas, sittingOut);
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Trump badge */}
      <RNView style={[styles.trumpHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.trumpSymbol, { color: TRUMP_COLORS[trump] }]}>
          {TRUMP_SYMBOLS[trump]}
        </Text>
        <RNView>
          <Text style={[styles.trumpName, { color: colors.text }]}>
            {TRUMP_LABELS[trump]}
          </Text>
          {trump === 'hearts' && (
            <Text style={[styles.trumpHint, { color: TRUMP_COLORS.hearts }]}>Points doubled</Text>
          )}
          {trump === 'clubs' && (
            <Text style={[styles.trumpHint, { color: accentColor }]}>All must play</Text>
          )}
        </RNView>
      </RNView>

      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ENTER POINTS</Text>

      {game.participants.map((username) => {
        const currentScore = getCurrentScore(game, username);
        const isSittingOut = sittingOut.has(username);
        const canPlayerSitOut = canSitOut(game, username, trump);
        const delta = deltas[username] ?? 0;
        const effectiveDelta = delta * multiplier;
        const previewScore = isSittingOut
          ? currentScore + 1 * multiplier
          : currentScore + effectiveDelta;
        const scoreImproves = previewScore < currentScore;
        const scoreWorsens = previewScore > currentScore;

        return (
          <RNView
            key={username}
            style={[
              styles.playerCard,
              { backgroundColor: colors.surface, borderColor: isSittingOut ? colors.border : colors.border },
              isSittingOut && { opacity: 0.55 },
            ]}
          >
            {/* Player header */}
            <RNView style={styles.playerHeader}>
              <RNView style={{ flex: 1 }}>
                <Text style={[styles.playerName, { color: colors.text }]}>{username}</Text>
                <Text style={[
                  styles.scorePreview,
                  { color: scoreImproves ? winColor : scoreWorsens ? lossColor : colors.textSecondary },
                ]}>
                  {currentScore} → {previewScore}
                </Text>
              </RNView>

              {!isClubs && canPlayerSitOut ? (
                <TouchableOpacity
                  style={[
                    styles.sitOutBtn,
                    {
                      backgroundColor: isSittingOut ? accentColor : 'transparent',
                      borderColor: accentColor,
                    },
                  ]}
                  onPress={() => toggleSitOut(username)}
                >
                  <Text style={{ color: isSittingOut ? '#fff' : accentColor, fontSize: 12, fontWeight: '700' }}>
                    {isSittingOut ? 'SITTING OUT' : 'SIT OUT'}
                  </Text>
                </TouchableOpacity>
              ) : !isClubs && !canPlayerSitOut ? (
                <Text style={[styles.mustPlayLabel, { color: colors.textTertiary }]}>must play</Text>
              ) : null}
            </RNView>

            {/* Delta controls */}
            {!isSittingOut && (
              <RNView style={styles.deltaRow}>
                <TouchableOpacity
                  style={[styles.deltaBtn, { backgroundColor: lossColor }]}
                  onPress={() => adjustDelta(username, -1)}
                  disabled={delta <= MIN_DELTA}
                >
                  <Text style={styles.deltaBtnText}>−</Text>
                </TouchableOpacity>

                <RNView style={styles.deltaCenter}>
                  <Text style={[
                    styles.deltaValue,
                    {
                      color: delta < 0 ? winColor : delta > 0 ? lossColor : colors.text,
                    },
                  ]}>
                    {delta > 0 ? '+' : ''}{delta}
                  </Text>
                  {trump === 'hearts' && delta !== 0 && (
                    <Text style={[styles.effectiveHint, { color: colors.textSecondary }]}>
                      effective {effectiveDelta > 0 ? '+' : ''}{effectiveDelta}
                    </Text>
                  )}
                </RNView>

                <TouchableOpacity
                  style={[styles.deltaBtn, { backgroundColor: winColor }]}
                  onPress={() => adjustDelta(username, 1)}
                  disabled={delta >= MAX_DELTA}
                >
                  <Text style={styles.deltaBtnText}>+</Text>
                </TouchableOpacity>
              </RNView>
            )}

            {isSittingOut && (
              <Text style={[styles.sitOutPenalty, { color: colors.textSecondary }]}>
                +{1 * multiplier} point penalty
              </Text>
            )}
          </RNView>
        );
      })}

      {/* Action buttons */}
      <RNView style={styles.buttons}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: colors.border }]}
          onPress={onBack}
        >
          <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 15 }}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: accentColor }]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitText}>Submit Round</Text>
        </TouchableOpacity>
      </RNView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  trumpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  trumpSymbol: { fontSize: 36 },
  trumpName: { fontSize: 17, fontWeight: '700' },
  trumpHint: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  playerCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  playerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  playerName: { fontSize: 16, fontWeight: '700' },
  scorePreview: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  sitOutBtn: { borderWidth: 1.5, borderRadius: 6, paddingVertical: 5, paddingHorizontal: 10 },
  mustPlayLabel: { fontSize: 11, fontStyle: 'italic' },
  deltaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  deltaBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  deltaBtnText: { color: '#fff', fontSize: 26, fontWeight: '700', lineHeight: 30 },
  deltaCenter: { alignItems: 'center', minWidth: 80 },
  deltaValue: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  effectiveHint: { fontSize: 11, marginTop: 2 },
  sitOutPenalty: { textAlign: 'center', fontSize: 13, fontWeight: '500' },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 8 },
  backBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 15, alignItems: 'center' },
  submitBtn: {
    flex: 2, borderRadius: 12, padding: 15, alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
