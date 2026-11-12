// Scan screen — QR payment flow via manual data entry (no real camera).
//
// Decision: NOT adding expo-camera in this pass. `npx expo-camera`'s
// CameraView/useCameraPermissions/onBarcodeScanned API (confirmed against
// https://docs.expo.dev/versions/v58.0.0/sdk/camera/, the exact SDK 58 docs,
// not assumed from memory) is in fact available in Expo Go for this SDK, so
// technically a real scanner wasn't blocked by a dev-build requirement here.
// The reason to defer it anyway is scope/time: wiring a live camera preview,
// permission UX, torch/facing controls, and safely tearing down the camera
// session on screen blur is a separate chunk of work from the actual
// business flow (decode -> confirm merchant -> PIN -> pay) this task is
// about. The manual fallback below exercises that exact same business flow
// end-to-end, so swapping in `CameraView` later only means replacing the
// `qrData` TextField with a scanner that fills the same state variable —
// the decode/pay logic does not change.
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { AppHeader } from '@/components/ui/app-header';
import { Button } from '@/components/ui/button';
import { PinConfirmSheet } from '@/components/ui/pin-confirm-sheet';
import { TextField } from '@/components/ui/text-field';
import { TabBar } from '@/components/ui/tab-bar';
import { Colors, PageInset, Radius, Spacing, Typography } from '@/constants/theme';
import { apiFetch, getErrorMessage } from '@/shared/lib/api';
import { useWalletStore } from '@/shared/store/walletStore';

const colors = Colors.dark;

interface QrDecodeResponse {
  accountId: string;
  merchant: string;
}

interface QrPayResponse {
  success: boolean;
  transactionId?: string;
  amount?: string;
  merchant?: string;
  destinationAccount?: string;
  newBalance?: number;
  timestamp?: string;
  error?: string;
}

function toAmountString(raw: string): string | null {
  const parsed = Number(raw);
  if (!raw || Number.isNaN(parsed) || parsed <= 0) return null;
  return parsed.toFixed(2);
}

export default function ScanScreen() {
  const fetchWallet = useWalletStore((s) => s.fetchWallet);

  const [qrData, setQrData] = useState('');
  const [amount, setAmount] = useState('');
  const [decoding, setDecoding] = useState(false);
  const [decoded, setDecoded] = useState<QrDecodeResponse | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  const [pinVisible, setPinVisible] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [result, setResult] = useState<QrPayResponse | null>(null);

  async function handleDecode() {
    setDecodeError(null);
    setDecoded(null);
    setResult(null);
    if (!qrData.trim()) {
      setDecodeError('Pega o escribe el contenido del código QR.');
      return;
    }
    setDecoding(true);
    try {
      const response = await apiFetch<QrDecodeResponse>(`/qr/decode?data=${encodeURIComponent(qrData.trim())}`);
      setDecoded(response);
    } catch (err) {
      setDecodeError(getErrorMessage(err));
    } finally {
      setDecoding(false);
    }
  }

  function handlePayPress() {
    setPayError(null);
    const amountStr = toAmountString(amount);
    if (!amountStr) {
      setPayError('Ingresa un monto válido.');
      return;
    }
    setPinVisible(true);
  }

  async function handlePinConfirm(confirmationToken: string) {
    setPinVisible(false);
    const amountStr = toAmountString(amount);
    if (!amountStr) return;
    setPaying(true);
    setPayError(null);
    try {
      const response = await apiFetch<QrPayResponse>('/qr/pay', {
        method: 'POST',
        headers: { 'X-Confirmation-Token': confirmationToken },
        body: { qrData: qrData.trim(), amount: amountStr },
      });
      if (response.success) {
        setResult(response);
        await fetchWallet();
      } else {
        setPayError(response.error ?? 'No se pudo completar el pago.');
      }
    } catch (err) {
      setPayError(getErrorMessage(err));
    } finally {
      setPaying(false);
    }
  }

  function handleReset() {
    setQrData('');
    setAmount('');
    setDecoded(null);
    setDecodeError(null);
    setResult(null);
    setPayError(null);
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Escanear QR" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        {result ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>¡Pago realizado!</Text>
            {result.merchant && <Text style={styles.resultLine}>Comercio: {result.merchant}</Text>}
            {result.amount && <Text style={styles.resultLine}>Monto: {result.amount}</Text>}
            {result.newBalance !== undefined && (
              <Text style={styles.resultLine}>Nuevo saldo: {result.newBalance}</Text>
            )}
            <Button variant="secondary" fullWidth onPress={handleReset} style={styles.resultButton}>
              Hacer otro pago
            </Button>
          </View>
        ) : (
          <>
            <TextField
              label="Contenido del QR"
              placeholder="nexabank:pay:ACC-123456:MerchantName"
              value={qrData}
              onChangeText={(text) => {
                setQrData(text);
                setDecoded(null);
                setDecodeError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Button variant="secondary" fullWidth loading={decoding} onPress={handleDecode}>
              Verificar código
            </Button>

            {decodeError && <Text style={styles.error}>{decodeError}</Text>}

            {decoded && (
              <View style={styles.merchantCard}>
                <Text style={styles.merchantLabel}>DESTINO</Text>
                <Text style={styles.merchantName}>{decoded.merchant}</Text>
                <Text style={styles.merchantAccount}>{decoded.accountId}</Text>
              </View>
            )}

            {decoded && (
              <>
                <TextField
                  label="Monto a pagar"
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                />

                {payError && <Text style={styles.error}>{payError}</Text>}

                <Button variant="primary" fullWidth loading={paying} onPress={handlePayPress}>
                  Pagar
                </Button>
              </>
            )}
          </>
        )}
      </ScrollView>
      <TabBar />

      <PinConfirmSheet visible={pinVisible} onConfirm={handlePinConfirm} onCancel={() => setPinVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: PageInset.horizontal,
    paddingTop: Spacing[5],
    paddingBottom: 140,
    gap: Spacing[4],
  },
  error: {
    ...Typography.caption,
    color: colors.danger,
  },
  merchantCard: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElement,
    padding: Spacing[4],
    gap: 4,
  },
  merchantLabel: {
    ...Typography.overline,
    color: colors.textSecondary,
  },
  merchantName: {
    ...Typography.h3,
    color: colors.text,
  },
  merchantAccount: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  resultCard: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.backgroundElement,
    padding: Spacing[5],
    gap: Spacing[2],
  },
  resultTitle: {
    ...Typography.h2,
    color: colors.primary,
  },
  resultLine: {
    ...Typography.body,
    color: colors.text,
  },
  resultButton: {
    marginTop: Spacing[4],
  },
});
