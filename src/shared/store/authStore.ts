import { signInWithCustomToken, signOut } from "firebase/auth";
import { create } from "zustand";

import { apiFetch } from "@/shared/lib/api";
import { getDeviceId, getDeviceName, getDevicePlatform } from "@/shared/lib/device";
import { auth } from "@/shared/lib/firebase";

export interface UserResponse {
  id: string;
  email: string | null;
  displayName: string;
  phone: string;
  status: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

interface AuthResponse {
  message: string;
  token: string | null;
  requiresRegistration: boolean | null;
  requiresPin: boolean | null;
  authenticated: boolean;
  user: UserResponse | null;
  confirmationToken: string | null;
}

export interface RegisterPayload {
  phone: string;
  firstName: string;
  lastName: string;
  documentId: string;
  address: string;
  country: string;
  email?: string;
  displayName: string;
  pin: string;
}

interface AuthState {
  phone: string | null;
  profile: UserResponse | null;
  isCheckingSession: boolean;

  setPhone: (phone: string) => void;

  startPhoneVerification: (phone: string) => Promise<{ message: string }>;
  verifyOtp: (phone: string, code: string) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  setupPin: (pin: string) => Promise<AuthResponse>;
  verifyPin: (pin: string) => Promise<AuthResponse>;

  signInWithToken: (token: string) => Promise<void>;
  fetchProfile: () => Promise<UserResponse>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  phone: null,
  profile: null,
  isCheckingSession: true,

  setPhone: (phone) => set({ phone }),

  startPhoneVerification: async (phone) => {
    return apiFetch<{ message: string }>("/auth/phone/start", {
      method: "POST",
      body: { phone },
    });
  },

  verifyOtp: async (phone, code) => {
    return apiFetch<AuthResponse>("/auth/phone/verify", {
      method: "POST",
      body: { phone, code },
    });
  },

  register: async (payload) => {
    return apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: payload,
    });
  },

  setupPin: async (pin) => {
    const deviceId = await getDeviceId();
    return apiFetch<AuthResponse>("/auth/pin/setup", {
      method: "POST",
      body: {
        pin,
        deviceId,
        deviceName: getDeviceName(),
        platform: getDevicePlatform(),
      },
    });
  },

  verifyPin: async (pin) => {
    const deviceId = await getDeviceId();
    return apiFetch<AuthResponse>("/auth/pin/verify", {
      method: "POST",
      body: {
        pin,
        deviceId,
        deviceName: getDeviceName(),
        platform: getDevicePlatform(),
      },
    });
  },

  signInWithToken: async (token) => {
    await signInWithCustomToken(auth, token);
  },

  fetchProfile: async () => {
    const profile = await apiFetch<UserResponse>("/users/me");
    set({ profile });
    return profile;
  },

  logout: async () => {
    await signOut(auth);
    set({ phone: null, profile: null });
  },
}));
