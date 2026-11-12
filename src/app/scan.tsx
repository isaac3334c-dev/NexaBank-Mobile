// Scan screen — QR payment flow, now via the real camera (`expo-camera`'s
// CameraView/useCameraPermissions/onBarcodeScanned, confirmed available in
// Expo Go for SDK 58). As predicted in the previous version of this comment,
// swapping in the scanner only replaced how `qrData` gets filled — the
// decode -> confirm merchant -> PIN -> pay business logic below is
// unchanged. A manual-entry fallback (`TextField`) stays for when camera
// permission is denied, so the flow never fully blocks a user.
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CameraView, useCameraPermissions } from 'expo-camera';
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

  const [permission, requestPermission] = useCameraPermissions();
  const [manualEntry, setManualEntry] = useState(false);
  // Guards against onBarcodeScanned firing repeatedly for the same frame
  // while the decode request for the first scan is still in flight.
  const [scanLocked, setScanLocked] = useState(false);

  const [qrData, setQrData] = useState('');
  const [amount, setAmount] = useState('');
  const [decoding, setDecoding] = useState(false);
  const [decoded, setDecoded] = useState<QrDecodeResponse | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  const [pinVisible, setPinVisible] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [result, setResult] = useState<QrPayResponse | null>(null);

  async function decodeData(data: string) {
    setDecodeError(null);
    setDecoded(null);
    setResult(null);
    if (!data.trim()) {
      setDecodeError('Pega o escribe el contenido del código QR.');
      return;
    }
    setDecoding(true);
    try {
      const response = await apiFetch<QrDecodeResponse>(`/qr/decode?data=${encodeURIComponent(data.trim())}`);
      setDecoded(response);
    } catch (err) {
      setDecodeError(getErrorMessage(err));
    } finally {
      setDecoding(false);
    }
  }

  function handleDecode() {
    return decodeData(qrData);
  }

  async function handleBarcodeScanned({ data }: { data: string }) {
    if (scanLocked) return;
    setScanLocked(true);
    setQrData(data);
    await decodeData(data);
    setScanLocked(false);
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
    setManualEntry(false);
    setScanLocked(false);
  }

  const showScannerUi = !result && !decoded && !manualEntry;

  return (
    <View style={styles.container}>
      <AppHeader title="Escanear QR" onBack={() => router.back()} />
      {showScannerUi ? (
        <View style={styles.cameraSection}>
          {!permission ? null : !permission.granted ? (
            <View style={styles.permissionCard}>
              <Text style={styles.permissionText}>
                NexaBank necesita acceso a la cámara para escanear códigos QR de pago.
              </Text>
              <Button variant="primary" fullWidth onPress={requestPermission}>
                Permitir cámara
              </Button>
              <Text style={styles.manualLink} onPress={() => setManualEntry(true)}>
                Ingresar código manualmente
              </Text>
            </View>
          ) : (
            <>
              <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanLocked ? undefined : handleBarcodeScanned}
              />
              <View style={styles.scanFrame} pointerEvents="none" />
              {decoding && <Text style={styles.scanHint}>Verificando código…</Text>}
              {decodeError && <Text style={[styles.error, styles.scanError]}>{decodeError}</Text>}
              <Text style={styles.manualLink} onPress={() => setManualEntry(true)}>
                Ingresar código manualmente
              </Text>
            </>
          )}
        </View>
      ) : (
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
              {manualEntry && !decoded && (
                <Text style={styles.manualLink} onPress={() => setManualEntry(false)}>
                  Usar la cámara
                </Text>
              )}

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
      )}
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
  cameraSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[4],
    paddingHorizontal: PageInset.horizontal,
    paddingBottom: Spacing[8],
  },
  camera: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  scanFrame: {
    position: 'absolute',
    top: '18%',
    left: '18%',
    right: '18%',
    bottom: '32%',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: Radius.md,
  },
  scanHint: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  scanError: {
    textAlign: 'center',
  },
  manualLink: {
    ...Typography.caption,
    fontFamily: Typography.bodyStrong.fontFamily,
    color: colors.primary,
  },
  permissionCard: {
    width: '100%',
    gap: Spacing[4],
    alignItems: 'center',
  },
  permissionText: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
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
