// Initials avatar — ported from NexaBank-Frontend's Avatar.tsx (lime-soft
// circle with initials, no image support needed for this scope).
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

const colors = Colors.dark;

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = { sm: 36, md: 44, lg: 56 };
const FONT_SIZES = { sm: 13, md: 15, lg: 18 };

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const dimension = SIZES[size];
  return (
    <View
      style={[
        styles.circle,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize: FONT_SIZES[size] }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: 'rgba(198,244,50,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primary,
    fontFamily: Fonts.sans.semiBold,
  },
});
