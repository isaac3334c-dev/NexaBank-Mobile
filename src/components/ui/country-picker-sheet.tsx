// Searchable country/dial-code picker — ported from NexaBank-Frontend's
// CountryPickerSheet.tsx.
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Search } from 'lucide-react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { COUNTRIES, type Country } from '@/shared/lib/countries';

const colors = Colors.dark;

export interface CountryPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (country: Country) => void;
}

export function CountryPickerSheet({ open, onOpenChange, onSelect }: CountryPickerSheetProps) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dialCode.includes(q.replace('+', '')),
    );
  }, [query]);

  function handleSelect(country: Country) {
    onSelect(country);
    setQuery('');
    onOpenChange(false);
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Elige tu país">
      <View style={styles.searchRow}>
        <Search size={16} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar país o código"
          placeholderTextColor={colors.textSecondary}
          autoFocus
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(c) => c.iso2}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>Sin resultados</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => handleSelect(item)}>
            <Text style={styles.flag}>{item.flag}</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.dialCode}>+{item.dialCode}</Text>
          </Pressable>
        )}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSelected,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: Spacing[3],
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  list: {
    maxHeight: 360,
  },
  empty: {
    ...Typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing[6],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    height: 48,
    minHeight: 44,
  },
  flag: {
    fontSize: 18,
  },
  name: {
    ...Typography.body,
    flex: 1,
    color: colors.text,
  },
  dialCode: {
    ...Typography.body,
    color: colors.textSecondary,
  },
});
