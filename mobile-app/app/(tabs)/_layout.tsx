import React from 'react';
import { Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors, { accent } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const accentColor = colorScheme === 'dark' ? accent.dark : accent.light;

  // useSafeAreaInsets gives us the height of the Android system navigation bar
  // (back / home / recents buttons). We must add this to the tab bar so it
  // sits ABOVE those buttons, not behind them.
  const insets = useSafeAreaInsets();
  const TAB_BAR_BASE = 58; // visible content height of the tab bar
  const BOTTOM_EXTRA = 10; // extra breathing room above the system nav bar
  const tabBarHeight = TAB_BAR_BASE + insets.bottom + BOTTOM_EXTRA;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarShowLabel: Platform.OS !== 'web',
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          // Height = visible area + system navigation bar
          height: tabBarHeight,
          // Push tab labels/icons above the system bar
          paddingBottom: insets.bottom + BOTTOM_EXTRA + 4,
          paddingTop: 10,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
          letterSpacing: -0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Game',
          tabBarIcon: ({ color }) => <TabBarIcon name="play-circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <TabBarIcon name="history" color={color} />,
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: 'Players',
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabBarIcon name="sliders" color={color} />,
        }}
      />
    </Tabs>
  );
}
