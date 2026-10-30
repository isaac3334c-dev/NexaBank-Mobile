/**
 * "Obsidiana y Lima" — NexaBank's dark-first brand palette, ported from
 * NexaBank-Frontend's `src/styles/tokens.css` (colors/card-sheet-pill radii)
 * AND `src/styles/index.css` (typography scale, the sm/md/lg/xl/full radius
 * scale used by non-card controls, and the base 4px spacing scale). Earlier
 * versions of this file only read tokens.css and improvised fontSize/
 * spacing/radius numbers by eye — that's why the app visibly drifted from
 * the web reference despite having the right colors. Every value below is
 * now copied directly from index.css's `@theme` block, not approximated.
 *
 * Dark is the only mode this app ships (the web reference supports a light
 * opt-in via a dev-only toggle; this mobile app has no Settings screen in
 * scope, so only `Colors.dark` is used — `light` is kept only so existing
 * `Colors[scheme]` call sites that key off `useColorScheme()` don't break).
 *
 * Geist / Geist Mono are loaded for real via `@expo-google-fonts/geist`
 * and `@expo-google-fonts/geist-mono` (plain npm packages bundling .ttf
 * files — no runtime network fetch, just a one-time `npm install`). See
 * `src/app/_layout.tsx` for the `useFonts` gate that loads these before
 * anything renders.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#121316',
    background: '#F5F3EE',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#ECE9E2',
    textSecondary: '#5F636B',
    border: '#DDD8CE',
    primary: '#C6F432',
    primaryHover: '#D4FA5C',
    onPrimary: '#0A0B0D',
    success: '#3F6212',
    danger: '#D92D20',
    warning: '#B54708',
  },
  dark: {
    text: '#F2F0EA',
    background: '#0A0B0D',
    backgroundElement: '#141619',
    backgroundSelected: '#1C1F24',
    textSecondary: '#8E929B',
    border: '#2A2E35',
    primary: '#C6F432',
    primaryHover: '#D4FA5C',
    onPrimary: '#0A0B0D',
    success: '#C6F432',
    danger: '#FF5A4E',
    warning: '#F5B642',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Card/sheet/pill are the Obsidiana y Lima shape primitives (buttons, chips,
// cards, bottom sheets). sm/md/lg/xl/full are index.css's separate scale for
// everything else (input fields, small icon containers) — real NexaBank
// inputs use `md` (12px), not a fraction of `card`.
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
  card: 20,
  sheet: 28,
  pill: 999,
} as const;

// Family names match exactly what `useFonts()` registers in `_layout.tsx`
// (the `Geist_400Regular` key loaded from `@expo-google-fonts/geist`, etc.)
// — RN resolves custom fonts by this exact string, `fontWeight` has no
// effect on them (each weight is its own font file/family).
export const Fonts = {
  sans: {
    regular: 'Geist_400Regular',
    medium: 'Geist_500Medium',
    semiBold: 'Geist_600SemiBold',
    bold: 'Geist_700Bold',
  },
  mono: {
    regular: 'GeistMono_400Regular',
    semiBold: 'GeistMono_600SemiBold',
  },
} as const;

// index.css's typography scale verbatim: size/lineHeight pairs from the
// `--text-*` theme keys, font-weight from the `.text-*` @layer base rules
// (display/h1 -> 700, h2/h3/body-strong/overline -> 600, body/caption ->
// 400). Spread one of these into a Text style instead of hand-picking
// fontSize/fontFamily per screen.
export const Typography = {
  display: { fontSize: 36, lineHeight: 44, fontFamily: Fonts.sans.bold },
  h1: { fontSize: 28, lineHeight: 36, fontFamily: Fonts.sans.bold },
  h2: { fontSize: 22, lineHeight: 30, fontFamily: Fonts.sans.semiBold },
  h3: { fontSize: 18, lineHeight: 26, fontFamily: Fonts.sans.semiBold },
  body: { fontSize: 16, lineHeight: 24, fontFamily: Fonts.sans.regular },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontFamily: Fonts.sans.semiBold },
  caption: { fontSize: 13, lineHeight: 18, fontFamily: Fonts.sans.regular },
  overline: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Fonts.sans.semiBold,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.06 * 12,
  },
} as const;

// index.css's explicit spacing stops (base 4px) — NOT a continuous
// multiply-by-4 scale, only these specific keys exist in the source theme.
export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

// index.css's --shadow-sm/md/lg. RN has no single `box-shadow` prop; this
// maps to iOS's shadow* props (Android needs `elevation` separately, kept
// deliberately subtle per the source comment: "depth comes from layered
// surfaces + 1px borders, not shadows").
export const Shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 16, elevation: 6 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 28, elevation: 10 },
} as const;

// AuthLayout.tsx's `px-5` (20) and each auth page's own `py-10` (40) — the
// horizontal/vertical page insets used by every phone/otp/register/pin
// screen. HomePage uses the same px-5 horizontally.
export const PageInset = {
  horizontal: Spacing[5],
  vertical: Spacing[10],
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
