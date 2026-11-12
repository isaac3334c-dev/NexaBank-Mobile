// Cards screen — list user's cards, create (PIN-confirmed), block/activate
// (no PIN needed per backend contract), and cancel (PIN-confirmed + Alert
// guard). Never renders anything beyond `last4` — PAN/CVV are not in the
// CardResponse DTO and are never requested.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CreditCard, Plus } from 'lucide-react-native';

import { AppHeader } from '@/components/ui/app-header';
import { EmptyState } from '@/components/ui/empty-state';
import { PinConfirmSheet } from '@/components/ui/pin-confirm-sheet';
import { TabBar } from '@/components/ui/tab-bar';
import { Colors, PageInset, Radius, Spacing, Typography } from '@/constants/theme';
import { apiFetch, getErrorMessage } from '@/shared/lib/api';
import { useWalletStore } from '@/shared/store/walletStore';

const colors = Colors.dark;

interface CardResponse {
  id: string;
  accountId: string;
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  status: string;
  dailyLimit: string;
  monthlyLimit: string;
  createdAt: string;
}

type PendingAction =
  | { kind: 'create' }
  | { kind: 'cancel'; cardId: string };

function statusColor(status: string): string {
  if (status === 'ACTIVE') return colors.success;
  if (status === 'BLOCKED') return colors.warning;
  return colors.danger; // CANCELLED or anything else
}

function statusLabel(status: string): string {
  if (status === 'ACTIVE') return 'Activa';
  if (status === 'BLOCKED') return 'Bloqueada';
  if (status === 'CANCELLED') return 'Cancelada';
  return status;
}

export default function CardsScreen() {
  const account = useWalletStore((s) => s.account);
  const fetchWallet = useWalletStore((s) => s.fetchWallet);

  const [cards, setCards] = useState<CardResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const [pinVisible, setPinVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const loadCards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await apiFetch<CardResponse[]>('/cards');
      setCards(list);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Deferred via queueMicrotask — see activity.tsx's identical comment for
    // why (react-hooks/set-state-in-effect).
    if (!loaded) queueMicrotask(() => loadCards());
  }, [loaded, loadCards]);

  useEffect(() => {
    if (!account) fetchWallet().catch(() => {});
  }, [account, fetchWallet]);

  function openCreateFlow() {
    if (!account) {
      Alert.alert('Sin cuenta', 'No encontramos tu cuenta todavía. Intenta de nuevo en un momento.');
      return;
    }
    setPendingAction({ kind: 'create' });
    setPinVisible(true);
  }

  function confirmCancel(cardId: string) {
    Alert.alert('¿Cancelar esta tarjeta?', 'Esta acción no se puede deshacer', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        style: 'destructive',
        onPress: () => {
          setPendingAction({ kind: 'cancel', cardId });
          setPinVisible(true);
        },
      },
    ]);
  }

  async function handlePinConfirm(confirmationToken: string) {
    setPinVisible(false);
    const action = pendingAction;
    setPendingAction(null);
    if (!action) return;

    try {
      if (action.kind === 'create') {
        if (!account) return;
        // Deliberately omit dailyLimit/monthlyLimit so the backend applies
        // its own defaults — keeping card creation to the minimum required
        // field per the task brief.
        await apiFetch<CardResponse>('/cards', {
          method: 'POST',
          headers: { 'X-Confirmation-Token': confirmationToken },
          body: { accountId: account.id },
        });
      } else {
        await apiFetch<void>(`/cards/${action.cardId}`, {
          method: 'DELETE',
          headers: { 'X-Confirmation-Token': confirmationToken },
        });
      }
      await loadCards();
    } catch (err) {
      Alert.alert('No se pudo completar', getErrorMessage(err));
    }
  }

  function handlePinCancel() {
    setPinVisible(false);
    setPendingAction(null);
  }

  async function toggleStatus(card: CardResponse) {
    const nextStatus = card.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    setMutatingId(card.id);
    try {
      await apiFetch<CardResponse>(`/cards/${card.id}`, {
        method: 'PATCH',
        body: { status: nextStatus },
      });
      await loadCards();
    } catch (err) {
      Alert.alert('No se pudo actualizar la tarjeta', getErrorMessage(err));
    } finally {
      setMutatingId(null);
    }
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Tarjetas"
        rightAction={
          <Pressable onPress={openCreateFlow} accessibilityLabel="Agregar tarjeta" hitSlop={8}>
            <Plus size={22} color={colors.primary} />
          </Pressable>
        }
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {isLoading && !loaded ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.centered}>
            <EmptyState
              icon={CreditCard}
              title={error ?? 'Aún no tienes tarjetas'}
              description={error ? undefined : 'Crea una tarjeta para empezar a pagar con tu cuenta NexaBank.'}
              action={{ label: error ? 'Reintentar' : 'Crear tarjeta', onPress: error ? loadCards : openCreateFlow }}
            />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            {cards.map((card) => (
              <View key={card.id} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.brand}>{card.brand}</Text>
                  <View style={[styles.statusBadge, { borderColor: statusColor(card.status) }]}>
                    <Text style={[styles.statusText, { color: statusColor(card.status) }]}>
                      {statusLabel(card.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardNumber}>•••• {card.last4}</Text>
                <Text style={styles.expiry}>
                  Vence {String(card.expiryMonth).padStart(2, '0')}/{card.expiryYear}
                </Text>

                <View style={styles.actionsRow}>
                  {card.status !== 'CANCELLED' && (
                    <Pressable
                      style={styles.actionButton}
                      disabled={mutatingId === card.id}
                      onPress={() => toggleStatus(card)}
                    >
                      {mutatingId === card.id ? (
                        <ActivityIndicator color={colors.text} size="small" />
                      ) : (
                        <Text style={styles.actionText}>
                          {card.status === 'ACTIVE' ? 'Bloquear' : 'Activar'}
                        </Text>
                      )}
                    </Pressable>
                  )}
                  {card.status !== 'CANCELLED' && (
                    <Pressable style={styles.actionButton} onPress={() => confirmCancel(card.id)}>
                      <Text style={[styles.actionText, styles.actionDanger]}>Cancelar</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
      <TabBar active="cards" />

      <PinConfirmSheet visible={pinVisible} onConfirm={handlePinConfirm} onCancel={handlePinCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: PageInset.horizontal,
    paddingTop: Spacing[4],
    paddingBottom: 140,
    gap: Spacing[4],
  },
  card: {
    borderRadius: Radius.card,
    padding: Spacing[5],
    backgroundColor: colors.backgroundElement,
    borderWidth: 1,
    borderColor: colors.border,
    gap: Spacing[2],
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    ...Typography.overline,
    color: colors.textSecondary,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  statusText: {
    ...Typography.caption,
    fontSize: 11,
  },
  cardNumber: {
    ...Typography.h2,
    color: colors.text,
    marginTop: Spacing[2],
  },
  expiry: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[3],
  },
  actionButton: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.pill,
    backgroundColor: colors.backgroundSelected,
  },
  actionText: {
    ...Typography.caption,
    fontFamily: Typography.bodyStrong.fontFamily,
    color: colors.text,
  },
  actionDanger: {
    color: colors.danger,
  },
});
