import { apiFetch } from './api';
import {
  AIGeneratePayload,
  enqueueRequest,
  getCachedResponse,
  upsertCachedResponse,
  readCache,
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

export async function syncCachedLessonsToBackend(token: string) {
  const cache = readCache();
  if (cache.length === 0) return { synced: 0, deduped: 0 };

  const activities = cache
    .map((c) => {
      const confidenceScore = (c.response as any)?.confidenceScore;
      if (typeof confidenceScore !== 'number') return null;
      const cachedAt = new Date(c.cachedAt);
      const ts = Number.isNaN(cachedAt.getTime()) ? 0 : cachedAt.getTime();
      const idempotencyKey = `cache-${c.key}-${ts}`;
      return {
        idempotencyKey,
        subject: c.payload.subject,
        topic: c.payload.topic,
        gradeLevel: c.payload.gradeLevel,
        language: c.payload.language,
        confidenceScore,
      };
    })
    .filter(Boolean);

  if (activities.length === 0) return { synced: 0, deduped: 0 };

  const res = await apiFetch<{ success: boolean; data: { inserted: number; deduped: number; received: number } }>(
    `/ai/sync-activities`,
    {
      method: 'POST',
      token,
      body: { activities },
    }
  );

  setLastSynced(new Date().toISOString());
  return { synced: res.data.inserted, deduped: res.data.deduped };
}
