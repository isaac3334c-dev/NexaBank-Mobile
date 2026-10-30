import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "nexabank:deviceId";

/**
 * RFC-4122-ish v4 UUID generator using Math.random().
 *
 * Deviation from the brief's suggested `crypto.randomUUID()`: neither
 * `expo-crypto` nor `react-native-get-random-values` is installed in this
 * project, and Hermes does not guarantee a global `crypto.randomUUID` without
 * one of those polyfills. Since this ID is only used as a non-secret device
 * label for `pin/setup` / `pin/verify` (not for anything cryptographic), a
 * Math.random()-based UUID is an acceptable, dependency-free substitute.
 */
function generateUuidV4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cachedDeviceId: string | null = null;

/** Stable per-install device id, persisted in AsyncStorage across launches. */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (stored) {
    cachedDeviceId = stored;
    return stored;
  }

  const fresh = generateUuidV4();
  await AsyncStorage.setItem(DEVICE_ID_KEY, fresh);
  cachedDeviceId = fresh;
  return fresh;
}

export function getDeviceName(): string {
  return Device.deviceName ?? "Unknown device";
}

export function getDevicePlatform(): string {
  return Platform.OS;
}
