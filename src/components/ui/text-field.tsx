// Labeled text input — ported from NexaBank-Frontend's Input.tsx (surface
// bg, border focus-highlight, label/helper/error text).
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { Colors, Radius, Typography } from '@/constants/theme';

const colors = Colors.dark;

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export function TextField({ label, error, helperText, style, onFocus, onBlur, ...props }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          hasError ? styles.borderError : focused ? styles.borderFocused : styles.borderDefault,
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textSecondary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
      </View>
      {(error || helperText) && (
        <Text style={[styles.helper, hasError && styles.helperError]}>{error || helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    ...Typography.bodyStrong,
    color: colors.text,
  },
  inputWrapper: {
    borderRadius: Radius.md,
    borderWidth: 1,
    backgroundColor: colors.backgroundElement,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  borderDefault: {
    borderColor: colors.border,
  },
  borderFocused: {
    borderColor: colors.primary,
  },
  borderError: {
    borderColor: colors.danger,
  },
  input: {
    color: colors.text,
    fontSize: 16,
  },
  helper: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  helperError: {
    color: colors.danger,
  },
});
