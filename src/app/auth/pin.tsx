// PIN screen — dual-purpose, adapted from NexaBank-Frontend's PinPage.tsx
// (verify mode) and CreatePinPage.tsx (setup mode, with a confirm step).
// Mode is driven by the `mode` route param: 'verify' (default, recognized
// device / returning user with a PIN) or 'setup' (brand-new PIN required).
// FaceID/biometric option from PinPage.tsx is explicitly out of scope.
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router, useLocalSearchParams } from 'expo-router';

import { Avatar } from '@/components/ui/avatar';
import { NumericKeypad } from '@/components/ui/numeric-keypad';
import { PinDots } from '@/components/ui/pin-dots';
import { Colors, Fonts, PageInset, Spacing, Typography } from '@/constants/theme';
import { ApiError } from '@/shared/lib/api';
import { useAuthStore } from '@/shared/store/authStore';
import { useWalletStore } from '@/shared/store/walletStore';

const colors = Colors.dark;
const PIN_LENGTH = 4;

export default function PinScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode = params.mode === 'setup' ? 'setup' : 'verify';

  const profile = useAuthStore((s) => s.profile);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const setupPin = useAuthStore((s) => s.setupPin);
  const verifyPin = useAuthStore((s) => s.verifyPin);
  const logout = useAuthStore((s) => s.logout);
  const fetchWallet = useWalletStore((s) => s.fetchWallet);

  const displayName = profile?.displayName ?? '';
  const phone = profile?.phone ?? '';

  const [stage, setStage] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const shakeAnim = useState(new Animated.Value(0))[0];

  // In verify mode the profile may not be loaded yet (app cold-start with a
  // persisted Firebase session, before PIN unlock). Fetch it once so the
  // greeting shows the real name/phone instead of staying blank. The store
  // call itself updates `profile` (read above), so this effect only ever
  // triggers the fetch — it never calls setState directly.
  useEffect(() => {
    if (profile) return;
    fetchProfile().catch(() => {
      // Profile fetch failing here isn't fatal to showing the PIN pad —
      // the user can still attempt PIN entry; greeting just stays blank.
    });
  }, [profile, fetchProfile]);

  function triggerShake() {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function goToHome() {
    await fetchWallet();
    router.replace('/home');
  }

  async function handleVerifyKey(key: string) {
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
        if (result.authenticated) {
          await goToHome();
        } else {
          setError('PIN incorrecto');
          triggerShake();
          setPin('');
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.response.message : 'No se pudo verificar el PIN.');
        triggerShake();
        setPin('');
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleSetupKey(key: string) {
    if (key === 'back') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= PIN_LENGTH || loading) return;
    const next = pin + key;
    setPin(next);

    if (next.length === PIN_LENGTH) {
      if (stage === 'enter') {
        setFirstPin(next);
        setTimeout(() => {
          setStage('confirm');
          setPin('');
        }, 150);
        return;
      }

      if (next === firstPin) {
        setLoading(true);
        try {
          await setupPin(next);
          await goToHome();
        } catch (err) {
          setError(err instanceof ApiError ? err.response.message : 'No se pudo crear el PIN.');
          setStage('enter');
          setFirstPin('');
          setPin('');
        } finally {
          setLoading(false);
        }
      } else {
        setError('Los PIN no coinciden. Intenta de nuevo.');
        triggerShake();
        setTimeout(() => {
          setStage('enter');
          setFirstPin('');
          setPin('');
          setError(null);
        }, 400);
      }
    }
  }

  async function handleChangeNumber() {
    await logout();
    router.replace('/auth/phone');
  }

  const isSetup = mode === 'setup';
  const title = isSetup ? (stage === 'enter' ? 'Crea tu PIN' : 'Confirma tu PIN') : 'Ingresa tu PIN';
  const subtitle = isSetup
    ? stage === 'enter'
      ? 'Usarás este PIN de 4 dígitos para desbloquear tu billetera'
      : 'Ingresa el mismo PIN nuevamente'
    : undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        {!isSetup && (
          <View style={styles.identity}>
            <Avatar name={displayName || '?'} size="lg" />
            <Text style={styles.name}>{displayName || ' '}</Text>
            <Text style={styles.phone}>{phone}</Text>
          </View>
        )}

        <View style={[styles.titleBlock, { marginBottom: isSetup ? Spacing[10] : Spacing[6] }]}>
          <Text style={[styles.title, isSetup ? Typography.h1 : Typography.bodyStrong]}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        <Animated.View
          style={{
            transform: [{ translateX: shakeAnim.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }],
          }}
        >
          <PinDots filled={pin.length} length={PIN_LENGTH} />
        </Animated.View>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.keypadWrap}>
          <NumericKeypad onKey={isSetup ? handleSetupKey : handleVerifyKey} disabled={loading} />
        </View>

        {!isSetup && (
          <Text style={styles.changeNumber} onPress={handleChangeNumber}>
            ¿No eres tú? Cambiar número
          </Text>
        )}
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
    paddingTop: PageInset.vertical,
    paddingBottom: Spacing[6],
  },
  identity: {
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[10],
  },
  name: {
    ...Typography.h3,
    color: colors.text,
  },
  phone: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  titleBlock: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  title: {
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  error: {
    ...Typography.caption,
    color: colors.danger,
    textAlign: 'center',
    marginTop: Spacing[3],
  },
  keypadWrap: {
    marginTop: 'auto',
  },
  changeNumber: {
    ...Typography.caption,
    fontFamily: Fonts.sans.medium,
    color: colors.primary,
    textAlign: 'center',
    marginTop: Spacing[3],
  },
});
