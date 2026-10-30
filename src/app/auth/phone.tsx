// Phone entry screen — adapted from NexaBank-Frontend's PhonePage.tsx, with
// a restrained neon-noir accent layer (see .claude/state/discovery-output.json
// for the grounded referent this is based on — NOT improvised): staggered
// fade-in entrance, a breathing glow pulse on input focus, a soft halo
// behind the primary button, and 3 faint drifting scanlines. Single lime
// accent only, no multi-color neon, no dense glitch — "signage seen through
// condensation," not a HUD.
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { ChevronDown, Phone } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { CountryPickerSheet } from '@/components/ui/country-picker-sheet';
import { LogoGlyph } from '@/components/ui/logo-glyph';
import { Scanlines } from '@/components/ui/scanlines';
import { Colors, Fonts, PageInset, Radius, Spacing, Typography } from '@/constants/theme';
import { ApiError } from '@/shared/lib/api';
import { DEFAULT_COUNTRY, type Country } from '@/shared/lib/countries';
import { useAuthStore } from '@/shared/store/authStore';

const colors = Colors.dark;

export default function PhoneScreen() {
  const setPhone = useAuthStore((s) => s.setPhone);
  const startPhoneVerification = useAuthStore((s) => s.startPhoneVerification);

  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [localNumber, setLocalNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const headerEntrance = useRef(new Animated.Value(0)).current;
  const formEntrance = useRef(new Animated.Value(0)).current;
  const focusGlow = useRef(new Animated.Value(0)).current;
  const focusGlowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Animated.timing(headerEntrance, { toValue: 1, duration: 540, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.timing(formEntrance, {
      toValue: 1,
      duration: 540,
      delay: 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [headerEntrance, formEntrance]);

  useEffect(() => {
    focusGlowLoopRef.current?.stop();
    if (focused) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(focusGlow, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(focusGlow, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );
      focusGlowLoopRef.current = loop;
      loop.start();
    } else {
      Animated.timing(focusGlow, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
    return () => focusGlowLoopRef.current?.stop();
  }, [focused, focusGlow]);

  const digits = localNumber.replace(/\D/g, '');
  const canContinue = digits.length >= 7 && digits.length <= 12;

  async function handleSubmit() {
    if (!canContinue || loading) return;
    const fullPhone = `+${country.dialCode}${digits}`;
    setLoading(true);
    setError(null);

    try {
      await startPhoneVerification(fullPhone);
      setPhone(fullPhone);
      router.push({ pathname: '/auth/otp', params: { phone: fullPhone } });
    } catch (err) {
      setError(err instanceof ApiError ? err.response.message : 'No se pudo enviar el código. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const headerStyle = {
    opacity: headerEntrance,
    transform: [{ translateY: headerEntrance.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };
  const formStyle = {
    opacity: formEntrance,
    transform: [{ translateY: formEntrance.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.glow} pointerEvents="none" />
      <Scanlines />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <Animated.View style={[styles.header, headerStyle]}>
            <LogoGlyph size={72} />
            <Text style={styles.brand}>NexaBank</Text>
            <Text style={styles.subtitle}>Tu billetera digital</Text>
          </Animated.View>

          <Animated.View style={[styles.form, formStyle]}>
            <Text style={styles.label}>Número de celular</Text>

            <View style={styles.inputWrap}>
              <Animated.View
                style={[
                  styles.inputGlow,
                  { opacity: focusGlow.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] }) },
                ]}
                pointerEvents="none"
              />
              <View style={[styles.inputRow, focused && styles.inputRowFocused]}>
                <Phone size={18} color={colors.textSecondary} />
                <Pressable
                  onPress={() => setPickerOpen(true)}
                  style={styles.countryButton}
                  accessibilityLabel={`País: ${country.name}, código +${country.dialCode}. Cambiar`}
                >
                  <Text style={styles.flag}>{country.flag}</Text>
                  <Text style={styles.dialCode}>+{country.dialCode}</Text>
                  <ChevronDown size={14} color={colors.textSecondary} />
                </Pressable>
                <View style={styles.divider} />
                <TextInput
                  value={localNumber}
                  onChangeText={(text) => setLocalNumber(text.replace(/\D/g, '').slice(0, 12))}
                  placeholder="987 654 321"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  style={styles.textInput}
                />
              </View>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.buttonWrap}>
              {canContinue && <View style={styles.buttonGlow} pointerEvents="none" />}
              <Button
                variant="primary"
                fullWidth
                loading={loading}
                disabled={!canContinue}
                onPress={handleSubmit}
                style={styles.submitButton}
              >
                Continuar
              </Button>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>

      <CountryPickerSheet open={pickerOpen} onOpenChange={setPickerOpen} onSelect={setCountry} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glow: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    marginLeft: -210,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: colors.primary,
    opacity: 0.08,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: PageInset.horizontal,
    paddingVertical: PageInset.vertical,
  },
  header: {
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[10],
  },
  brand: {
    ...Typography.h1,
    color: colors.text,
    marginTop: Spacing[2],
    textShadowColor: 'rgba(198,244,50,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  form: {
    gap: Spacing[4],
  },
  label: {
    ...Typography.bodyStrong,
    color: colors.text,
  },
  inputWrap: {
    position: 'relative',
  },
  inputGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: Radius.md + 4,
    backgroundColor: colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElement,
    paddingHorizontal: Spacing[4],
    height: 48,
  },
  inputRowFocused: {
    borderColor: colors.primary,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flag: {
    fontSize: 16,
  },
  dialCode: {
    color: colors.text,
    fontSize: 16,
    fontFamily: Fonts.sans.regular,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  textInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontFamily: Fonts.sans.regular,
  },
  error: {
    ...Typography.caption,
    color: colors.danger,
  },
  buttonWrap: {
    position: 'relative',
    marginTop: Spacing[4],
  },
  buttonGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: Radius.pill + 8,
    backgroundColor: colors.primary,
    opacity: 0.25,
  },
  submitButton: {},
});
