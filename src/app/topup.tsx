// Topup screen — form (amount + source chip) -> PIN confirm -> POST
// /topups, plus a simple history list of the user's own topups.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

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

type Source = 'CARD' | 'BANK_TRANSFER' | 'CASH';

const SOURCES: { key: Source; label: string }[] = [
  { key: 'CARD', label: 'Tarjeta' },
  { key: 'BANK_TRANSFER', label: 'Transferencia' },
  { key: 'CASH', label: 'Efectivo' },
];

interface TopupResponse {
  id: string;
  accountId: string;
  amount: string;
  currency: string;
  source: Source;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function TopupScreen() {
  const account = useWalletStore((s) => s.account);
  const fetchWallet = useWalletStore((s) => s.fetchWallet);

  const [amount, setAmount] = useState('');
  const [source, setSource] = useState<Source>('CARD');
  const [pinVisible, setPinVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [history, setHistory] = useState<TopupResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const list = await apiFetch<TopupResponse[]>('/topups');
      setHistory(list);
    } catch {
      // History is secondary to the form; failures here stay silent and the
      // empty list simply won't render anything.
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
      // A fresh Idempotency-Key per confirm tap — this is a new attempt, not
      // a retry of a previously-failed one, so it must not reuse any prior
      // key.
      const idempotencyKey = generateUuidV4();
      const topup = await apiFetch<TopupResponse>('/topups', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
          'X-Confirmation-Token': confirmationToken,
        },
        body: {
          accountId: account.id,
          amount: Number(amount),
          currency: account.currency,
          source,
        },
      });
      await fetchWallet();
      await loadHistory();
      setAmount('');
      setFeedback(`¡Recarga enviada! Estado: ${topup.status}`);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Recargar" onBack={() => router.back()} />
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
          <Text style={styles.fieldLabel}>Origen</Text>
          <View style={styles.chipsRow}>
            {SOURCES.map((s) => (
              <Text
                key={s.key}
                onPress={() => setSource(s.key)}
                style={[styles.chip, source === s.key && styles.chipActive]}
              >
                {s.label}
              </Text>
            ))}
          </View>
        </View>

        {formError && <Text style={styles.error}>{formError}</Text>}
        {feedback && <Text style={styles.success}>{feedback}</Text>}

        <Button variant="primary" fullWidth loading={submitting} onPress={handleConfirmPress}>
          Recargar
        </Button>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Historial</Text>
          {historyLoading && !historyLoaded ? (
            <ActivityIndicator color={colors.primary} />
          ) : history.length === 0 ? (
            <EmptyState title="Sin recargas todavía" description="Tus recargas aparecerán aquí." />
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.historyRow}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyAmount}>
                    {item.amount} {item.currency}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {item.source} · {formatDate(item.createdAt)}
                  </Text>
                </View>
                <Text style={styles.historyStatus}>{item.status}</Text>
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
    color: colors.primary,
  },
});
