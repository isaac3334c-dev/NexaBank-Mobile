// PIN progress dots — ported from PinPage/CreatePinPage's filled-circle row.
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

const colors = Colors.dark;
const PIN_LENGTH = 4;

export interface PinDotsProps {
  filled: number;
  length?: number;
}

export function PinDots({ filled, length = PIN_LENGTH }: PinDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length }, (_, i) => (
        <View key={i} style={[styles.dot, i < filled ? styles.dotFilled : styles.dotEmpty]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dotFilled: {
    backgroundColor: colors.primary,
  },
  dotEmpty: {
    backgroundColor: colors.backgroundSelected,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
