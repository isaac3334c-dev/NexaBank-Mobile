import { StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/ui/app-header';
import { ComingSoon } from '@/components/ui/coming-soon';
import { TabBar } from '@/components/ui/tab-bar';
import { Colors } from '@/constants/theme';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <AppHeader title="Perfil" />
      <ComingSoon title="Perfil" />
      <TabBar active="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
});
