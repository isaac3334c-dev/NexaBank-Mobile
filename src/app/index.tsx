// Boot splash — ported from NexaBank-Frontend's SplashPage.tsx (particle
// cloud converging into an "N" mark, drawn via SVG mask, then the
// "NexaBank" wordmark), with a restrained neon-noir accent layer grounded
// in .claude/state/discovery-output.json's referent: a breathing glow pulse
// once the mark resolves, a brief glitch-flicker on the wordmark's entrance,
// and faint drifting scanlines — not a style replacement, an accent layer.
// Owns the redirect timing itself (same pattern as the web reference's
// `redirectTo` prop) rather than _layout.tsx auto-redirecting on mount —
// otherwise the font/session check in _layout.tsx would router.replace()
// away before this 2.5s sequence ever gets to play.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Defs, Mask, Path } from 'react-native-svg';

import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';

import { Scanlines } from '@/components/ui/scanlines';
import { Colors, Fonts } from '@/constants/theme';
import { auth } from '@/shared/lib/firebase';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const colors = Colors.dark;

type Phase = 'assemble' | 'resolve' | 'exit';

// Must stay in sync with the three phase durations below (1300 + 700 + 500).
const PHASE_DURATIONS: Record<Phase, number> = {
  assemble: 1300,
  resolve: 700,
  exit: 500,
};

// Same three-segment "N" centerline as the web reference: left vertical,
// diagonal, right vertical.
const N_PATH = 'M10,90 L10,10 L70,90 L70,10';
const N_PATH_SEGMENTS: Array<[number, number, number, number, number]> = [
  [10, 90, 10, 10, 7],
  [10, 10, 70, 90, 9],
  [70, 90, 70, 10, 7],
];
const SCALE = 1.7;
const N_OUTER_WIDTH = 22;
const N_INNER_WIDTH = 13;
// Approximate on-screen length of the full 3-segment centerline at SCALE —
// used only as a stroke-dash length large enough to fully hide, then
// reveal, the path; it doesn't need to be exact.
const PATH_LENGTH = 420;

interface Particle {
  ex: number;
  ey: number;
  sx: number;
  sy: number;
  delay: number;
}

// Deterministic pseudo-random (not Math.random) so the scatter layout is
// identical on every load.
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function buildParticles(): Particle[] {
  const particles: Particle[] = [];
  let seed = 1;
  for (const [x1, y1, x2, y2, count] of N_PATH_SEGMENTS) {
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const ex = (x1 + (x2 - x1) * t - 40) * SCALE;
      const ey = (y1 + (y2 - y1) * t - 50) * SCALE;
      const angle = pseudoRandom(seed++) * Math.PI * 2;
      const radius = 90 + pseudoRandom(seed++) * 90;
      const sx = Math.cos(angle) * radius;
      const sy = Math.sin(angle) * radius;
      const delay = 80 + pseudoRandom(seed++) * 480;
      particles.push({ ex, ey, sx, sy, delay });
    }
  }
  return particles;
}

const PARTICLES = buildParticles();

function resolveDestination(): '/auth/phone' | '/auth/pin' {
  return auth.currentUser ? '/auth/pin' : '/auth/phone';
}

