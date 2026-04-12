export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data?.error) return String(data.error);
    if (data?.message) return String(data.message);
    return `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function apiFetch<T>(
  path: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    token?: string;
    signal?: AbortSignal;
    headers?: Record<string, string>;
  }
): Promise<T> {
  const res = await fetch(path.startsWith('/api') ? path : `/api${path}`, {
    method: options?.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options?.headers ? options.headers : {}),
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
    signal: options?.signal,
  });

  if (!res.ok) {
    const msg = await parseError(res);
    throw new ApiError(msg, res.status);
  }

  return (await res.json()) as T;
}
