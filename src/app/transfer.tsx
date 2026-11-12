// Transfer screen — the one quick-action home.tsx already links to
// (`/transfer`) that never existed. Same business flow as
// NexaBank-Frontend's ContactStep/AmountStep/ConfirmStep/ResultStep, but
// collapsed into one state machine in a single file — that's this app's
// convention for multi-step money flows (see scan.tsx's decode -> confirm ->
// PIN -> pay, or withdraw.tsx's single-step form + PinConfirmSheet), not
// separate step components.
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';
import { ChevronDown, Phone } from 'lucide-react-native';

import { AppHeader } from '@/components/ui/app-header';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CountryPickerSheet } from '@/components/ui/country-picker-sheet';
import { PinConfirmSheet } from '@/components/ui/pin-confirm-sheet';
import { TextField } from '@/components/ui/text-field';
import { Colors, PageInset, Radius, Spacing, Typography } from '@/constants/theme';
import { apiFetch, getErrorMessage } from '@/shared/lib/api';
import { DEFAULT_COUNTRY, type Country } from '@/shared/lib/countries';
import { generateUuidV4 } from '@/shared/lib/device';
import { useWalletStore } from '@/shared/store/walletStore';

const colors = Colors.dark;

type Step = 'contact' | 'amount' | 'confirm' | 'result';

// Mirrors NexaBank-Frontend's transferApi.ts RecipientLookup/QuoteResponse/
// TransferResponse 1:1 — same backend, same contract, no adapter layer.
interface RecipientLookup {
  accountId: string;
  displayName: string;
}

interface QuoteResponse {
  quoteId: string;
  sourceAccountId: string;
  destinationAccountId: string;
  sourceAmount: number;
  sourceCurrency: string;
  destinationAmount: number;
  destinationCurrency: string;
  rate: number;
  fee: number;
  total: number;
  expiresAt: string;
  trackingNumber: string | null;
}

interface TransferResponse {
  id: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  sourceCurrency: string;
  destinationCurrency: string;
  destinationAmount: number;
  currency: string;
  fee: number;
  status: string;
  description: string | null;
  trackingNumber: string | null;
  createdAt: string;
  completedAt: string | null;
}

