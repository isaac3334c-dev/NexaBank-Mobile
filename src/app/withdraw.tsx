// Withdraw screen — same shape as topup.tsx but with `destination` instead
// of `source`, plus a cancel action on PENDING withdrawals.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { AppHeader } from '@/components/ui/app-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PinConfirmSheet } from '@/components/ui/pin-confirm-sheet';
import { TextField } from '@/components/ui/text-field';
import { TabBar } from '@/components/ui/tab-bar';
import { Colors, PageInset, Radius, Spacing, Typography } from '@/constants/theme';
import { apiFetch, getErrorMessage } from '@/shared/lib/api';
import { generateUuidV4 } from '@/shared/lib/device';
import { useWalletStore } from '@/shared/store/walletStore';

const colors = Colors.dark;

type Destination = 'CARD' | 'BANK_TRANSFER' | 'CASH';

const DESTINATIONS: { key: Destination; label: string }[] = [
  { key: 'CARD', label: 'Tarjeta' },
  { key: 'BANK_TRANSFER', label: 'Transferencia' },
  { key: 'CASH', label: 'Efectivo' },
];

interface WithdrawalResponse {
  id: string;
  accountId: string;
  amount: string;
  currency: string;
  destination: Destination;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function WithdrawScreen() {
  const account = useWalletStore((s) => s.account);
  const fetchWallet = useWalletStore((s) => s.fetchWallet);

  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState<Destination>('CARD');
  const [pinVisible, setPinVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [history, setHistory] = useState<WithdrawalResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const list = await apiFetch<WithdrawalResponse[]>('/withdrawals');
      setHistory(list);
    } catch {
      // See topup.tsx — history is secondary, failures stay silent here.
    } finally {
      setHistoryLoading(false);
      setHistoryLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Deferred via queueMicrotask — see activity.tsx's identical comment for
    // why (react-hooks/set-state-in-effect).
    if (!historyLoaded) queueMicrotask(() => loadHistory());
  }, [historyLoaded, loadHistory]);

  useEffect(() => {
    if (!account) fetchWallet().catch(() => {});
  }, [account, fetchWallet]);

  function handleConfirmPress() {
    setFormError(null);
    setFeedback(null);
    const parsed = Number(amount);
    if (!amount || Number.isNaN(parsed) || parsed <= 0) {
      setFormError('Ingresa un monto válido.');
      return;
    }
    if (!account) {
      setFormError('No encontramos tu cuenta todavía.');
      return;
    }
    setPinVisible(true);
  }

  async function handlePinConfirm(confirmationToken: string) {
    setPinVisible(false);
    if (!account) return;
    setSubmitting(true);
    try {
      const idempotencyKey = generateUuidV4();
      const withdrawal = await apiFetch<WithdrawalResponse>('/withdrawals', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
          'X-Confirmation-Token': confirmationToken,
        },
        body: {
          accountId: account.id,
          amount: Number(amount),
          currency: account.currency,
          destination,
        },
      });
      await fetchWallet();
      await loadHistory();
      setAmount('');
      setFeedback(`¡Retiro enviado! Estado: ${withdrawal.status}`);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function confirmCancelWithdrawal(id: string) {
    Alert.alert('¿Cancelar este retiro?', 'Esta acción no se puede deshacer', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancelWithdrawal(id) },
    ]);
  }

  async function cancelWithdrawal(id: string) {
    setCancellingId(id);
    try {
      await apiFetch<WithdrawalResponse>(`/withdrawals/${id}/cancel`, { method: 'POST' });
      await loadHistory();
    } catch (err) {
      Alert.alert('No se pudo cancelar', getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Retirar" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.content}>
        <TextField
          label="Monto"
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Moneda</Text>
          <Text style={styles.currencyValue}>{account?.currency ?? '—'}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Destino</Text>
          <View style={styles.chipsRow}>
            {DESTINATIONS.map((d) => (
              <Text
                key={d.key}
                onPress={() => setDestination(d.key)}
                style={[styles.chip, destination === d.key && styles.chipActive]}
              >
                {d.label}
              </Text>
            ))}
          </View>
        </View>

        {formError && <Text style={styles.error}>{formError}</Text>}
        {feedback && <Text style={styles.success}>{feedback}</Text>}

        <Button variant="primary" fullWidth loading={submitting} onPress={handleConfirmPress}>
          Retirar
        </Button>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historial</Text>
          {historyLoading && !historyLoaded ? (
            <ActivityIndicator color={colors.primary} />
          ) : history.length === 0 ? (
            <EmptyState title="Sin retiros todavía" description="Tus retiros aparecerán aquí." />
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.historyRow}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyAmount}>
                    {item.amount} {item.currency}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {item.destination} · {formatDate(item.createdAt)}
                  </Text>
                </View>
                {item.status === 'PENDING' ? (
                  <Text
                    style={styles.cancelLink}
                    onPress={() => (cancellingId === item.id ? undefined : confirmCancelWithdrawal(item.id))}
                  >
                    {cancellingId === item.id ? '...' : 'Cancelar'}
                  </Text>
                ) : (
                  <Text style={styles.historyStatus}>{item.status}</Text>
                )}
              </View>
            ))
          )}
        </View>
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
    gap: Spacing[5],
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    ...Typography.bodyStrong,
    color: colors.text,
  },
  currencyValue: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  chip: {
    ...Typography.caption,
    color: colors.textSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  chipActive: {
    color: colors.onPrimary,
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    fontFamily: Typography.bodyStrong.fontFamily,
  },
  error: {
    ...Typography.caption,
    color: colors.danger,
  },
  success: {
    ...Typography.caption,
    color: colors.primary,
  },
  historySection: {
    marginTop: Spacing[5],
    gap: Spacing[3],
  },
  sectionTitle: {
    ...Typography.h3,
    color: colors.text,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyInfo: {
    gap: 2,
  },
  historyAmount: {
    ...Typography.bodyStrong,
    color: colors.text,
  },
  historyMeta: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  historyStatus: {
    ...Typography.caption,
    fontFamily: Typography.bodyStrong.fontFamily,
    color: colors.textSecondary,
  },
  cancelLink: {
    ...Typography.caption,
    fontFamily: Typography.bodyStrong.fontFamily,
    color: colors.danger,
  },
});
