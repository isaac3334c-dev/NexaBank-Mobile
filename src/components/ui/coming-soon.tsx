// Placeholder screen body — ported from NexaBank-Frontend's ComingSoonPage.tsx.
// Matches the web reference exactly: these sections have no real
// functionality there either (Activity/Cards/Profile/Scan/Receive/Topup/
// Withdraw are all ComingSoonPage in NexaBank-Frontend's router), so this is
// genuine parity, not a reduced port.
import { Sparkles } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from './empty-state';

export interface ComingSoonProps {
  title: string;
}

export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <View style={styles.container}>
      <EmptyState
        icon={Sparkles}
        title="Próximamente"
        description={`${title} estará disponible en una futura actualización.`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
