// 6-digit OTP box row — ported from NexaBank-Frontend's OtpInput.tsx, using a
// single hidden TextInput driving `length` visual boxes (simpler and more
// reliable on RN than per-box refs + auto-advance).
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputInstance } from 'react-native';

import { Colors, Radius, Typography } from '@/constants/theme';

const colors = Colors.dark;

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  editable?: boolean;
}

export function OtpInput({ length = 6, value, onChange, error, editable = true }: OtpInputProps) {
  const inputRef = useRef<TextInputInstance>(null);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  return (
    <Pressable onPress={() => inputRef.current?.focus()}>
      <View style={styles.row}>
        {digits.map((digit, i) => (
          <View
            key={i}
            style={[
              styles.box,
              error ? styles.boxError : value.length === i ? styles.boxActive : styles.boxDefault,
            ]}
          >
            <Text style={styles.digit}>{digit}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        editable={editable}
        autoFocus
        style={styles.hiddenInput}
        textContentType="oneTimeCode"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  box: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundElement,
  },
  boxDefault: {
    borderColor: colors.border,
  },
  boxActive: {
    borderColor: colors.primary,
  },
  boxError: {
    borderColor: colors.danger,
  },
  digit: {
    ...Typography.h3,
    color: colors.text,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
});
