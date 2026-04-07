import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View as RNView,
  Platform,
  PanResponder,
  Animated,
  GestureResponderHandlers,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Text } from './Themed';
import Colors, { win, loss } from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { Game, SCORE_WIN, SCORE_LOSE } from '@/models/types';
import { getCurrentScore } from '@/services/gameLogic';
import * as Haptics from 'expo-haptics';

/** Must match styles.row.height so hover-slot math is correct. */
const ITEM_HEIGHT = 46;

interface DragState {
  grabIdx: number;
  hoverIdx: number;
}

interface Props {
  game: Game;
  /** The canonical display order, owned by the parent. */
  playerOrder: string[];
  /** Called with the new order when the user finishes a drag. */
  onReorder: (order: string[]) => void;
  /** Called when a drag gesture starts (true) or ends (false). */
  onDragActive?: (active: boolean) => void;
}

export default function ScoreBoard({ game, playerOrder, onReorder, onDragActive }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const winColor = colorScheme === 'dark' ? win.dark : win.light;
  const lossColor = colorScheme === 'dark' ? loss.dark : loss.light;

  // --- Refs for values accessed inside PanResponder callbacks ---
  const orderRef = useRef(playerOrder);
  orderRef.current = playerOrder;

  const dragAnim = useRef(new Animated.Value(0)).current;
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const grabIdxRef = useRef(0);

  function updateDragState(next: DragState | null) {
    dragStateRef.current = next;
    setDragState(next);
  }

  // --- Score map & rank list ---
  const scoreMap: Record<string, number> = {};
  for (const u of game.participants) {
    scoreMap[u] = getCurrentScore(game, u);
  }
  const byScore = [...game.participants].sort((a, b) => scoreMap[a] - scoreMap[b]);

  // --- Stable PanResponder per username (never recreated) ---

  const panCache = useRef<Record<string, GestureResponderHandlers>>({});
  // Keep refs to parent callbacks so the cached PanResponder closures stay fresh.
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;
  const onDragActiveRef = useRef(onDragActive);
  onDragActiveRef.current = onDragActive;

  function getPanHandlers(username: string): GestureResponderHandlers {
    if (panCache.current[username]) return panCache.current[username];

    const handlers = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: () => {
        const idx = orderRef.current.indexOf(username);
        grabIdxRef.current = idx;
        dragAnim.setValue(0);
        updateDragState({ grabIdx: idx, hoverIdx: idx });
        onDragActiveRef.current?.(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      },

      onPanResponderMove: (_, { dy }) => {
        const idx = grabIdxRef.current;
        const len = orderRef.current.length;
        const minDy = -idx * ITEM_HEIGHT;
        const maxDy = (len - 1 - idx) * ITEM_HEIGHT;
        dragAnim.setValue(Math.max(minDy, Math.min(maxDy, dy)));

        const newHover = Math.max(0, Math.min(len - 1, Math.round(idx + dy / ITEM_HEIGHT)));
        const prev = dragStateRef.current;
        if (prev && prev.hoverIdx !== newHover) {
          Haptics.selectionAsync();
          updateDragState({ grabIdx: idx, hoverIdx: newHover });
        }
      },

      onPanResponderRelease: (_, { dy }) => {
        const idx = grabIdxRef.current;
        const len = orderRef.current.length;
        const finalHover = Math.max(0, Math.min(len - 1, Math.round(idx + dy / ITEM_HEIGHT)));

        if (finalHover !== idx) {
          const next = [...orderRef.current];
          const [item] = next.splice(idx, 1);
          next.splice(finalHover, 0, item);
          onReorderRef.current(next);
        }

        dragAnim.setValue(0);
        updateDragState(null);
        onDragActiveRef.current?.(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },

      onPanResponderTerminate: () => {
        dragAnim.setValue(0);
        updateDragState(null);
        onDragActiveRef.current?.(false);
      },
    }).panHandlers;

    panCache.current[username] = handlers;
    return handlers;
  }

  // Invalidate cache if participants change (new game).
  const participantsKey = game.participants.join(',');
  const prevKey = useRef(participantsKey);
  useEffect(() => {
    if (prevKey.current !== participantsKey) {
      panCache.current = {};
      prevKey.current = participantsKey;
    }
  }, [participantsKey]);

  // --- Render helpers ---

  function getTranslateY(idx: number): number | Animated.Value {
    const ds = dragStateRef.current ?? dragState;
    if (!ds) return 0;
    const { grabIdx, hoverIdx } = ds;
    if (idx === grabIdx) return dragAnim;
    if (hoverIdx > grabIdx && idx > grabIdx && idx <= hoverIdx) return -ITEM_HEIGHT;
    if (hoverIdx < grabIdx && idx < grabIdx && idx >= hoverIdx) return ITEM_HEIGHT;
    return 0;
  }

  return (
    <RNView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SCOREBOARD</Text>

      {playerOrder.map((username, idx) => {
        const score = scoreMap[username] ?? 0;
        const scoreRank = byScore.indexOf(username);
        const isLeading = scoreRank === 0;
        const isDanger = scoreRank === byScore.length - 1 && byScore.length > 1;
        const nearWin = score <= 6 && score > SCORE_WIN;
        const nearLose = score >= 35 && score < SCORE_LOSE;
        const isActive = dragState?.grabIdx === idx;
        const translateY = getTranslateY(idx);

        return (
          <Animated.View
            key={username}
            style={[
              isActive && styles.rowLifted,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              { transform: [{ translateY: translateY as any }] },
            ]}
          >
            <RNView
              style={[
                styles.row,
                { borderBottomColor: colors.border, backgroundColor: colors.surface },
                idx === playerOrder.length - 1 && styles.rowLast,
              ]}
            >
              <RNView style={styles.rankBadge}>
                <Text style={[styles.rank, { color: colors.textTertiary }]}>
                  {scoreRank + 1}
                </Text>
              </RNView>

              <Text
                style={[
                  styles.name,
                  { color: colors.text },
                  isLeading && { color: winColor, fontWeight: '700' },
                  isDanger && { color: lossColor },
                ]}
              >
                {username}
              </Text>

              <RNView style={styles.rightCol}>
                {nearWin && (
                  <RNView style={[styles.badge, { backgroundColor: `${winColor}18` }]}>
                    <Text style={[styles.badgeText, { color: winColor }]}>almost done</Text>
                  </RNView>
                )}
                {nearLose && (
                  <RNView style={[styles.badge, { backgroundColor: `${lossColor}18` }]}>
                    <Text style={[styles.badgeText, { color: lossColor }]}>danger</Text>
                  </RNView>
                )}

                <Text
                  style={[
                    styles.score,
                    { color: colors.text },
                    isLeading && { color: winColor },
                    isDanger && { color: lossColor },
                  ]}
                >
                  {score}
                </Text>

                {/* Drag handle */}
                <RNView {...getPanHandlers(username)} style={styles.dragHandle}>
                  <MaterialIcons
                    name="drag-indicator"
                    size={20}
                    color={colors.textTertiary}
                  />
                </RNView>
              </RNView>
            </RNView>
          </Animated.View>
        );
      })}
    </RNView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#28285A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingLeft: 16,
    paddingRight: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: ITEM_HEIGHT,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLifted: {
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  rankBadge: { width: 22, marginRight: 10 },
  rank: { fontSize: 12, fontWeight: '600' },
  name: { flex: 1, fontSize: 16, fontWeight: '500' },
  rightCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  score: {
    fontSize: 20,
    fontWeight: '800',
    minWidth: 36,
    textAlign: 'right',
    letterSpacing: -0.5,
  },
  dragHandle: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
