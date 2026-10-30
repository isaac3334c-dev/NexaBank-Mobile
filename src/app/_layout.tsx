import { StyleSheet, View } from 'react-native';

import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from '@expo-google-fonts/geist';
import { GeistMono_400Regular, GeistMono_600SemiBold } from '@expo-google-fonts/geist-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

const colors = Colors.dark;

/**
 * Root layout: only gates rendering behind `useFonts` (the real Geist/Geist
 * Mono family names referenced by every screen's `fontFamily` style only
 * exist once this resolves).
 *
 * Does NOT decide where to route on launch — that decision (persisted
 * Firebase session -> /auth/pin, none -> /auth/phone) is owned by
 * `src/app/index.tsx` (the boot splash), which needs the full 2.5s
 * animation to play before navigating. If this layout redirected on mount
 * too, it would router.replace() away before the splash ever got to run.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    GeistMono_400Regular,
    GeistMono_600SemiBold,
  });

  // fontError only fires if the bundled .ttf assets are corrupt/missing
  // (not realistic for these packages) -- render anyway rather than block
  // forever; falls back to system fonts in that edge case.
  const ready = fontsLoaded || Boolean(fontError);

  if (!ready) {
    return <View style={styles.root} />;
  }

  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
