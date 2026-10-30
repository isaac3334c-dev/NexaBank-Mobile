// Subtle atmosphere layer — grounded in the "Cyberpunk Neon Noir" referent's
// scanline-as-atmosphere principle, kept deliberately faint (4-6% opacity,
// 3 lines) per the 2026 neo-fintech finding that neon/texture accents stay
// under ~15% surface coverage in premium dark UI, not a dominant CRT motif.
// Lines drift slowly downward and loop — cheap (transform + opacity only).
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

const colors = Colors.dark;
const LINE_COUNT = 3;
const LOOP_MS = 9000;

export function Scanlines() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, { toValue: 1, duration: LOOP_MS, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  return (
    <View style={styles.root} pointerEvents="none">
      {Array.from({ length: LINE_COUNT }, (_, i) => {
        const offset = i / LINE_COUNT;
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [`${offset * 100 - 100}%`, `${offset * 100 + 100}%`],
        });
        return <Animated.View key={i} style={[styles.line, { transform: [{ translateY }] }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.primary,
    opacity: 0.05,
  },
});
