'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthProvider';
import { getLastSynced } from '../../lib/offlineStore';
import { syncQueuedAIRequests } from '../../lib/aiOfflineApi';

type OfflineContextValue = {
  isOnline: boolean;
  lastSynced: string | null;
  queuedCount: number;
  syncNow: () => Promise<void>;
};

const OfflineContext = createContext<OfflineContextValue | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { tokens } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const update = () => {
      setIsOnline(navigator.onLine);
      setLastSynced(getLastSynced());
      try {
        const raw = localStorage.getItem('dzidza_ai_ai_queue_v1');
        const items = raw ? (JSON.parse(raw) as unknown[]) : [];
        setQueuedCount(items.length);
      } catch {
        setQueuedCount(0);
      }
    };

    update();

    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    window.addEventListener('storage', update);

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  const syncNow = async () => {
    if (!tokens?.accessToken) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    await syncQueuedAIRequests(tokens.accessToken);

    setLastSynced(getLastSynced());
    try {
      const raw = localStorage.getItem('dzidza_ai_ai_queue_v1');
      const items = raw ? (JSON.parse(raw) as unknown[]) : [];
      setQueuedCount(items.length);
    } catch {
      setQueuedCount(0);
    }
  };

  useEffect(() => {
    if (!tokens?.accessToken) return;
    if (!isOnline) return;

    syncNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.accessToken, isOnline]);

  const value = useMemo(
    () => ({
      isOnline,
      lastSynced,
      queuedCount,
      syncNow,
    }),
    [isOnline, lastSynced, queuedCount]
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOffline must be used within OfflineProvider');
  return ctx;
}
