import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Alert, Image, View as RNView, ScrollView, Modal, Platform } from 'react-native';
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
  const [showRules, setShowRules] = useState(false);

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
      {/* How to Play modal */}
      <Modal
        visible={showRules}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRules(false)}
      >
        <RNView style={styles.rulesOverlay}>
          <RNView style={[styles.rulesBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.rulesTitle, { color: colors.text }]}>How to Play</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.rulesScroll}>

              <Text style={[styles.rulesSectionHeader, { color: accentColor }]}>The Goal</Text>
              <Text style={[styles.rulesBody, { color: colors.text }]}>
                2–10 players. Each player starts with <Text style={styles.rulesBold}>20 points</Text>. The goal is to be the first to reach <Text style={styles.rulesBold}>0 or below</Text> — that player is the Finisher and wins. Anyone who hits <Text style={styles.rulesBold}>41 or above</Text>, or has the <Text style={styles.rulesBold}>most points when the game ends</Text>, becomes the Loser and has to buy a round.
              </Text>

              <Text style={[styles.rulesSectionHeader, { color: accentColor }]}>The Deck</Text>
              <Text style={[styles.rulesBody, { color: colors.text }]}>
                Played with a <Text style={styles.rulesBold}>32-card French deck</Text> (7 through Ace, four suits). Card ranking from highest to lowest:{'\n'}
                <Text style={styles.rulesBold}>Ace › 10 › King › Queen › Jack › 9 › 8 › 7</Text>
              </Text>

              <Text style={[styles.rulesSectionHeader, { color: accentColor }]}>Dealing</Text>
              <Text style={[styles.rulesBody, { color: colors.text }]}>
                Each player receives <Text style={styles.rulesBold}>5 cards</Text> — dealt in two rounds (3 first, then 2). The player sitting <Text style={styles.rulesBold}>behind the dealer</Text> chooses the trump suit for this round based only on the first 3 cards dealt.{'\n\n'}
                Before play begins, each player may <Text style={styles.rulesBold}>swap up to 3 cards</Text> from their hand with cards from the remaining deck to improve their hand.
              </Text>

              <Text style={[styles.rulesSectionHeader, { color: accentColor }]}>Playing Tricks</Text>
              <Text style={[styles.rulesBody, { color: colors.text }]}>
                Players take turns playing one card each to form a trick. Rules:{'\n'}
                • You <Text style={styles.rulesBold}>must follow suit</Text> if you can.{'\n'}
                • Trump cards beat all other suits. The highest card of the leading suit wins if no trump is played.{'\n'}
                • The winner of a trick leads the next one.
              </Text>

              <Text style={[styles.rulesSectionHeader, { color: accentColor }]}>Scoring a Round</Text>
              <Text style={[styles.rulesBody, { color: colors.text }]}>
                After all 5 tricks are played, each player's score changes based on how many tricks they captured:{'\n\n'}
                • <Text style={styles.rulesBold}>Each trick won → −1 point</Text> (good — score goes down){'\n'}
                • <Text style={styles.rulesBold}>0 tricks won → +5 points</Text> (bad — penalty for taking nothing){'\n\n'}
                This is the number you enter into the app. On <Text style={styles.rulesBold}>♥ Hearts</Text> rounds the app doubles it automatically — no need to calculate yourself.
              </Text>

              <Text style={[styles.rulesSectionHeader, { color: accentColor }]}>Each Round (App Flow)</Text>
              <Text style={[styles.rulesBody, { color: colors.text }]}>
                1. Choose the trump suit in the app.{'\n'}
                2. Play out the round physically with cards.{'\n'}
                3. Each player enters their delta (−5 to +5) in the app.{'\n'}
                4. Scores update. Repeat until someone hits 0 or 41.
              </Text>

              <Text style={[styles.rulesSectionHeader, { color: accentColor }]}>Sitting Out</Text>
              <Text style={[styles.rulesBody, { color: colors.text }]}>
                A player with <Text style={styles.rulesBold}>7 or more points</Text> may sit out a round and gets a <Text style={styles.rulesBold}>+1 penalty</Text>.{'\n'}
                A player with <Text style={styles.rulesBold}>6 or fewer points</Text> MUST play — no sitting out!{'\n'}
                At least <Text style={styles.rulesBold}>2 players must participate</Text> in every round — sitting out is only allowed if enough players remain active.
              </Text>

              <Text style={[styles.rulesSectionHeader, { color: accentColor }]}>Trump Suits</Text>

              <RNView style={[styles.suitRow, { borderColor: colors.border }]}>
                <Text style={styles.suitSymbol}>♥</Text>
                <RNView style={styles.suitInfo}>
                  <Text style={[styles.suitName, { color: colors.text }]}>Hearts <Text style={[styles.suitAlias, { color: colors.textSecondary }]}>· Herzchen</Text></Text>
                  <Text style={[styles.rulesBody, { color: colors.textSecondary }]}>All deltas and penalties are <Text style={[styles.rulesBold, { color: colors.text }]}>doubled</Text>.</Text>
                </RNView>
              </RNView>

              <RNView style={[styles.suitRow, { borderColor: colors.border }]}>
                <Text style={styles.suitSymbol}>♣</Text>
                <RNView style={styles.suitInfo}>
                  <Text style={[styles.suitName, { color: colors.text }]}>Clubs <Text style={[styles.suitAlias, { color: colors.textSecondary }]}>· Bäumchen</Text></Text>
                  <Text style={[styles.rulesBody, { color: colors.textSecondary }]}><Text style={[styles.rulesBold, { color: colors.text }]}>Everyone must play</Text> — no sitting out allowed.</Text>
                </RNView>
              </RNView>

              <RNView style={[styles.suitRow, { borderColor: colors.border }]}>
                <Text style={styles.suitSymbol}>♦</Text>
                <RNView style={styles.suitInfo}>
                  <Text style={[styles.suitName, { color: colors.text }]}>Diamonds <Text style={[styles.suitAlias, { color: colors.textSecondary }]}>· Strenchen</Text></Text>
                  <Text style={[styles.rulesBody, { color: colors.textSecondary }]}>Standard round, no special rules.</Text>
                </RNView>
              </RNView>

              <RNView style={[styles.suitRow, { borderColor: colors.border }]}>
                <Text style={styles.suitSymbol}>♠</Text>
                <RNView style={styles.suitInfo}>
                  <Text style={[styles.suitName, { color: colors.text }]}>Spades <Text style={[styles.suitAlias, { color: colors.textSecondary }]}>· Schippchen</Text></Text>
                  <Text style={[styles.rulesBody, { color: colors.textSecondary }]}>Standard round, no special rules.</Text>
                </RNView>
              </RNView>

              <Text style={[styles.rulesSectionHeader, { color: accentColor }]}>Ending the Game</Text>
              <Text style={[styles.rulesBody, { color: colors.text }]}>
                The game ends as soon as any player's score leaves the 1–40 range.{'\n\n'}
                🏆 <Text style={styles.rulesBold}>Finisher</Text> — reached ≤ 0. Wins!{'\n'}
                💀 <Text style={styles.rulesBold}>Loser</Text> — reached ≥ 41, or has the most points at the end. Buys the round.{'\n'}
                🎉 <Text style={styles.rulesBold}>Winners</Text> — everyone else. Safe!
              </Text>

              <RNView style={{ height: 16 }} />
            </ScrollView>

            <TouchableOpacity
              style={[styles.rulesCloseBtn, { backgroundColor: accentColor }]}
              onPress={() => setShowRules(false)}
            >
              <Text style={styles.rulesCloseBtnText}>Got it!</Text>
            </TouchableOpacity>
          </RNView>
        </RNView>
      </Modal>

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

      {/* How to Play? */}
      <TouchableOpacity
        style={styles.howToPlayBtn}
        onPress={() => setShowRules(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.howToPlayText, { color: colors.textSecondary }]}>
          How to Play?
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
  howToPlayBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  howToPlayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Rules modal
  rulesOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  rulesBox: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    padding: 24,
    maxHeight: '88%',
  },
  rulesTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 18,
  },
  rulesScroll: {
    marginBottom: 16,
  },
  rulesSectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 18,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  rulesBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  rulesBold: {
    fontWeight: '700',
  },
  suitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suitSymbol: {
    fontSize: 26,
    lineHeight: 32,
    width: 32,
    textAlign: 'center',
  },
  suitInfo: {
    flex: 1,
    gap: 2,
  },
  suitName: {
    fontSize: 15,
    fontWeight: '700',
  },
  suitAlias: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  rulesCloseBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  rulesCloseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
