import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  View as RNView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/Themed';
import Colors, { accent, loss } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Game, Player, TrumpSuit } from '@/models/types';
import {
  getPlayers,
  getActiveGame,
  saveActiveGame,
  saveGame,
  seedPlayersIfEmpty,
  runDataWipeIfNeeded,
} from '@/services/storage';
import {
  createGame,
  addRound,
  undoLastRound,
  buildRoundMoves,
  getCurrentTurnPlayer,
} from '@/services/gameLogic';
import PlayerSelector from '@/components/PlayerSelector';
import ScoreBoard from '@/components/ScoreBoard';
import TrumpSelector from '@/components/TrumpSelector';
import RoundInput from '@/components/RoundInput';
import GameHistory from '@/components/GameHistory';
import GameFinished from '@/components/GameFinished';
import StarterSelect from '@/components/StarterSelect';
import OrderSetup from '@/components/OrderSetup';

type Phase = 'loading' | 'no_game' | 'starter_select' | 'order_setup' | 'trump_select' | 'score_input' | 'game_finished';

export default function GameScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const accentColor = colorScheme === 'dark' ? accent.dark : accent.light;
  const lossColor = colorScheme === 'dark' ? loss.dark : loss.light;

  const [players, setPlayers] = useState<Player[]>([]);
  const [game, setGame] = useState<Game | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [selectedTrump, setSelectedTrump] = useState<TrumpSuit | null>(null);
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [playerOrder, setPlayerOrder] = useState<string[]>([]);
  const [pendingParticipants, setPendingParticipants] = useState<string[]>([]);
  const [starter, setStarter] = useState<string | null>(null);

  const navigation = useNavigation();
  const isActiveGame = phase === 'trump_select' || phase === 'score_input';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: isActiveGame
        ? () => (
            <TouchableOpacity
              style={{ paddingHorizontal: 12 }}
              onPress={() => setShowAbandonModal(true)}
            >
              <Text style={{ color: lossColor, fontSize: 14, fontWeight: '600' }}>Abandon</Text>
            </TouchableOpacity>
          )
        : undefined,
    });
  }, [navigation, isActiveGame, lossColor]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    await runDataWipeIfNeeded();
    await seedPlayersIfEmpty();
    const [loadedPlayers, activeGame] = await Promise.all([
      getPlayers(),
      getActiveGame(),
    ]);
    setPlayers(loadedPlayers);
    setGame(activeGame);

    if (!activeGame) {
      setPhase('no_game');
    } else if (!activeGame.inProgress) {
      setPhase('game_finished');
    } else {
      setPlayerOrder(activeGame.dealOrder ?? activeGame.participants);
      setPhase('trump_select');
    }
  }

  function handleStartGame(selectedUsernames: string[]) {
    setPendingParticipants(selectedUsernames);
    setPhase('starter_select');
  }

  function handleStarterSelected(starterUsername: string) {
    setStarter(starterUsername);
    // Place starter first in the initial order
    const rest = pendingParticipants.filter((u) => u !== starterUsername);
    setPlayerOrder([starterUsername, ...rest]);
    setPhase('order_setup');
  }

  async function handleOrderConfirmed(dealOrder: string[]) {
    const newGame = createGame(pendingParticipants, dealOrder);
    setGame(newGame);
    setPlayerOrder(dealOrder);
    await saveActiveGame(newGame);
    setPhase('trump_select');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handleTrumpSelected(trump: TrumpSuit) {
    setSelectedTrump(trump);
    setPhase('score_input');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  async function handleSubmitRound(
    deltas: Record<string, number>,
    sittingOut: Set<string>
  ) {
    if (!game || !selectedTrump) return;

    const moves = buildRoundMoves(game, selectedTrump, deltas, sittingOut);
    const updated = addRound(game, selectedTrump, moves);
    setGame(updated);

    if (updated.inProgress) {
      await saveActiveGame(updated);
      setSelectedTrump(null);
      setPhase('trump_select');
    } else {
      await saveGame(updated);
      await saveActiveGame(null);
      setPhase('game_finished');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  async function handleUndo() {
    if (!game || game.rounds.length === 0) return;
    const updated = undoLastRound(game);
    setGame(updated);
    await saveActiveGame(updated);
    setSelectedTrump(null);
    setPhase('trump_select');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  async function confirmAbandon() {
    setShowAbandonModal(false);
    setGame(null);
    setSelectedTrump(null);
    setPlayerOrder([]);
    setPendingParticipants([]);
    setStarter(null);
    await saveActiveGame(null);
    setPhase('no_game');
  }

  async function handleNewGame() {
    setGame(null);
    setSelectedTrump(null);
    setPlayerOrder([]);
    setPendingParticipants([]);
    setStarter(null);
    await saveActiveGame(null);
    setPhase('no_game');
  }

  // --- Render phases ---

  if (phase === 'loading') {
    return (
      <RNView style={[styles.center, { backgroundColor: colors.background }]}>
        <Text>Loading...</Text>
      </RNView>
    );
  }

  if (phase === 'no_game') {
    return <PlayerSelector players={players} onStart={handleStartGame} />;
  }

  if (phase === 'starter_select') {
    return (
      <StarterSelect
        participants={pendingParticipants}
        onSelect={handleStarterSelected}
        onBack={() => setPhase('no_game')}
      />
    );
  }

  if (phase === 'order_setup' && starter) {
    return (
      <OrderSetup
        initialOrder={playerOrder}
        starter={starter}
        onConfirm={handleOrderConfirmed}
        onBack={() => setPhase('starter_select')}
      />
    );
  }

  if (phase === 'game_finished' && game) {
    return (
      <GameFinished game={game} players={players} onNewGame={handleNewGame} />
    );
  }

  if (!game) return null;

  // Trump selection phase
  if (phase === 'trump_select') {
    return (
      <RNView style={[styles.fill, { backgroundColor: colors.background }]}>
        {/* Abandon confirmation modal */}
        <Modal
          visible={showAbandonModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAbandonModal(false)}
        >
          <RNView style={styles.modalOverlay}>
            <RNView style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Abandon Game
              </Text>
              <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                Do you really want to abandon the current game? It will not be saved.
              </Text>
              <RNView style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { borderColor: colors.border, borderWidth: 1 }]}
                  onPress={() => setShowAbandonModal(false)}
                >
                  <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: lossColor }]}
                  onPress={confirmAbandon}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Yes, abandon</Text>
                </TouchableOpacity>
              </RNView>
            </RNView>
          </RNView>
        </Modal>

        {/* Scrollable top: scoreboard + history */}
        <ScrollView contentContainerStyle={styles.content} scrollEnabled={!isDragging}>
          <ScoreBoard game={game} playerOrder={playerOrder} onReorder={setPlayerOrder} onDragActive={setIsDragging} />
          {game.rounds.length > 0 && <GameHistory game={game} />}
        </ScrollView>

        {/* Fixed bottom: action buttons + trump selector */}
        <RNView style={[styles.bottomArea, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {game.rounds.length > 0 && (
            <RNView style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: accentColor }]}
                onPress={handleUndo}
              >
                <Text style={{ color: accentColor, fontWeight: '600' }}>Undo</Text>
              </TouchableOpacity>
            </RNView>
          )}

          <TrumpSelector
            roundNumber={game.rounds.length + 1}
            currentPlayer={getCurrentTurnPlayer(game, game.rounds.length + 1)}
            onSelect={handleTrumpSelected}
          />
        </RNView>
      </RNView>
    );
  }

  // Score input phase
  if (phase === 'score_input' && selectedTrump) {
    return (
      <RoundInput
        game={game}
        players={players}
        trump={selectedTrump}
        playerOrder={playerOrder}
        onSubmit={handleSubmitRound}
        onBack={() => {
          setSelectedTrump(null);
          setPhase('trump_select');
        }}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 8 },
  bottomArea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  actionBtn: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalBox: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
});
