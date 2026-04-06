import React, { useCallback, useState } from 'react';
import {
  StyleSheet, FlatList, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Modal, View as RNView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Text } from '@/components/Themed';
import Colors, { accent, loss } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Player } from '@/models/types';
import { getPlayers, addPlayer, removePlayer, updatePlayer, seedPlayersIfEmpty } from '@/services/storage';

export default function PlayersScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const accentColor = colorScheme === 'dark' ? accent.dark : accent.light;
  const lossColor = colorScheme === 'dark' ? loss.dark : loss.light;

  const [players, setPlayers] = useState<Player[]>([]);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [removeTarget, setRemoveTarget] = useState<Player | null>(null);

  useFocusEffect(
    useCallback(() => {
      seedPlayersIfEmpty().then(() => getPlayers().then(setPlayers));
    }, [])
  );

  async function handleAdd() {
    const u = username.trim();
    const n = fullName.trim() || u;
    if (!u) return;
    try {
      await addPlayer({ username: u, name: n });
      setPlayers(await getPlayers());
      setUsername('');
      setFullName('');
    } catch (e: any) {
      // username already exists — silently ignore or show inline
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    await removePlayer(removeTarget.username);
    setPlayers(await getPlayers());
    setRemoveTarget(null);
  }

  function openEdit(p: Player) {
    setEditingPlayer(p);
    setEditUsername(p.username);
    setEditFullName(p.name);
  }

  async function handleSaveEdit() {
    if (!editingPlayer) return;
    const u = editUsername.trim();
    const n = editFullName.trim() || u;
    if (!u) return;
    try {
      await updatePlayer(editingPlayer.username, { username: u, name: n });
      setPlayers(await getPlayers());
      setEditingPlayer(null);
    } catch { }
  }

  const inputStyle = [styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <RNView style={[styles.container, { backgroundColor: colors.background }]}>

        {/* Add player card */}
        <RNView style={[styles.addCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ADD PLAYER</Text>
          <TextInput
            style={inputStyle}
            placeholder="Short name (e.g. Kevin)"
            placeholderTextColor={colors.textTertiary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="words"
          />
          <TextInput
            style={inputStyle}
            placeholder="Full name (optional)"
            placeholderTextColor={colors.textTertiary}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: username.trim() ? accentColor : colors.border }]}
            onPress={handleAdd}
            activeOpacity={0.85}
            disabled={!username.trim()}
          >
            <Text style={{ color: username.trim() ? '#fff' : colors.textTertiary, fontWeight: '700', fontSize: 15 }}>
              Add Player
            </Text>
          </TouchableOpacity>
        </RNView>

        <Text style={[styles.listLabel, { color: colors.textSecondary }]}>
          PLAYERS ({players.length})
        </Text>

        {/* Player list */}
        <FlatList
          data={players}
          keyExtractor={(item) => item.username}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <RNView style={[styles.playerRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => openEdit(item)} activeOpacity={0.7}>
                <Text style={[styles.playerUsername, { color: colors.text }]}>{item.username}</Text>
                {item.name !== item.username && (
                  <Text style={[styles.playerFullName, { color: colors.textSecondary }]}>{item.name}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editBtn, { borderColor: accentColor }]}
                onPress={() => openEdit(item)}
              >
                <Text style={{ color: accentColor, fontSize: 12, fontWeight: '700' }}>EDIT</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.removeBtn, { borderColor: lossColor + '60' }]}
                onPress={() => setRemoveTarget(item)}
              >
                <Text style={{ color: lossColor, fontSize: 12, fontWeight: '700' }}>REMOVE</Text>
              </TouchableOpacity>
            </RNView>
          )}
        />

        {/* Edit modal */}
        <Modal visible={editingPlayer !== null} transparent animationType="fade" onRequestClose={() => setEditingPlayer(null)}>
          <RNView style={styles.modalOverlay}>
            <RNView style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Player</Text>
              <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="Short name" placeholderTextColor={colors.textTertiary}
                value={editUsername} onChangeText={setEditUsername} autoCapitalize="words" />
              <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="Full name" placeholderTextColor={colors.textTertiary}
                value={editFullName} onChangeText={setEditFullName} autoCapitalize="words" />
              <RNView style={styles.modalBtns}>
                <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border, borderWidth: 1 }]} onPress={() => setEditingPlayer(null)}>
                  <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: accentColor }]} onPress={handleSaveEdit}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
                </TouchableOpacity>
              </RNView>
            </RNView>
          </RNView>
        </Modal>

        {/* Remove confirmation modal */}
        <Modal visible={removeTarget !== null} transparent animationType="fade" onRequestClose={() => setRemoveTarget(null)}>
          <RNView style={styles.modalOverlay}>
            <RNView style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Remove Player</Text>
              <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                Remove "{removeTarget?.username}" from the player list?
              </Text>
              <RNView style={styles.modalBtns}>
                <TouchableOpacity style={[styles.modalBtn, { borderColor: colors.border, borderWidth: 1 }]} onPress={() => setRemoveTarget(null)}>
                  <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: lossColor }]} onPress={confirmRemove}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Remove</Text>
                </TouchableOpacity>
              </RNView>
            </RNView>
          </RNView>
        </Modal>
      </RNView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addCard: { margin: 16, borderRadius: 12, borderWidth: 1, padding: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 8 },
  addBtn: { borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 2 },
  listLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.4,
    paddingHorizontal: 16, marginBottom: 8,
  },
  list: { paddingHorizontal: 16, gap: 8, paddingBottom: 32 },
  playerRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderRadius: 10, borderWidth: 1, gap: 8,
  },
  playerUsername: { fontSize: 15, fontWeight: '700' },
  playerFullName: { fontSize: 12, marginTop: 1 },
  editBtn: { borderWidth: 1.5, borderRadius: 6, paddingVertical: 5, paddingHorizontal: 8 },
  removeBtn: { borderWidth: 1.5, borderRadius: 6, paddingVertical: 5, paddingHorizontal: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalBox: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  modalMessage: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
});
