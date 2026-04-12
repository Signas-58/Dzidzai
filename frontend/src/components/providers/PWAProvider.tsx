'use client';

import { ReactNode, useEffect } from 'react';

export function PWAProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch {
        // no-op
      }
    };

    register();
  }, []);

  return <>{children}</>;
}
