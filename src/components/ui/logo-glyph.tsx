// The bare NexaBank "N" wordmark — ported from NexaBank-Frontend's
// LogoGlyph.tsx (hand-drawn SVG path, not a stroked font glyph, so joins
// stay clean). CSS's stacked drop-shadow glow has no direct RN/SVG
// equivalent that's reliable cross-platform, so it's approximated with a
// soft blurred-looking View halo behind the stroke instead.
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

const colors = Colors.dark;

export interface LogoGlyphProps {
  size?: number;
}

export function LogoGlyph({ size = 72 }: LogoGlyphProps) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={[styles.glow, { width: size * 1.6, height: size * 1.6, borderRadius: size }]} pointerEvents="none" />
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path
          d="M 14 86 L 14 14 L 28 14 L 72 72 L 72 14 L 86 14 L 86 86 L 72 86 L 28 28 L 28 86 Z"
          fill="none"
          stroke={colors.primary}
          strokeWidth={3.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    backgroundColor: colors.primary,
    opacity: 0.12,
  },
});
