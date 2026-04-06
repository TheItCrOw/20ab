import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import Colors, { accent } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAppTheme } from '@/contexts/ThemeContext';
import ExportModal from '@/components/ExportModal';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const accentColor = colorScheme === 'dark' ? accent.dark : accent.light;
  const { setColorScheme, resetToSystem, isManual } = useAppTheme();

  const [exportVisible, setExportVisible] = useState(false);

  const isDark = colorScheme === 'dark';

  function handleToggle(value: boolean) {
    setColorScheme(value ? 'dark' : 'light');
  }

  const s = makeStyles(colors, accentColor);

  return (
    <>
      <ScrollView style={s.container} contentContainerStyle={s.content}>

        <Text style={s.sectionLabel}>APPEARANCE</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowText}>
              <Text style={s.rowTitle}>Dark Mode</Text>
              <Text style={s.rowSubtitle}>
                {isManual ? 'Manual override active' : 'Follows system setting'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={handleToggle}
              trackColor={{ false: colors.border, true: accentColor }}
              thumbColor={colors.surface}
            />
          </View>
          {isManual && (
            <>
              <View style={s.divider} />
              <Text style={s.resetLink} onPress={resetToSystem}>
                Reset to system default
              </Text>
            </>
          )}
        </View>

        <Text style={[s.sectionLabel, { marginTop: 24 }]}>DATA</Text>
        <View style={s.card}>
          <Pressable
            style={({ pressed }) => [s.row, pressed && { opacity: 0.6 }]}
            onPress={() => setExportVisible(true)}
          >
            <View style={[s.iconWrap, { backgroundColor: accentColor + '1A' }]}>
              <FontAwesome name="upload" size={16} color={accentColor} />
            </View>
            <View style={s.rowText}>
              <Text style={s.rowTitle}>Export Game History</Text>
              <Text style={s.rowSubtitle}>
                Download or share games in dashboard format
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color={colors.textTertiary} />
          </Pressable>
        </View>

      </ScrollView>

      <ExportModal
        visible={exportVisible}
        onClose={() => setExportVisible(false)}
      />
    </>
  );
}

function makeStyles(colors: typeof Colors['dark'], accentColor: string) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      paddingTop: 20,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      color: colors.textTertiary,
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: {
      flex: 1,
    },
    rowTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    rowSubtitle: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 16,
    },
    resetLink: {
      fontSize: 13,
      color: accentColor,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
  });
}
