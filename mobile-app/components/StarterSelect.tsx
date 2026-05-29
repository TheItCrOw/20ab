import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View as RNView, Platform } from 'react-native';
import { Text } from './Themed';
import Colors, { accent } from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

interface Props {
  participants: string[];
  onSelect: (starter: string) => void;
  onBack: () => void;
}

export default function StarterSelect({ participants, onSelect, onBack }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const accentColor = colorScheme === 'dark' ? accent.dark : accent.light;

  const [selected, setSelected] = useState<string | null>(null);

  return (
    <RNView style={[styles.container, { backgroundColor: colors.background }]}>
      <RNView style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Who starts?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Tap the player who goes first (not who deals first)
        </Text>
      </RNView>

      <RNView style={styles.grid}>
        {participants.map((username) => {
          const isSelected = selected === username;
          return (
            <TouchableOpacity
              key={username}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? accentColor : colors.surface,
                  borderColor: isSelected ? accentColor : colors.border,
                },
                isSelected && styles.chipSelected,
              ]}
              onPress={() => setSelected(username)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, { color: isSelected ? '#fff' : colors.text }]}>
                {username}
              </Text>
            </TouchableOpacity>
          );
        })}
      </RNView>

      <RNView style={styles.buttons}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: colors.border }]}
          onPress={onBack}
        >
          <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 15 }}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: selected ? accentColor : colors.border }]}
          onPress={() => selected && onSelect(selected)}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <Text style={[styles.confirmText, { color: selected ? '#fff' : colors.textTertiary }]}>
            Confirm
          </Text>
        </TouchableOpacity>
      </RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingBottom: 32 },
  header: { alignItems: 'center', paddingTop: 48, paddingBottom: 32 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, fontWeight: '500' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    flex: 1,
    alignContent: 'flex-start',
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  chipSelected: {
    ...Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  chipText: { fontSize: 16, fontWeight: '600' },
  buttons: { flexDirection: 'row', gap: 10 },
  backBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 16, alignItems: 'center' },
  confirmBtn: {
    flex: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  confirmText: { fontSize: 16, fontWeight: '700' },
});
