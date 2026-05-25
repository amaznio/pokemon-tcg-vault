const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? 'http://localhost:4000';

function resolveBaseUrl() {
  const resolvedBase = (() => {
    if (typeof window === 'undefined') return apiBase;
    try {
      const url = new URL(apiBase);
      const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
      const isRemoteClientHost =
        window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

      if (isLocalhost && isRemoteClientHost) {
        url.hostname = window.location.hostname;
      }
      return url.toString().replace(/\/$/, '');
    } catch {
      return apiBase;
    }
  })();

  return resolvedBase;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body !== undefined && init?.body !== null;
  const response = await fetch(`${resolveBaseUrl()}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...(hasBody ? { 'content-type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function apiFetch<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}
