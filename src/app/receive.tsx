// Receive screen — purely local display of account identity (no new
// backend call). Fetches profile/wallet only if not already loaded, same
// "fetch if null" pattern as home.tsx.
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import { AppHeader } from '@/components/ui/app-header';
import { Avatar } from '@/components/ui/avatar';
import { Colors, PageInset, Radius, Spacing, Typography } from '@/constants/theme';
import { TabBar } from '@/components/ui/tab-bar';
import { useAuthStore } from '@/shared/store/authStore';
import { useWalletStore } from '@/shared/store/walletStore';

const colors = Colors.dark;

export default function ReceiveScreen() {
  const profile = useAuthStore((s) => s.profile);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const account = useWalletStore((s) => s.account);
  const fetchWallet = useWalletStore((s) => s.fetchWallet);

  useEffect(() => {
    if (!profile) fetchProfile().catch(() => {});
  }, [profile, fetchProfile]);

  useEffect(() => {
    if (!account) fetchWallet().catch(() => {});
  }, [account, fetchWallet]);

  const isLoading = !profile && !account;

  return (
    <View style={styles.container}>
      <AppHeader title="Recibir" onBack={() => router.back()} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.identity}>
              <Avatar name={profile?.displayName ?? '?'} size="lg" />
              <Text style={styles.name}>{profile?.displayName ?? ' '}</Text>
              <Text style={styles.phone}>{profile?.phone ?? ''}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>CUENTA</Text>
              {/*
                Decision: no expo-clipboard install for a single "copy" button
                on a screen that has no other clipboard need in this pass.
                `selectable` on RN Text lets the user long-press to select and
                copy natively on both iOS and Android without adding a new
                native dependency. If more copy-to-clipboard needs show up
                elsewhere, revisit and install expo-clipboard once, not per
                screen.
              */}
              <Text style={styles.accountValue} selectable>
                {account?.name ?? account?.id ?? '—'}
              </Text>
              <Text style={styles.hint}>Mantén presionado para copiar</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardLabel}>TELÉFONO</Text>
              <Text style={styles.accountValue} selectable>
                {profile?.phone ?? '—'}
              </Text>
              <Text style={styles.hint}>Comparte este número para que te transfieran</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
      <TabBar />
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
  content: {
    paddingHorizontal: PageInset.horizontal,
    paddingTop: Spacing[6],
    paddingBottom: 140,
    gap: Spacing[6],
  },
  identity: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  name: {
    ...Typography.h3,
    color: colors.text,
  },
  phone: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundElement,
    padding: Spacing[5],
    gap: Spacing[2],
  },
  cardLabel: {
    ...Typography.overline,
    color: colors.textSecondary,
  },
  accountValue: {
    ...Typography.h3,
    color: colors.text,
  },
  hint: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
});
