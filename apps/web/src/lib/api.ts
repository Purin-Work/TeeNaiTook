import { handleStandaloneDemo, standaloneDemoEnabled } from './standalone-demo';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (typeof window === 'undefined' && standaloneDemoEnabled()) {
    const result = handleStandaloneDemo(path, options.method || 'GET');
    if (result.status >= 400) {
      const body = result.body as { error?: { code?: string; message?: string } };
      throw new ApiError(
        result.status,
        body.error?.code || 'DEMO_API_ERROR',
        body.error?.message || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
      );
    }
    return result.body as T;
  }
  const base =
    typeof window === 'undefined'
      ? process.env.API_INTERNAL_URL || 'http://localhost:4000/api'
      : process.env.NEXT_PUBLIC_API_URL || '/api';
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      cache: 'no-store',
      credentials: 'include',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      signal: options.signal ?? AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError(503, 'NETWORK_ERROR', 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message: unknown = body.error?.message;
    throw new ApiError(
      response.status,
      body.error?.code || 'API_ERROR',
      Array.isArray(message)
        ? message.join(' · ')
        : typeof message === 'string'
          ? message
          : 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
    );
  }
  return body as T;
}
