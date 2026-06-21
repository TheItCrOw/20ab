import React, { useState } from 'react';
import {
  StyleSheet, TouchableOpacity, ScrollView, View as RNView, Platform,
  Modal, Pressable, TextInput, ActivityIndicator,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Themed';
import Colors, { win, winBg, loss, lossBg, finish, finishBg, accent } from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { Game, Player } from '@/models/types';
import { getAllScores } from '@/services/gameLogic';
import { uploadGames } from '@/services/api';
import GameHistory from './GameHistory';

interface Props {
  game: Game;
  players: Player[];
  onNewGame: () => void;
}

export default function GameFinished({ game, players, onNewGame }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const accentColor = colorScheme === 'dark' ? accent.dark : accent.light;
  const winColor = colorScheme === 'dark' ? win.dark : win.light;
  const winBgColor = colorScheme === 'dark' ? winBg.dark : winBg.light;
  const lossColor = colorScheme === 'dark' ? loss.dark : loss.light;
  const lossBgColor = colorScheme === 'dark' ? lossBg.dark : lossBg.light;
  const finishColor = colorScheme === 'dark' ? finish.dark : finish.light;
  const finishBgColor = colorScheme === 'dark' ? finishBg.dark : finishBg.light;

  const insets = useSafeAreaInsets();
  const scores = getAllScores(game);

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  async function handleUpload() {
    setUploadStatus('loading');
    try {
      const result = await uploadGames([game], password);
      if (result.success) {
        setUploadStatus('success');
        setUploadMessage(result.message ?? 'Game uploaded to the dashboard.');
      } else {
        setUploadStatus('error');
        setUploadMessage(result.error ?? 'Upload failed.');
      }
    } catch (e: any) {
      setUploadStatus('error');
      setUploadMessage(e?.message ?? 'Upload failed. Please try again.');
    }
  }

  function closeUploadModal() {
    setUploadModalVisible(false);
    setPassword('');
    setUploadStatus('idle');
    setUploadMessage('');
  }

  const findName = (username: string | null) => {
    if (!username) return '–';
    return players.find((p) => p.username === username)?.name ?? username;
  };

  return (
    <ScrollView
      style={[{ flex: 1, backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.pageTitle, { color: colors.text }]}>Game Over</Text>
      <Text style={[styles.roundsInfo, { color: colors.textSecondary }]}>
        {game.rounds.length} rounds played
        {game.tiebreak ? ` · ${game.tiebreak.rounds.length} tiebreaker` : ''}
      </Text>

      {/* Result cards */}
      <RNView style={styles.resultRow}>
        {/* Finisher */}
        <RNView style={[styles.resultCard, { backgroundColor: winBgColor, borderColor: winColor + '40' }]}>
          <Text style={styles.resultEmoji}>👑</Text>
          <Text style={[styles.resultLabel, { color: winColor }]}>FINISHER</Text>
          <Text style={[styles.resultName, { color: colors.text }]}>
            {findName(game.finisher)}
          </Text>
          <Text style={[styles.resultScore, { color: winColor }]}>
            {game.finisher ? scores[game.finisher] : '–'} pts
          </Text>
        </RNView>

        {/* Loser */}
        <RNView style={[styles.resultCard, { backgroundColor: lossBgColor, borderColor: lossColor + '40' }]}>
          <Text style={styles.resultEmoji}>💀</Text>
          <Text style={[styles.resultLabel, { color: lossColor }]}>LOSER</Text>
          <Text style={[styles.resultName, { color: colors.text }]}>
            {findName(game.loser)}
          </Text>
          <Text style={[styles.resultScore, { color: lossColor }]}>
            {game.loser ? scores[game.loser] : '–'} pts
          </Text>
        </RNView>
      </RNView>

      {/* Winners */}
      {game.winners.length > 0 && (
        <RNView style={[styles.winnersCard, { backgroundColor: finishBgColor, borderColor: finishColor + '40' }]}>
          <Text style={[styles.sectionLabel, { color: finishColor }]}>WINNERS</Text>
          <RNView style={styles.winnersRow}>
            {game.winners
              .sort((a, b) => (scores[a] ?? 0) - (scores[b] ?? 0))
              .map((username) => (
                <RNView key={username} style={[styles.winnerChip, { backgroundColor: finishColor + '18', borderColor: finishColor + '30' }]}>
                  <Text style={[styles.winnerChipText, { color: finishColor }]}>
                    {findName(username)}  ·  {scores[username]} pts
                  </Text>
                </RNView>
              ))}
          </RNView>
        </RNView>
      )}

      {/* Full scores */}
      <RNView style={[styles.scoresCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>FINAL SCORES</Text>
        {game.participants
          .sort((a, b) => (scores[a] ?? 0) - (scores[b] ?? 0))
          .map((username, idx) => (
            <RNView
              key={username}
              style={[
                styles.scoreRow,
                { borderBottomColor: colors.border },
                idx === game.participants.length - 1 && { borderBottomWidth: 0 },
              ]}
            >
              <Text style={[styles.scoreRank, { color: colors.textTertiary }]}>{idx + 1}</Text>
              <Text style={[styles.scoreName, { color: colors.text }]}>{findName(username)}</Text>
              <Text style={[styles.scoreValue, { color: colors.text }]}>{scores[username]}</Text>
            </RNView>
          ))}
      </RNView>

      {/* Game log */}
      <GameHistory game={game} />

      {/* Upload button */}
      <TouchableOpacity
        style={[styles.uploadBtn, { borderColor: accentColor }]}
        onPress={() => setUploadModalVisible(true)}
        activeOpacity={0.85}
      >
        <FontAwesome name="cloud-upload" size={16} color={accentColor} style={{ marginRight: 8 }} />
        <Text style={[styles.uploadBtnText, { color: accentColor }]}>Upload to Dashboard</Text>
      </TouchableOpacity>

      {/* New game button */}
      <TouchableOpacity
        style={[styles.newGameBtn, { backgroundColor: accentColor }]}
        onPress={onNewGame}
        activeOpacity={0.85}
      >
        <Text style={styles.newGameText}>New Game</Text>
      </TouchableOpacity>

      {/* Upload modal */}
      <Modal
        visible={uploadModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeUploadModal}
      >
        <RNView style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <RNView style={[styles.modalHeader, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
            <RNView style={{ width: 64 }} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {uploadStatus === 'success' ? 'Upload Complete' :
               uploadStatus === 'error' ? 'Upload Failed' :
               uploadStatus === 'loading' ? 'Uploading…' : 'Upload to Dashboard'}
            </Text>
            <Pressable style={{ width: 64, alignItems: 'flex-end', padding: 4 }} onPress={closeUploadModal}>
              <FontAwesome name="times" size={18} color={colors.textSecondary} />
            </Pressable>
          </RNView>

          {uploadStatus === 'loading' ? (
            <RNView style={styles.modalCenter}>
              <ActivityIndicator size="large" color={accentColor} />
              <Text style={[styles.modalSubtext, { color: colors.textSecondary, marginTop: 16 }]}>
                Uploading to dashboard…
              </Text>
            </RNView>
          ) : uploadStatus === 'success' ? (
            <RNView style={styles.modalCenter}>
              <RNView style={[styles.modalIcon, { backgroundColor: accentColor + '22' }]}>
                <FontAwesome name="cloud-upload" size={48} color={accentColor} />
              </RNView>
              <Text style={[styles.modalResultTitle, { color: colors.text }]}>Game uploaded</Text>
              <Text style={[styles.modalSubtext, { color: colors.textSecondary }]}>{uploadMessage}</Text>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: accentColor, marginTop: 24 }]}
                onPress={closeUploadModal}
              >
                <Text style={styles.modalBtnText}>Done</Text>
              </Pressable>
            </RNView>
          ) : uploadStatus === 'error' ? (
            <RNView style={styles.modalCenter}>
              <Text style={[styles.modalResultTitle, { color: '#EF4444' }]}>Something went wrong</Text>
              <Text style={[styles.modalSubtext, { color: colors.textSecondary }]}>{uploadMessage}</Text>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: accentColor, marginTop: 24 }]}
                onPress={() => setUploadStatus('idle')}
              >
                <Text style={styles.modalBtnText}>Try Again</Text>
              </Pressable>
            </RNView>
          ) : (
            <>
              <Text style={[styles.modalSubtext, { color: colors.textSecondary, paddingHorizontal: 16, paddingTop: 12 }]}>
                Enter the admin password to upload this game to the dashboard.
              </Text>
              <RNView style={{ padding: 16, paddingTop: 12 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Admin Password</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </RNView>
              <RNView style={{ paddingHorizontal: 16 }}>
                <Pressable
                  style={[styles.modalBtn, { backgroundColor: accentColor }, !password && { opacity: 0.4 }]}
                  disabled={!password}
                  onPress={handleUpload}
                >
                  <Text style={styles.modalBtnText}>Upload</Text>
                </Pressable>
              </RNView>
            </>
          )}
        </RNView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: 4,
  },
  roundsInfo: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 24,
  },
  resultRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  resultCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  resultEmoji: { fontSize: 28, marginBottom: 4 },
  resultLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  resultName: { fontSize: 17, fontWeight: '800', textAlign: 'center' },
  resultScore: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  winnersCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  winnersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  winnerChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  winnerChipText: { fontSize: 13, fontWeight: '600' },
  scoresCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#28285A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  scoreRank: { width: 22, fontSize: 12, fontWeight: '600' },
  scoreName: { flex: 1, fontSize: 15, fontWeight: '500' },
  scoreValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  uploadBtn: {
    marginTop: 20,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  uploadBtnText: { fontSize: 15, fontWeight: '700' },
  newGameBtn: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  newGameText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalResultTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtext: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  modalBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
