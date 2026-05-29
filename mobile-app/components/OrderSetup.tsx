import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View as RNView,
  Platform,
  PanResponder,
  Animated,
  GestureResponderHandlers,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Text } from './Themed';
import Colors, { accent } from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import * as Haptics from 'expo-haptics';

const ITEM_HEIGHT = 52;

interface DragState {
  grabIdx: number;
  hoverIdx: number;
}

interface Props {
  initialOrder: string[];
  starter: string;
  onConfirm: (order: string[]) => void;
  onBack: () => void;
}

export default function OrderSetup({ initialOrder, starter, onConfirm, onBack }: Props) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const accentColor = colorScheme === 'dark' ? accent.dark : accent.light;

  const [order, setOrder] = useState<string[]>(initialOrder);
  const orderRef = useRef(order);
  orderRef.current = order;

  const dragAnim = useRef(new Animated.Value(0)).current;
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const grabIdxRef = useRef(0);

  function updateDragState(next: DragState | null) {
    dragStateRef.current = next;
    setDragState(next);
  }

  // --- Stable PanResponder per username ---

  const panCache = useRef<Record<string, GestureResponderHandlers>>({});

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
          setOrder(next);
        }

        dragAnim.setValue(0);
        updateDragState(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },

      onPanResponderTerminate: () => {
        dragAnim.setValue(0);
        updateDragState(null);
      },
    }).panHandlers;

    panCache.current[username] = handlers;
    return handlers;
  }

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
    <RNView style={[styles.container, { backgroundColor: colors.background }]}>
      <RNView style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Player Order</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Drag to set the seating order
        </Text>
      </RNView>

      <RNView style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {order.map((username, idx) => {
          const isStarter = username === starter;
          const isActive = dragState?.grabIdx === idx;
          const translateY = getTranslateY(idx);

          return (
            <Animated.View
              key={username}
              style={[
                isActive && styles.rowLifted,
                { transform: [{ translateY: translateY as any }] },
              ]}
            >
              <RNView
                style={[
                  styles.row,
                  { borderBottomColor: colors.border, backgroundColor: colors.surface },
                  idx === order.length - 1 && styles.rowLast,
                ]}
              >
                <Text style={[styles.rank, { color: colors.textTertiary }]}>{idx + 1}</Text>
                <Text style={[styles.name, { color: colors.text }, isStarter && { color: accentColor, fontWeight: '700' }]}>
                  {username}
                </Text>
                {isStarter && (
                  <RNView style={[styles.badge, { backgroundColor: `${accentColor}1A` }]}>
                    <Text style={[styles.badgeText, { color: accentColor }]}>starts</Text>
                  </RNView>
                )}
                <RNView {...getPanHandlers(username)} style={styles.dragHandle}>
                  <MaterialIcons name="drag-indicator" size={22} color={colors.textTertiary} />
                </RNView>
              </RNView>
            </Animated.View>
          );
        })}
      </RNView>

      <RNView style={{ flex: 1 }} />

      <RNView style={styles.buttons}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: colors.border }]}
          onPress={onBack}
        >
          <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 15 }}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: accentColor }]}
          onPress={() => onConfirm(order)}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmText}>Start Game</Text>
        </TouchableOpacity>
      </RNView>
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingBottom: 32 },
  header: { alignItems: 'center', paddingTop: 48, paddingBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, fontWeight: '500' },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#28285A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(40,40,90,0.10)' },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingLeft: 16,
    paddingRight: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: ITEM_HEIGHT,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLifted: {
    zIndex: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 10 },
      android: { elevation: 8 },
      web: { boxShadow: '0 6px 10px rgba(0,0,0,0.18)' },
    }),
  },
  rank: { width: 24, fontSize: 14, fontWeight: '600' },
  name: { flex: 1, fontSize: 16, fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, marginRight: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  dragHandle: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