export default function TransferScreen() {
  const account = useWalletStore((s) => s.account);
  const fetchWallet = useWalletStore((s) => s.fetchWallet);

  const [step, setStep] = useState<Step>('contact');

  // Contact step
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [localNumber, setLocalNumber] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<(RecipientLookup & { phone: string }) | null>(null);

  // Amount step
  const [amount, setAmount] = useState('');
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);

  // Confirm/PIN step
  const [pinVisible, setPinVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Result step
  const [result, setResult] = useState<TransferResponse | null>(null);

  const digits = localNumber.replace(/\D/g, '');
  const canSearch = digits.length >= 7 && digits.length <= 12;

  async function handleLookup() {
    if (!canSearch) return;
    const phone = `+${country.dialCode}${digits}`;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const found = await apiFetch<RecipientLookup>(`/users/lookup?phone=${encodeURIComponent(phone)}`);
      setRecipient({ ...found, phone });
      setStep('amount');
    } catch (err) {
      setLookupError(getErrorMessage(err));
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleGetQuote() {
    const parsed = Number(amount);
    if (!amount || Number.isNaN(parsed) || parsed <= 0) {
      setQuoteError('Ingresa un monto válido.');
      return;
    }
    if (!account || !recipient) return;
    if (parsed > account.balance) {
      setQuoteError('Saldo insuficiente.');
      return;
    }
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const request = {
        sourceAccountId: account.id,
        destinationAccountId: recipient.accountId,
        amount: parsed,
        sourceCurrency: account.currency,
        destinationCurrency: account.currency,
        currency: account.currency,
      };
      const q = await apiFetch<QuoteResponse>('/transfers/quote', { method: 'POST', body: request });
      setQuote(q);
      setStep('confirm');
    } catch (err) {
      setQuoteError(getErrorMessage(err));
    } finally {
      setQuoteLoading(false);
    }
  }

  async function handlePinConfirm(confirmationToken: string) {
    setPinVisible(false);
    if (!quote) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const transfer = await apiFetch<TransferResponse>('/transfers', {
        method: 'POST',
        headers: {
          'Idempotency-Key': generateUuidV4(),
          'X-Confirmation-Token': confirmationToken,
        },
        body: {
          sourceAccountId: quote.sourceAccountId,
          destinationAccountId: quote.destinationAccountId,
          amount: quote.sourceAmount,
          sourceCurrency: quote.sourceCurrency,
          destinationCurrency: quote.destinationCurrency,
          currency: quote.sourceCurrency,
        },
      });
      await fetchWallet();
      setResult(transfer);
      setStep('result');
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleFinish() {
    router.replace('/(tabs)/home');
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Enviar"
        onBack={step === 'result' ? undefined : () => router.back()}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {step === 'contact' && (
          <>
            <Text style={styles.hint}>Ingresa el teléfono del destinatario registrado en NexaBank.</Text>
            <View style={styles.phoneRow}>
              <Phone size={18} color={colors.textSecondary} />
              <Text
                onPress={() => setPickerOpen(true)}
                style={styles.countryButton}
                accessibilityLabel={`País: ${country.name}, código +${country.dialCode}. Cambiar`}
              >
                {country.flag} +{country.dialCode}
              </Text>
              <ChevronDown size={14} color={colors.textSecondary} />
              <View style={styles.divider} />
              <TextField
                placeholder="987 654 321"
                keyboardType="phone-pad"
                autoComplete="tel"
                value={localNumber}
                onChangeText={(text) => setLocalNumber(text.replace(/\D/g, '').slice(0, 12))}
                style={styles.phoneInput}
              />
            </View>

            {lookupError && <Text style={styles.error}>{lookupError}</Text>}

            <Button
              variant="primary"
              fullWidth
              loading={lookupLoading}
              disabled={!canSearch}
              onPress={handleLookup}
            >
              Buscar
            </Button>

            <CountryPickerSheet open={pickerOpen} onOpenChange={setPickerOpen} onSelect={setCountry} />
          </>
        )}

        {step === 'amount' && recipient && (
          <>
            <View style={styles.recipientRow}>
              <Avatar name={recipient.displayName} size="sm" />
              <View>
                <Text style={styles.recipientLabel}>Para</Text>
                <Text style={styles.recipientName}>{recipient.displayName}</Text>
              </View>
            </View>

            <TextField
              label={`Monto (${account?.currency ?? ''})`}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <Text style={styles.useAllLink} onPress={() => account && setAmount(String(account.balance))}>
              Usar todo
            </Text>

            {quoteError && <Text style={styles.error}>{quoteError}</Text>}

            <Button variant="primary" fullWidth loading={quoteLoading} onPress={handleGetQuote}>
              Continuar
            </Button>
          </>
        )}

        {step === 'confirm' && recipient && quote && account && (
          <>
            <View style={styles.recipientColumn}>
              <Avatar name={recipient.displayName} size="lg" />
              <Text style={styles.recipientName}>{recipient.displayName}</Text>
              <Text style={styles.recipientPhone}>{recipient.phone}</Text>
            </View>

            <View style={styles.summaryCard}>
              <SummaryRow label="Monto" value={`${quote.sourceCurrency} ${quote.sourceAmount}`} />
              <SummaryRow label="Comisión" value={`${quote.sourceCurrency} ${quote.fee}`} />
              <View style={styles.summaryDivider} />
              <SummaryRow label="Total a enviar" value={`${quote.sourceCurrency} ${quote.total}`} strong />
              <SummaryRow
                label="Saldo resultante"
                value={`${account.currency} ${(account.balance - quote.total).toFixed(2)}`}
                muted
              />
            </View>

            {submitError && <Text style={styles.error}>{submitError}</Text>}

            <Button variant="primary" fullWidth loading={submitting} onPress={() => setPinVisible(true)}>
              Confirmar envío
            </Button>
          </>
        )}

        {step === 'result' && result && recipient && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>¡Envío exitoso!</Text>
            <Text style={styles.resultLine}>
              Enviaste {result.currency} {result.amount} a {recipient.displayName}
            </Text>
            <Button variant="primary" fullWidth onPress={handleFinish} style={styles.resultButton}>
              Volver al inicio
            </Button>
          </View>
        )}
      </ScrollView>

      <PinConfirmSheet
        visible={pinVisible}
        onConfirm={handlePinConfirm}
        onCancel={() => setPinVisible(false)}
      />
    </View>
  );
}

function SummaryRow({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          strong && styles.summaryValueStrong,
          muted && styles.summaryValueMuted,
        ]}
      >
        {value}
      </Text>
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
  hint: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  phoneRow: {
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
  countryButton: {
    ...Typography.body,
    color: colors.text,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  phoneInput: {
    flex: 1,
  },
  error: {
    ...Typography.caption,
    color: colors.danger,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  recipientLabel: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  recipientName: {
    ...Typography.bodyStrong,
    color: colors.text,
  },
  recipientPhone: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  recipientColumn: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  useAllLink: {
    ...Typography.caption,
    fontFamily: Typography.bodyStrong.fontFamily,
    color: colors.primary,
    alignSelf: 'flex-start',
  },
  summaryCard: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElement,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...Typography.body,
    color: colors.text,
  },
  summaryValueStrong: {
    ...Typography.bodyStrong,
    color: colors.text,
  },
  summaryValueMuted: {
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
