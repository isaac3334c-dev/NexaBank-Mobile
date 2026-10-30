// Floating pill tab bar — ported from NexaBank-Frontend's TabBar.tsx
// (Home/Activity/[center QR FAB]/Cards/Profile). Not an Expo Router <Tabs>
// navigator — like the web reference (a fixed overlay inside AppLayout's
// Outlet, not a native tab switcher), each screen renders this directly and
// navigates via router.replace so switching tabs doesn't grow the stack.
import { CreditCard, Home, Receipt, ScanLine, User } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { Colors, Radius, Typography } from '@/constants/theme';

const colors = Colors.dark;

export type TabKey = 'home' | 'activity' | 'cards' | 'profile';

const TABS = [
  { key: 'home' as const, label: 'Inicio', route: '/home' as const, icon: Home },
  { key: 'activity' as const, label: 'Actividad', route: '/activity' as const, icon: Receipt },
  { key: 'cards' as const, label: 'Tarjetas', route: '/cards' as const, icon: CreditCard },
  { key: 'profile' as const, label: 'Perfil', route: '/profile' as const, icon: User },
];

export interface TabBarProps {
  active?: TabKey;
}

export function TabBar({ active }: TabBarProps) {
  const leftTabs = TABS.slice(0, 2);
  const rightTabs = TABS.slice(2);

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea} pointerEvents="box-none">
      <View style={styles.bar}>
        {leftTabs.map((tab) => (
          <TabLink key={tab.key} tab={tab} isActive={tab.key === active} />
        ))}

        <View style={styles.fabSlot}>
          <Pressable
            onPress={() => router.push('/scan')}
            accessibilityLabel="Escanear QR"
            style={styles.fab}
          >
            <ScanLine size={26} color={colors.onPrimary} strokeWidth={1.5} />
          </Pressable>
        </View>

        {rightTabs.map((tab) => (
          <TabLink key={tab.key} tab={tab} isActive={tab.key === active} />
        ))}
      </View>
    </SafeAreaView>
  );
}

function TabLink({ tab, isActive }: { tab: (typeof TABS)[number]; isActive: boolean }) {
  const Icon = tab.icon;
  return (
    <Pressable
      onPress={() => router.replace(tab.route)}
      style={styles.tab}
      accessibilityLabel={tab.label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Icon size={20} color={isActive ? colors.primary : colors.textSecondary} />
      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 64,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(20,22,25,0.92)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 44,
  },
  tabLabel: {
    ...Typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  tabLabelActive: {
    ...Typography.caption,
    fontSize: 11,
    fontFamily: Typography.bodyStrong.fontFamily,
    color: colors.primary,
  },
  fabSlot: {
    width: 64,
    alignItems: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -20 }],
  },
});
