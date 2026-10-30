// Screen header — ported from NexaBank-Frontend's AppHeader.tsx (back
// chevron, centered title, optional right-side action, safe-area aware).
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Typography } from '@/constants/theme';

const colors = Colors.dark;

export interface AppHeaderProps {
  title?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
}

export function AppHeader({ title, onBack, rightAction }: AppHeaderProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.iconButton} accessibilityLabel="Volver" hitSlop={8}>
            <ChevronLeft size={22} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.rightSlot}>{rightAction}</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 56,
    paddingHorizontal: 20,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h3,
    flex: 1,
    color: colors.text,
    textAlign: 'center',
  },
  rightSlot: {
    width: 36,
    alignItems: 'flex-end',
  },
});
