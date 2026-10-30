import { StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { AppHeader } from '@/components/ui/app-header';
import { ComingSoon } from '@/components/ui/coming-soon';
import { TabBar } from '@/components/ui/tab-bar';
import { Colors } from '@/constants/theme';

export default function ReceiveScreen() {
  return (
    <View style={styles.container}>
      <AppHeader title="Recibir" onBack={() => router.back()} />
      <ComingSoon title="Recibir" />
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
