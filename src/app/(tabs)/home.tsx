// Home screen — adapted from NexaBank-Frontend's HomePage.tsx: wallet
// balance + recent transactions (real data) + quick-action grid. "Enviar"
// routes to /transfer, which is the very next piece being built after this
// batch — intentionally sequenced right after, not a dangling placeholder
// left indefinitely.
import { useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, Landmark, LogOut, Wallet } from 'lucide-react-native';

import { Avatar } from '@/components/ui/avatar';
import { BalanceCard } from '@/components/ui/balance-card';
import { EmptyState } from '@/components/ui/empty-state';
import { QuickAction } from '@/components/ui/quick-action';
import { TabBar } from '@/components/ui/tab-bar';
import { TransactionRow } from '@/components/ui/transaction-row';
import { Colors, MaxContentWidth, PageInset, Radius, Spacing, Typography } from '@/constants/theme';
import { useAuthStore } from '@/shared/store/authStore';
import { useWalletStore } from '@/shared/store/walletStore';

const colors = Colors.dark;

export default function HomeScreen() {
  const profile = useAuthStore((s) => s.profile);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const logout = useAuthStore((s) => s.logout);

  const account = useWalletStore((s) => s.account);
  const transactions = useWalletStore((s) => s.transactions);
  const isLoading = useWalletStore((s) => s.isLoading);
  const error = useWalletStore((s) => s.error);
  const fetchWallet = useWalletStore((s) => s.fetchWallet);

  useEffect(() => {
    if (!profile) {
      fetchProfile().catch(() => {});
    }
  }, [profile, fetchProfile]);

  const firstName = profile?.displayName?.split(' ')[0] ?? '';

  async function handleLogout() {
    await logout();
    router.replace('/auth/phone');
  }

  if (isLoading && !account) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <TabBar active="home" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionRow transaction={item} />}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.greetingSmall}>Hola,</Text>
                <Text style={styles.greetingName}>{firstName}</Text>
              </View>
              <View style={styles.headerActions}>
                <Avatar name={profile?.displayName ?? '?'} size="md" />
                <Pressable
                  style={styles.logoutButton}
                  onPress={handleLogout}
                  accessibilityLabel="Cerrar sesión"
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <LogOut size={18} color={colors.textSecondary} />
                </Pressable>
              </View>
            </View>

            {account ? (
              <BalanceCard balance={account.balance} currency={account.currency} />
            ) : error ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
                <Text style={styles.retryLink} onPress={() => fetchWallet()}>
                  Reintentar
                </Text>
              </View>
            ) : null}

            <View style={styles.quickActions}>
              <QuickAction icon={ArrowUpRight} label="Enviar" onPress={() => router.push('/transfer')} />
              <QuickAction icon={ArrowDownLeft} label="Recibir" onPress={() => router.push('/receive')} />
              <QuickAction icon={Wallet} label="Recargar" onPress={() => router.push('/topup')} />
              <QuickAction icon={Landmark} label="Retirar" onPress={() => router.push('/withdraw')} />
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Movimientos recientes</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="Aún no tienes movimientos"
              description="Tus transferencias y pagos aparecerán aquí."
            />
          ) : undefined
        }
      />
      <TabBar active="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  listContent: {
    paddingHorizontal: PageInset.horizontal,
    paddingTop: Spacing[5],
    paddingBottom: 140,
  },
  headerSection: {
    gap: Spacing[6],
    paddingBottom: Spacing[6],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greetingSmall: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  greetingName: {
    ...Typography.h2,
    color: colors.text,
  },
  logoutButton: {
    padding: 4,
  },
  errorCard: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  errorText: {
    ...Typography.caption,
    color: colors.danger,
  },
  retryLink: {
    ...Typography.caption,
    fontFamily: Typography.bodyStrong.fontFamily,
    color: colors.primary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Typography.h3,
    color: colors.text,
  },
});
