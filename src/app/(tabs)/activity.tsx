// Activity screen — cursor-paginated notification feed. Replaces the
// ComingSoon stub with a real GET /notifications list (tap to mark read,
// onEndReached to load more pages).
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Bell } from 'lucide-react-native';

import { AppHeader } from '@/components/ui/app-header';
import { EmptyState } from '@/components/ui/empty-state';
import { TabBar } from '@/components/ui/tab-bar';
import { Colors, MaxContentWidth, PageInset, Spacing, Typography } from '@/constants/theme';
import { apiFetch, getErrorMessage } from '@/shared/lib/api';

const colors = Colors.dark;

interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  relatedResourceType: string | null;
  relatedResourceId: string | null;
  createdAt: string;
}

// walletStore.ts declares an identical `PageResponse<T>` but does not export
// it — duplicated locally here rather than exporting a type from a store
// module just for this one screen.
interface PageResponse<T> {
  data: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  nextCursor: string | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function ActivityScreen() {
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadFirstPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const page = await apiFetch<PageResponse<NotificationResponse>>('/notifications?size=20');
      setItems(page.data);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) {
      // Deferred via queueMicrotask rather than calling loadFirstPage()
      // directly: react-hooks/set-state-in-effect flags any setState
      // reachable synchronously from the effect body, even through a called
      // function. Deferring one tick keeps the "fetch once on mount" intent
      // identical while satisfying that rule.
      queueMicrotask(() => {
        loadFirstPage();
      });
    }
  }, [loaded, loadFirstPage]);

  async function loadMore() {
    if (!hasMore || !cursor || isLoadingMore || isLoading) return;
    setIsLoadingMore(true);
    try {
      const page = await apiFetch<PageResponse<NotificationResponse>>(
        `/notifications?cursor=${encodeURIComponent(cursor)}&size=20`,
      );
      setItems((prev) => [...prev, ...page.data]);
      setCursor(page.nextCursor);
      setHasMore(page.nextCursor !== null);
    } catch {
      // Silent: keep whatever was already loaded, user can retry by
      // scrolling again (onEndReached will refire).
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handlePressNotification(item: NotificationResponse) {
    if (item.read) return;
    // Optimistic local update — mark it read immediately, then confirm with
    // the backend. If the PATCH fails we leave it read locally; worst case
    // is a stale "read" state until the next full refresh, which is an
    // acceptable tradeoff for snappy tap feedback.
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    try {
      await apiFetch<void>(`/notifications/${item.id}/read`, { method: 'PATCH' });
    } catch {
      // Ignore — see comment above.
    }
  }

  if (isLoading && !loaded) {
    return (
      <View style={styles.container}>
        <AppHeader title="Actividad" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <TabBar active="activity" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Actividad" />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={items}
          keyExtractor={(item) => item.id}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handlePressNotification(item)}
              style={[styles.row, !item.read && styles.rowUnread]}
            >
              {!item.read && <View style={styles.dot} />}
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.rowBody} numberOfLines={2}>
                  {item.body}
                </Text>
                <Text style={styles.rowDate}>{formatDate(item.createdAt)}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            !isLoading ? (
              error ? (
                <EmptyState
                  icon={Bell}
                  title="No se pudo cargar tu actividad"
                  description={error}
                  action={{ label: 'Reintentar', onPress: loadFirstPage }}
                />
              ) : (
                <EmptyState
                  icon={Bell}
                  title="Sin notificaciones"
                  description="Aquí verás avisos sobre tus movimientos y cuenta."
                />
              )
            ) : undefined
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : undefined
          }
        />
      </SafeAreaView>
      <TabBar active="activity" />
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
  list: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  listContent: {
    paddingHorizontal: PageInset.horizontal,
    paddingTop: Spacing[4],
    paddingBottom: 140,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowUnread: {
    backgroundColor: colors.backgroundSelected,
    borderRadius: 12,
    paddingHorizontal: Spacing[3],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...Typography.bodyStrong,
    color: colors.text,
  },
  rowBody: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  rowDate: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    paddingVertical: Spacing[5],
    alignItems: 'center',
  },
});
