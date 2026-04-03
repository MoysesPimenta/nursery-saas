import { supabase } from './supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - attempt token refresh before signing out
    // Skip auto-redirect for /auth/me calls (handled gracefully by auth-context)
    if (res.status === 401 && !path.includes('/auth/me')) {
      // Attempt to refresh the session first
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshData?.session && !refreshError) {
        // Retry the original request with the new token
        const retryHeaders: HeadersInit = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshData.session.access_token}`,
          ...options.headers,
        };

        const retryRes = await fetch(`${API_URL}${path}`, {
          ...options,
          headers: retryHeaders,
        });

        if (retryRes.ok) {
          return retryRes.json();
        }
      }

      // Refresh failed — sign out and redirect
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        const locale = window.location.pathname.split('/')[1] || 'en';
        window.location.href = `/${locale}/auth/login`;
      }
      throw new Error('Unauthorized: Session expired');
    }

    if (!res.ok) {
      let errorMessage = res.statusText;
      try {
        const error = await res.json();
        errorMessage = error.error || error.message || res.statusText;
      } catch {
        // Response is not JSON, use status text
      }
      throw new Error(errorMessage);
    }

    return res.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('API request failed');
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  return api<T>(path, { method: 'GET' });
}

export async function apiPost<T>(path: string, data?: unknown): Promise<T> {
  return api<T>(path, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiPatch<T>(path: string, data?: unknown): Promise<T> {
  return api<T>(path, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return api<T>(path, { method: 'DELETE' });
}
