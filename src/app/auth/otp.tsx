// OTP verification screen — adapted from NexaBank-Frontend's OtpPage.tsx.
// Real backend call: POST /auth/phone/verify. Routes per the brief's state
// machine: requiresRegistration -> Register; else sign in with the returned
// custom token, then requiresPin -> Pin-setup, else -> Pin-verify.
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui/button';
import { OtpInput } from '@/components/ui/otp-input';
import { Colors, Fonts, PageInset, Spacing, Typography } from '@/constants/theme';
import { ApiError } from '@/shared/lib/api';
import { useAuthStore } from '@/shared/store/authStore';

const colors = Colors.dark;
const RESEND_SECONDS = 30;
const OTP_LENGTH = 6;

function maskPhone(phone: string): string {
  const match = phone.match(/^(\+\d+)(\d+)$/);
  if (!match) return phone;
  const [, dialCode, rest] = match;
  if (rest.length < 4) return phone;
  const first = rest[0];
  const last3 = rest.slice(-3);
  return `${dialCode} ${first}${'*'.repeat(rest.length - 4)}${last3}`;
}

export default function OtpScreen() {
  const params = useLocalSearchParams<{ phone?: string }>();
  const storePhone = useAuthStore((s) => s.phone);
  const phone = params.phone ?? storePhone ?? '';

  const startPhoneVerification = useAuthStore((s) => s.startPhoneVerification);
  const verifyOtp = useAuthStore((s) => s.verifyOtp);
  const signInWithToken = useAuthStore((s) => s.signInWithToken);

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const shakeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  function triggerShake() {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function handleChange(value: string) {
    setCode(value);
    setError(null);
    if (value.length === OTP_LENGTH) {
      await verify(value);
    }
  }

  async function verify(value: string) {
    if (!phone) return;
    setLoading(true);
    try {
      const result = await verifyOtp(phone, value);

      if (result.requiresRegistration) {
        router.push({ pathname: '/auth/register', params: { phone } });
        return;
      }

      if (result.token) {
        await signInWithToken(result.token);
      }

      router.replace({
        pathname: '/auth/pin',
        params: { mode: result.requiresPin ? 'setup' : 'verify' },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.response.message : 'Código incorrecto. Inténtalo de nuevo.');
      triggerShake();
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!phone || secondsLeft > 0) return;
    setSecondsLeft(RESEND_SECONDS);
    setError(null);
    try {
      await startPhoneVerification(phone);
    } catch (err) {
      setError(err instanceof ApiError ? err.response.message : 'No se pudo reenviar el código.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Verifica tu número</Text>
          <Text style={styles.subtitle}>
            Enviamos un código de 6 dígitos a{' '}
            <Text style={styles.phoneHighlight}>{maskPhone(phone)}</Text>
          </Text>
        </View>

        <Animated.View
          style={{
            transform: [{ translateX: shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }],
          }}
        >
          <OtpInput length={OTP_LENGTH} value={code} onChange={handleChange} error={Boolean(error)} editable={!loading} />
        </Animated.View>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.resendRow}>
          {secondsLeft > 0 ? (
            <Text style={styles.resendCountdown}>Reenviar código en {secondsLeft}s</Text>
          ) : (
            <Text style={styles.resendLink} onPress={handleResend}>
              Reenviar código
            </Text>
          )}
        </View>

        <Button
          variant="primary"
          fullWidth
          loading={loading}
          disabled={code.length !== OTP_LENGTH}
          onPress={() => verify(code)}
          style={styles.submitButton}
        >
          Continuar
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: PageInset.horizontal,
    paddingVertical: PageInset.vertical,
  },
  header: {
    gap: Spacing[2],
    marginBottom: Spacing[8],
  },
  title: {
    ...Typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  phoneHighlight: {
    fontFamily: Fonts.sans.medium,
    color: colors.text,
  },
  error: {
    ...Typography.caption,
    color: colors.danger,
    marginTop: Spacing[3],
  },
  resendRow: {
    marginTop: Spacing[6],
  },
  resendCountdown: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  resendLink: {
    ...Typography.caption,
    fontFamily: Fonts.sans.medium,
    color: colors.primary,
  },
  submitButton: {
    marginTop: 'auto',
    marginBottom: Spacing[2],
  },
});
