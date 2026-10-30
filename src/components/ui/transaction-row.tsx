// Single transaction row — ported from NexaBank-Frontend's TransactionItem.tsx,
// simplified to the real backend DTO shape ({name, note, amount, incoming}).
// `color` from the backend is intentionally ignored (brief marks it a safe-to-
// ignore styling hint) in favor of the app's own in/out palette.
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Typography } from '@/constants/theme';
import type { TransactionResponse } from '@/shared/store/walletStore';

const colors = Colors.dark;

export interface TransactionRowProps {
  transaction: TransactionResponse;
}

function formatAmount(amount: number, incoming: boolean): string {
  const formatted = Math.abs(amount).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${incoming ? '+' : '-'} ${formatted}`;
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const { name, note, amount, incoming } = transaction;

  return (
    <View style={styles.row}>
      <View style={[styles.iconCircle, incoming ? styles.iconCircleIn : styles.iconCircleOut]}>
        {incoming ? (
          <ArrowDownLeft size={20} color={colors.primary} />
        ) : (
          <ArrowUpRight size={20} color={colors.textSecondary} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {note ? (
          <Text style={styles.note} numberOfLines={1}>
            {note}
          </Text>
        ) : null}
      </View>

      <Text style={[styles.amount, incoming ? styles.amountIn : styles.amountOut]}>
        {formatAmount(amount, incoming)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleIn: {
    backgroundColor: 'rgba(198,244,50,0.16)',
  },
  iconCircleOut: {
    backgroundColor: colors.backgroundSelected,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...Typography.bodyStrong,
    color: colors.text,
  },
  note: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // See balance-card.tsx's comment: web keeps body-strong Sans + tabular-nums
  // here (font-tabular), not a distinct font family. Geist Mono substitutes
  // for the unavailable tabular-nums RN equivalent.
  amount: {
    fontSize: 16,
    fontFamily: Fonts.mono.semiBold,
  },
  amountIn: {
    color: colors.primary,
  },
  amountOut: {
    color: colors.text,
  },
});