export default function SplashScreen() {
  const [phase, setPhase] = useState<Phase>('assemble');
  const destinationRef = useRef<'/auth/phone' | '/auth/pin'>(resolveDestination());
  const particleAnims = useRef(PARTICLES.map(() => new Animated.Value(0))).current;
  const pathDraw = useRef(new Animated.Value(0)).current;
  const wordmarkAnim = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(0)).current;
  const glitchAnim = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // Resolve the real destination once (persisted-session rehydration is
  // async), independent of the animation timer below.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      destinationRef.current = user ? '/auth/pin' : '/auth/phone';
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (phase === 'assemble') {
      Animated.stagger(
        12,
        particleAnims.map((anim) =>
          Animated.timing(anim, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ),
      ).start();
    }
    if (phase === 'resolve') {
      Animated.timing(pathDraw, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
      Animated.timing(wordmarkAnim, { toValue: 1, duration: 300, delay: 250, useNativeDriver: true }).start(() => {
        // Brief double-exposure glitch flicker right as the wordmark
        // settles — single short burst, not a continuous effect (per the
        // referent's restraint principle).
        Animated.sequence([
          Animated.timing(glitchAnim, { toValue: 1, duration: 40, useNativeDriver: true }),
          Animated.timing(glitchAnim, { toValue: -1, duration: 40, useNativeDriver: true }),
          Animated.timing(glitchAnim, { toValue: 0.4, duration: 40, useNativeDriver: true }),
          Animated.timing(glitchAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
        ]).start();
      });
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowPulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(glowPulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );
      glowLoopRef.current = glowLoop;
      glowLoop.start();
    }
    if (phase === 'exit') {
      glowLoopRef.current?.stop();
      Animated.timing(exitAnim, { toValue: 1, duration: PHASE_DURATIONS.exit, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
    }

    const order: Phase[] = ['assemble', 'resolve', 'exit'];
    const index = order.indexOf(phase);
    const timer = setTimeout(() => {
      if (index + 1 < order.length) {
        setPhase(order[index + 1]);
      } else {
        router.replace(destinationRef.current);
      }
    }, PHASE_DURATIONS[phase]);
    return () => {
      clearTimeout(timer);
      glowLoopRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const showMark = phase === 'resolve' || phase === 'exit';

  return (
    <View style={styles.root}>
      <View style={styles.glow} pointerEvents="none" />
      <Animated.View
        style={[
          styles.glowPulse,
          { opacity: glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.1] }) },
        ]}
        pointerEvents="none"
      />
      {showMark && <Scanlines />}

      <Animated.View
        style={[
          styles.markWrap,
          {
            opacity: exitAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [{ scale: exitAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }],
          },
        ]}
      >
        <View style={styles.particleField}>
          {PARTICLES.map((p, i) => (
            <Animated.View
              key={i}
              style={[
                styles.particle,
                {
                  opacity: particleAnims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: phase === 'assemble' ? [0, 1] : [1, 0],
                  }),
                  transform: [
                    {
                      translateX: particleAnims[i].interpolate({ inputRange: [0, 1], outputRange: [p.sx, p.ex] }),
                    },
                    {
                      translateY: particleAnims[i].interpolate({ inputRange: [0, 1], outputRange: [p.sy, p.ey] }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>

        {showMark && (
          <Svg
            width={80 * SCALE}
            height={100 * SCALE}
            viewBox="0 0 80 100"
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              <Mask id="n-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={80} height={100}>
                <Path
                  d={N_PATH}
                  fill="none"
                  stroke="white"
                  strokeWidth={N_OUTER_WIDTH}
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
                <Path
                  d={N_PATH}
                  fill="none"
                  stroke="black"
                  strokeWidth={N_INNER_WIDTH}
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              </Mask>
            </Defs>
            <AnimatedPath
              d={N_PATH}
              fill="none"
              stroke={colors.primary}
              strokeWidth={N_OUTER_WIDTH}
              strokeLinecap="square"
              strokeLinejoin="miter"
              strokeDasharray={PATH_LENGTH}
              strokeDashoffset={pathDraw.interpolate({ inputRange: [0, 1], outputRange: [PATH_LENGTH, 0] })}
              mask="url(#n-mask)"
            />
          </Svg>
        )}
      </Animated.View>

      {showMark && (
        <Animated.Text
          style={[
            styles.wordmark,
            {
              opacity: wordmarkAnim,
              transform: [
                { translateY: wordmarkAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
                { translateX: glitchAnim.interpolate({ inputRange: [-1, 1], outputRange: [-3, 3] }) },
              ],
            },
          ]}
        >
          NexaBank
        </Animated.Text>
      )}
    </View>
  );
}

const MARK_SIZE_W = 80 * SCALE;
const MARK_SIZE_H = 100 * SCALE;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  glow: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: colors.primary,
    opacity: 0.08,
  },
  glowPulse: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: colors.primary,
  },
  markWrap: {
    width: MARK_SIZE_W,
    height: MARK_SIZE_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleField: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
  },
  wordmark: {
    marginTop: 16,
    color: colors.primary,
    fontSize: 22,
    fontFamily: Fonts.sans.bold,
    textShadowColor: 'rgba(198,244,50,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
