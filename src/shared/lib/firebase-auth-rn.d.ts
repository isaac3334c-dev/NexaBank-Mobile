import type { Persistence } from "firebase/auth";

// @firebase/auth's package.json lists a "react-native" export condition with
// its own types (dist/rn/index.rn.d.ts), but the sibling top-level "types"
// key is matched first by tsc regardless of customConditions, so
// `getReactNativePersistence` is invisible to the type checker even though
// Metro resolves the real RN build (which does export it) at runtime.
declare module "@firebase/auth" {
  export function getReactNativePersistence(storage: unknown): Persistence;
}
