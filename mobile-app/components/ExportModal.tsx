import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import Colors, { accent } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Game } from '@/models/types';
import {
  emailGames,
  formatGameLabel,
  saveGamesToDevice,
  shareGames,
} from '@/services/exportService';
import { getGames } from '@/services/storage';

type Step = 'select' | 'method';
type ExportMethod = 'device' | 'email' | 'whatsapp';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ExportModal({ visible, onClose }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const accentColor = colorScheme === 'dark' ? accent.dark : accent.light;

  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>('select');
  const [games, setGames] = useState<Game[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Load completed games whenever modal opens
  useEffect(() => {
    if (visible) {
      setStep('select');
      setSelected(new Set());
      setStatus(null);
      getGames().then((all) => {
        const completed = all
          .filter((g) => !g.inProgress)
          .sort((a, b) => b.date.localeCompare(a.date));
        setGames(completed);
      });
    }
  }, [visible]);

  const s = makeStyles(colors, accentColor, insets);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(games.map((g) => g.id)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  const allSelected = games.length > 0 && selected.size === games.length;

  function selectedGames(): Game[] {
    return games.filter((g) => selected.has(g.id));
  }

  async function handleExport(method: ExportMethod) {
    setLoading(true);
    setStatus(null);
    try {
      const toExport = selectedGames();
      if (method === 'device') {
        await saveGamesToDevice(toExport);
        setStatus('done');
      } else if (method === 'email') {
        const ok = await emailGames(toExport);
        if (!ok) {
          setStatus('Email is not available on this device.');
        } else {
          setStatus('done');
        }
      } else {
        await shareGames(toExport);
        setStatus('done');
      }
    } catch (e: any) {
      setStatus(e?.message ?? 'Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setStep('select');
    setSelected(new Set());
    setStatus(null);
    onClose();
  }

  // ---- Render helpers ----

  function renderHeader(title: string, canGoBack?: boolean) {
    return (
      <View style={s.header}>
        {canGoBack ? (
          <Pressable style={s.backBtn} onPress={() => setStep('select')}>
            <FontAwesome name="chevron-left" size={14} color={colors.textSecondary} />
            <Text style={s.backText}>Back</Text>
          </Pressable>
        ) : (
          <View style={s.backBtn} />
        )}
        <Text style={s.headerTitle}>{title}</Text>
        <Pressable style={s.closeBtn} onPress={handleClose}>
          <FontAwesome name="times" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>
    );
  }

  // Step 1: select games
  function renderSelectStep() {
    return (
      <>
        {renderHeader('Export Games')}

        <Text style={s.subtitle}>
          Select the games you want to export. Exported files match the dashboard
          format and can be placed in its{' '}
          <Text style={s.mono}>games/</Text> folder for visualisation.
        </Text>

        <View style={s.selectAllRow}>
          <Text style={s.selectCount}>
            {selected.size} of {games.length} selected
          </Text>
          <Pressable onPress={allSelected ? deselectAll : selectAll}>
            <Text style={[s.selectAllText, { color: accentColor }]}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </Pressable>
        </View>

        {games.length === 0 ? (
          <View style={s.empty}>
            <FontAwesome name="inbox" size={32} color={colors.textTertiary} />
            <Text style={s.emptyText}>No completed games yet</Text>
          </View>
        ) : (
          <ScrollView style={s.gameList} contentContainerStyle={s.gameListContent}>
            {games.map((game) => {
              const checked = selected.has(game.id);
              return (
                <Pressable
                  key={game.id}
                  style={[s.gameRow, checked && s.gameRowSelected]}
                  onPress={() => toggleSelect(game.id)}
                >
                  <View style={[s.checkbox, checked && { backgroundColor: accentColor, borderColor: accentColor }]}>
                    {checked && <FontAwesome name="check" size={10} color="#fff" />}
                  </View>
                  <View style={s.gameInfo}>
                    <Text style={s.gameDate}>{formatGameLabel(game)}</Text>
                    <Text style={s.gameParticipants} numberOfLines={1}>
                      {game.participants.join(', ')}
                    </Text>
                  </View>
                  <Text style={s.gameRounds}>{game.rounds.length}R</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <View style={s.footer}>
          <Pressable
            style={[s.primaryBtn, selected.size === 0 && s.primaryBtnDisabled]}
            disabled={selected.size === 0}
            onPress={() => setStep('method')}
          >
            <Text style={s.primaryBtnText}>
              Continue{selected.size > 0 ? ` (${selected.size})` : ''}
            </Text>
          </Pressable>
        </View>
      </>
    );
  }

  // Step 2: choose export method
  function renderMethodStep() {
    const count = selected.size;

    if (status === 'done') {
      return (
        <>
          {renderHeader('Export Complete', true)}
          <View style={s.successContainer}>
            <View style={[s.successIcon, { backgroundColor: accentColor + '22' }]}>
              <FontAwesome name="check-circle" size={48} color={accentColor} />
            </View>
            <Text style={s.successTitle}>
              {count} game{count !== 1 ? 's' : ''} exported
            </Text>
            <Text style={s.successSub}>
              The file is ready. Place it in your dashboard's{' '}
              <Text style={s.mono}>games/</Text> folder to visualise it.
            </Text>
            <Pressable style={[s.primaryBtn, { marginTop: 24 }]} onPress={handleClose}>
              <Text style={s.primaryBtnText}>Done</Text>
            </Pressable>
          </View>
        </>
      );
    }

    if (status && status !== 'done') {
      return (
        <>
          {renderHeader('Export Failed', true)}
          <View style={s.successContainer}>
            <Text style={[s.successTitle, { color: '#EF4444' }]}>Something went wrong</Text>
            <Text style={s.successSub}>{status}</Text>
            <Pressable
              style={[s.primaryBtn, { marginTop: 24 }]}
              onPress={() => setStatus(null)}
            >
              <Text style={s.primaryBtnText}>Try Again</Text>
            </Pressable>
          </View>
        </>
      );
    }

    if (loading) {
      return (
        <>
          {renderHeader('Exporting…')}
          <View style={s.successContainer}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={[s.successSub, { marginTop: 16 }]}>Preparing your file…</Text>
          </View>
        </>
      );
    }

    return (
      <>
        {renderHeader('Choose Method', true)}
        <Text style={s.subtitle}>
          Exporting {count} game{count !== 1 ? 's' : ''} as{' '}
          <Text style={s.mono}>
            {count === 1
              ? `game_${selectedGames()[0]?.date.slice(0, 10)}.json`
              : `20ab_export_${new Date().toISOString().slice(0, 10)}.json`}
          </Text>
        </Text>

        <View style={s.methodList}>
          <MethodCard
            icon="download"
            title="Save to Device"
            subtitle="Download the JSON file to your phone storage"
            colors={colors}
            accentColor={accentColor}
            onPress={() => handleExport('device')}
          />
          <MethodCard
            icon="envelope"
            title="Send via Email"
            subtitle="Attach the file to an email"
            colors={colors}
            accentColor={accentColor}
            onPress={() => handleExport('email')}
          />
          <MethodCard
            icon="share-alt"
            title="WhatsApp / Other Apps"
            subtitle="Share the file via WhatsApp, Telegram, or any installed app"
            colors={colors}
            accentColor={accentColor}
            onPress={() => handleExport('whatsapp')}
          />
        </View>
      </>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={s.container}>
        {step === 'select' ? renderSelectStep() : renderMethodStep()}
      </View>
    </Modal>
  );
}

// ---- MethodCard ----

interface MethodCardProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  subtitle: string;
  colors: (typeof Colors)['dark'];
  accentColor: string;
  onPress: () => void;
}

function MethodCard({ icon, title, subtitle, colors, accentColor, onPress }: MethodCardProps) {
  const s = StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: accentColor + '1A',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    title: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 2,
    },
    arrow: {
      marginLeft: 'auto',
    },
  });

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <View style={s.iconWrap}>
        <FontAwesome name={icon} size={18} color={accentColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>{title}</Text>
        <Text style={s.subtitle}>{subtitle}</Text>
      </View>
      <FontAwesome
        name="chevron-right"
        size={12}
        color={colors.textTertiary}
        style={s.arrow}
      />
    </Pressable>
  );
}

// ---- Styles ----

function makeStyles(
  colors: (typeof Colors)['dark'],
  accentColor: string,
  insets: { top: number; bottom: number },
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: insets.top + 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      width: 64,
      gap: 4,
    },
    backText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    closeBtn: {
      width: 64,
      alignItems: 'flex-end',
      padding: 4,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 4,
      lineHeight: 18,
    },
    mono: {
      fontFamily: 'SpaceMono',
      fontSize: 12,
      color: accentColor,
    },
    selectAllRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    selectCount: {
      fontSize: 12,
      color: colors.textTertiary,
      fontWeight: '600',
    },
    selectAllText: {
      fontSize: 13,
      fontWeight: '600',
    },
    gameList: {
      flex: 1,
    },
    gameListContent: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    gameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
    },
    gameRowSelected: {
      borderColor: accentColor,
      backgroundColor: accentColor + '0D',
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.textTertiary,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gameInfo: {
      flex: 1,
    },
    gameDate: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    gameParticipants: {
      fontSize: 12,
      color: colors.textTertiary,
      marginTop: 2,
    },
    gameRounds: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textTertiary,
      marginLeft: 8,
    },
    footer: {
      padding: 16,
      paddingBottom: insets.bottom + 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    primaryBtn: {
      backgroundColor: accentColor,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryBtnDisabled: {
      opacity: 0.4,
    },
    primaryBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
    },
    methodList: {
      padding: 16,
      paddingTop: 12,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingVertical: 48,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textTertiary,
    },
    successContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    successIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    successTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    successSub: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
}
