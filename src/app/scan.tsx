import { StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { AppHeader } from '@/components/ui/app-header';
import { ComingSoon } from '@/components/ui/coming-soon';
import { TabBar } from '@/components/ui/tab-bar';
import { Colors } from '@/constants/theme';

export default function ScanScreen() {
  return (
    <View style={styles.container}>
      <AppHeader title="Escanear QR" onBack={() => router.back()} />
      <ComingSoon title="Escanear QR" />
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
});
