import { Platform } from 'react-native';
import { demoFetch, isDemoApiUrl } from './demoBackend';

type RequestOptions = RequestInit & {
  token?: string;
};

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'android' ? 'http://10.0.2.2:3000/api/v1' : 'http://localhost:3000/api/v1');

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (isDemoApiUrl(API_BASE_URL)) {
    return demoFetch<T>(path, options);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'content-type': 'application/json',
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch (error) {
    if (Platform.OS === 'web') {
      return demoFetch<T>(path, options);
    }

    throw error;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error?.message ?? `Request failed with ${response.status}`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  return payload.data as T;
}
