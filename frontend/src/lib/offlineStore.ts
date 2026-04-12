export type AIGeneratePayload = {
  subject: string;
  topic: string;
  gradeLevel: string;
  language: string;
  childId?: string;
};

export type CachedAIResponse = {
  key: string;
  payload: AIGeneratePayload;
  response: unknown;
  cachedAt: string;
};

export type QueuedAIRequest = {
  id: string; // idempotency key
  payload: AIGeneratePayload;
  queuedAt: string;
};

const CACHE_KEY = 'dzidza_ai_ai_cache_v1';
const QUEUE_KEY = 'dzidza_ai_ai_queue_v1';
const LAST_SYNC_KEY = 'dzidza_ai_last_synced_v1';

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function makeAIKey(payload: AIGeneratePayload): string {
  return [payload.subject, payload.topic, payload.gradeLevel, payload.language]
    .map((s) => String(s || '').trim().toLowerCase())
    .join('::');
}

export function readCache(): CachedAIResponse[] {
  if (typeof window === 'undefined') return [];
  return safeParse<CachedAIResponse[]>(localStorage.getItem(CACHE_KEY)) || [];
}

export function writeCache(items: CachedAIResponse[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CACHE_KEY, JSON.stringify(items));
}

export function upsertCachedResponse(payload: AIGeneratePayload, response: unknown, maxItems = 20) {
  const key = makeAIKey(payload);
  const existing = readCache().filter((x) => x.key !== key);
  const next: CachedAIResponse[] = [
    {
      key,
      payload,
      response,
      cachedAt: new Date().toISOString(),
    },
    ...existing,
  ].slice(0, maxItems);

  writeCache(next);
}

export function getCachedResponse(payload: AIGeneratePayload): CachedAIResponse | null {
  const key = makeAIKey(payload);
  const items = readCache();
  return items.find((x) => x.key === key) || null;
}

export function readQueue(): QueuedAIRequest[] {
  if (typeof window === 'undefined') return [];
  return safeParse<QueuedAIRequest[]>(localStorage.getItem(QUEUE_KEY)) || [];
}

export function writeQueue(items: QueuedAIRequest[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export function enqueueRequest(payload: AIGeneratePayload): QueuedAIRequest {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const entry: QueuedAIRequest = {
    id,
    payload,
    queuedAt: new Date().toISOString(),
  };

  const next = [...readQueue(), entry];
  writeQueue(next);
  return entry;
}

export function dequeueRequest(id: string) {
  const next = readQueue().filter((x) => x.id !== id);
  writeQueue(next);
}

export function setLastSynced(iso: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_SYNC_KEY, iso);
}

export function getLastSynced(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}
