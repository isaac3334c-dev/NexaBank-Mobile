// Account balance card — simplified port of NexaBank-Frontend's BalanceCard.tsx
// (lime-tinted border on dark surface, show/hide toggle, large tabular amount).
// Skips the SVG noise-texture overlay and the mocked "+12% this month" stat —
// neither is real data and the brief scopes this screen to real balance only.
import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radius, Typography } from '@/constants/theme';

const colors = Colors.dark;

export interface BalanceCardProps {
  balance: number;
  currency: string;
  label?: string;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function BalanceCard({ balance, currency, label = 'Saldo disponible' }: BalanceCardProps) {
  const [hidden, setHidden] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        <Pressable
          onPress={() => setHidden((h) => !h)}
          style={styles.eyeButton}
          accessibilityLabel={hidden ? 'Mostrar saldo' : 'Ocultar saldo'}
        >
          {hidden ? <EyeOff size={16} color={colors.textSecondary} /> : <Eye size={16} color={colors.textSecondary} />}
        </Pressable>
      </View>

      <Text style={styles.amount}>{hidden ? '••••••' : formatAmount(balance)}</Text>

      <Text style={styles.currency}>{currency}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    padding: 20,
    backgroundColor: colors.backgroundElement,
    borderWidth: 1,
    borderColor: 'rgba(198,244,50,0.25)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...Typography.overline,
    color: colors.textSecondary,
  },
  eyeButton: {
    padding: 4,
  },
  // Web uses `font-tabular` here (tabular-nums on the regular Sans face),
  // not a different font family -- RN's Text has no font-variant-numeric
  // equivalent, so Geist Mono is used as the closest available substitute
  // for digit alignment. Known, unavoidable deviation, not a missed token.
  amount: {
    color: colors.text,
    fontSize: 44,
    letterSpacing: -0.88,
    marginTop: 10,
    fontFamily: Fonts.mono.semiBold,
  },
  currency: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
