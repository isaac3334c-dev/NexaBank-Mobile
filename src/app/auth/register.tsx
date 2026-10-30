// Registration screen — real multi-field form matching AuthService's
// RegisterRequest DTO (phone, firstName, lastName, documentId, address,
// country, email, displayName, pin). Deliberately NOT a port of
// RegisterPage.tsx's 6-slide onboarding tour (out of scope per brief) — a
// plain single-scroll form in the same dark/lime visual language instead.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Colors, PageInset, Spacing, Typography } from '@/constants/theme';
import { ApiError } from '@/shared/lib/api';
import { useAuthStore } from '@/shared/store/authStore';
import { useWalletStore } from '@/shared/store/walletStore';

const colors = Colors.dark;
const PIN_LENGTH_MIN = 4;
const PIN_LENGTH_MAX = 6;

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ phone?: string }>();
  const storePhone = useAuthStore((s) => s.phone);
  const phone = params.phone ?? storePhone ?? '';

  const register = useAuthStore((s) => s.register);
  const signInWithToken = useAuthStore((s) => s.signInWithToken);
  const fetchWallet = useWalletStore((s) => s.fetchWallet);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('PE');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = email.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const pinValid = pin.length >= PIN_LENGTH_MIN && pin.length <= PIN_LENGTH_MAX && /^\d+$/.test(pin);
  const pinsMatch = pin.length > 0 && pin === pinConfirm;

  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    documentId.trim().length > 0 &&
    address.trim().length > 0 &&
    country.trim().length > 0 &&
    country.trim().length <= 3 &&
    displayName.trim().length > 0 &&
    emailValid &&
    pinValid &&
    pinsMatch &&
    !loading;

  async function handleSubmit() {
    if (!canSubmit || !phone) return;
    setLoading(true);
    setError(null);

    try {
      const result = await register({
        phone,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        documentId: documentId.trim(),
        address: address.trim(),
        country: country.trim(),
        email: email.trim() || undefined,
        displayName: displayName.trim(),
        pin,
      });

      if (result.token) {
        await signInWithToken(result.token);
      }

      await fetchWallet();
      router.replace('/home');
    } catch (err) {
      setError(err instanceof ApiError ? err.response.message : 'No se pudo completar el registro.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>Completa tus datos para abrir tu billetera NexaBank</Text>
          </View>

          <View style={styles.form}>
            <TextField label="Nombres" value={firstName} onChangeText={setFirstName} autoCapitalize="words" maxLength={100} />
            <TextField label="Apellidos" value={lastName} onChangeText={setLastName} autoCapitalize="words" maxLength={100} />
            <TextField
              label="Nombre para mostrar"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              maxLength={100}
              helperText="Así te veremos en la app"
            />
            <TextField
              label="Documento de identidad"
              value={documentId}
              onChangeText={setDocumentId}
              keyboardType="default"
              maxLength={50}
            />
            <TextField label="Dirección" value={address} onChangeText={setAddress} maxLength={200} />
            <TextField
              label="País (código, ej. PE)"
              value={country}
              onChangeText={(t) => setCountry(t.toUpperCase().slice(0, 3))}
              autoCapitalize="characters"
              maxLength={3}
            />
            <TextField
              label="Correo electrónico (opcional)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={!emailValid ? 'Correo inválido' : undefined}
            />
            <TextField
              label="Crea un PIN (4 a 6 dígitos)"
              value={pin}
              onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, PIN_LENGTH_MAX))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={PIN_LENGTH_MAX}
            />
            <TextField
              label="Confirma tu PIN"
              value={pinConfirm}
              onChangeText={(t) => setPinConfirm(t.replace(/\D/g, '').slice(0, PIN_LENGTH_MAX))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={PIN_LENGTH_MAX}
              error={pinConfirm.length > 0 && !pinsMatch ? 'Los PIN no coinciden' : undefined}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Button variant="primary" fullWidth loading={loading} disabled={!canSubmit} onPress={handleSubmit} style={styles.submitButton}>
              Crear cuenta
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: PageInset.horizontal,
    paddingTop: Spacing[6],
    // Not from a web equivalent (RegisterPage.tsx's 6-slide tour is out of
    // scope, see file header) -- generous scroll clearance for the last
    // field + button on short screens, not a ported token value.
    paddingBottom: 64,
    gap: Spacing[8],
  },
  header: {
    gap: Spacing[1] + 2,
  },
  title: {
    ...Typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  form: {
    gap: Spacing[4],
  },
  error: {
    ...Typography.caption,
    color: colors.danger,
  },
  submitButton: {
    marginTop: Spacing[2],
  },
});
