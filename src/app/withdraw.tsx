import { StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { AppHeader } from '@/components/ui/app-header';
import { ComingSoon } from '@/components/ui/coming-soon';
import { TabBar } from '@/components/ui/tab-bar';
import { Colors } from '@/constants/theme';

export default function WithdrawScreen() {
  return (
    <View style={styles.container}>
      <AppHeader title="Retirar" onBack={() => router.back()} />
      <ComingSoon title="Retirar" />
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
