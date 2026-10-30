// Round icon + label action — ported from NexaBank-Frontend's QuickAction.tsx.
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Typography } from '@/constants/theme';

const colors = Colors.dark;

export interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}

export function QuickAction({ icon: Icon, label, onPress }: QuickActionProps) {
  return (
    <Pressable onPress={onPress} style={styles.container} accessibilityLabel={label}>
      <View style={styles.iconCircle}>
        <Icon size={24} color={colors.text} strokeWidth={1.5} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    minWidth: 64,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.backgroundSelected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
});
