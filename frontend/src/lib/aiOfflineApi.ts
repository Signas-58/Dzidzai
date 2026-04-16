import { apiFetch } from './api';
import {
  AIGeneratePayload,
  enqueueRequest,
  getCachedResponse,
  upsertCachedResponse,
  readQueue,
  dequeueRequest,
  setLastSynced,
} from './offlineStore';

export type AIGenerateResult = unknown;

export async function generateAIOnline(
  payload: AIGeneratePayload & { improve?: boolean },
  token: string,
  idempotencyKey?: string
) {
  const res = await apiFetch<{ success: boolean; data: AIGenerateResult }>(`/ai/generate`, {
    method: 'POST',
    token,
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    body: payload,
  });
  return res.data;
}

export async function generateAIWithOfflineSupport(payload: AIGeneratePayload & { improve?: boolean }, token: string) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const cached = getCachedResponse(payload);
    if (cached) {
      return { mode: 'offline-cache' as const, data: cached.response };
    }

    const queued = enqueueRequest(payload);
    return { mode: 'offline-queued' as const, queuedId: queued.id };
  }

  const data = await generateAIOnline(payload, token);
  upsertCachedResponse(payload, data);
  setLastSynced(new Date().toISOString());
  return { mode: 'online' as const, data };
}

export async function syncQueuedAIRequests(token: string) {
  const queue = readQueue();
  if (queue.length === 0) {
    setLastSynced(new Date().toISOString());
    return { synced: 0 };
  }

  let synced = 0;
  for (const item of queue) {
    const data = await generateAIOnline(item.payload, token, item.id);
    upsertCachedResponse(item.payload, data);
    dequeueRequest(item.id);
    synced += 1;
  }

  setLastSynced(new Date().toISOString());
  return { synced };
}
