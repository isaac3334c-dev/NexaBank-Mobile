// Empty/error placeholder — ported from NexaBank-Frontend's EmptyState.tsx.
import type { LucideIcon } from 'lucide-react-native';
import { Inbox } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Typography } from '@/constants/theme';
import { Button } from './button';

const colors = Colors.dark;

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Icon size={24} color={colors.textSecondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action ? (
        <Button variant="secondary" onPress={action.onPress} style={styles.actionButton}>
          {action.label}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.backgroundSelected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.bodyStrong,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    ...Typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  actionButton: {
    marginTop: 8,
    height: 40,
    paddingHorizontal: 16,
  },
});
