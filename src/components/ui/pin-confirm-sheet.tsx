// Reusable PIN-confirmation bottom sheet — any money-moving action (create
// card, cancel card, topup, withdrawal, qr/pay) opens this to obtain a
// short-lived `confirmationToken` from POST /auth/pin/verify, then sends
// that token back via the `X-Confirmation-Token` header on the real mutating
// request. Internals mirror src/app/auth/pin.tsx's verify-mode flow (same
// store call, same shake-on-error treatment) but scoped to a modal instead
// of a full screen.
import { useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { NumericKeypad } from '@/components/ui/numeric-keypad';
import { PinDots } from '@/components/ui/pin-dots';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { getErrorMessage } from '@/shared/lib/api';
import { useAuthStore } from '@/shared/store/authStore';

const colors = Colors.dark;
const PIN_LENGTH = 4;

export interface PinConfirmSheetProps {
  visible: boolean;
  onConfirm: (confirmationToken: string) => void;
  onCancel: () => void;
}

export function PinConfirmSheet({ visible, onConfirm, onCancel }: PinConfirmSheetProps) {
  const verifyPin = useAuthStore((s) => s.verifyPin);

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const shakeAnim = useState(new Animated.Value(0))[0];

  // Reset internal state every time the sheet transitions closed -> open, so
  // a stale PIN/error from a previous confirmation attempt never leaks into
  // the next one. Done via the "adjusting state during render" pattern
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  // instead of a useEffect, since that avoids a setState-during-effect
  // render cascade for what's otherwise a pure derived reset.
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setPin('');
      setError(null);
      setLoading(false);
    }
  }

  function triggerShake() {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function handleKey(key: string) {
    if (key === 'back') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= PIN_LENGTH || loading) return;
    const next = pin + key;
    setPin(next);
    setError(null);

    if (next.length === PIN_LENGTH) {
      setLoading(true);
      try {
        const result = await verifyPin(next);
        if (result.authenticated && result.confirmationToken) {
          onConfirm(result.confirmationToken);
        } else {
          setError('PIN incorrecto');
          triggerShake();
          setPin('');
        }
      } catch (err) {
        setError(getErrorMessage(err));
        triggerShake();
        setPin('');
      } finally {
        setLoading(false);
      }
    }
  }

  function handleCancel() {
    onCancel();
  }

  return (
    <BottomSheet open={visible} onOpenChange={(open) => !open && handleCancel()} title="Confirma tu PIN">
      <View style={styles.content}>
        <Animated.View
          style={{
            transform: [{ translateX: shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }],
          }}
        >
          <PinDots filled={pin.length} length={PIN_LENGTH} />
        </Animated.View>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.keypadWrap}>
          <NumericKeypad onKey={handleKey} disabled={loading} />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing[5],
    paddingTop: Spacing[2],
  },
  error: {
    ...Typography.caption,
    color: colors.danger,
    textAlign: 'center',
  },
  keypadWrap: {
    paddingBottom: Spacing[2],
  },
});
