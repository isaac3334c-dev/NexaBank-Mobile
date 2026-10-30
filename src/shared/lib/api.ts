import { auth } from "./firebase";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface ApiErrorResponse {
  timestamp?: string;
  status: number;
  error: string;
  message: string;
  path?: string;
  traceId?: string;
}

export class ApiError extends Error {
  constructor(public readonly response: ApiErrorResponse) {
    super(response.message);
    this.name = "ApiError";
  }
}

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const idToken = await auth.currentUser?.getIdToken();

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (idToken) {
    headers.set("Authorization", `Bearer ${idToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new ApiError(
      errorBody ?? {
        status: response.status,
        error: "UNKNOWN_ERROR",
        message: response.statusText,
      },
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
