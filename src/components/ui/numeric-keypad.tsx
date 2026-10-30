// Numeric keypad for PIN entry — ported from NexaBank-Frontend's NumericKeypad.tsx,
// digits + backspace only (no decimal key; PIN entry never needs it).
import { Delete } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Typography } from '@/constants/theme';

const colors = Colors.dark;

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

export interface NumericKeypadProps {
  onKey: (key: string) => void;
  disabled?: boolean;
}

export function NumericKeypad({ onKey, disabled }: NumericKeypadProps) {
  return (
    <View style={styles.grid}>
      {KEYS.map((key, i) =>
        key === '' ? (
          <View key={`spacer-${i}`} style={styles.key} />
        ) : (
          <Pressable
            key={key}
            disabled={disabled}
            onPress={() => onKey(key)}
            style={({ pressed }) => [styles.key, styles.keyButton, pressed && styles.keyPressed]}
          >
            {key === 'back' ? (
              <Delete size={20} color={colors.text} />
            ) : (
              <Text style={styles.keyLabel}>{key}</Text>
            )}
          </Pressable>
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  key: {
    width: '30%',
    height: 56,
  },
  keyButton: {
    backgroundColor: colors.backgroundSelected,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  keyPressed: {
    transform: [{ scale: 0.97 }],
  },
  keyLabel: {
    ...Typography.h3,
    color: colors.text,
  },
});
