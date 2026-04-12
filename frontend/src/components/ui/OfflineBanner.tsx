'use client';

import { useOffline } from '../providers/OfflineProvider';
import { Button } from './Button';

function formatLastSynced(iso: string | null) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleString();
}

export function OfflineBanner() {
  const { isOnline, lastSynced, queuedCount, syncNow } = useOffline();

  return (
    <div
      className={
        isOnline
          ? 'bg-emerald-50 border-b border-emerald-200 text-emerald-900'
          : 'bg-amber-50 border-b border-amber-200 text-amber-900'
      }
    >
      <div className="max-w-5xl mx-auto px-4 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="text-sm">
          <span className="font-semibold">{isOnline ? 'Online' : 'You are offline'}</span>
          <span className="ml-2 opacity-80">Last synced: {formatLastSynced(lastSynced)}</span>
          {queuedCount > 0 ? <span className="ml-2 opacity-80">Queued: {queuedCount}</span> : null}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="h-9" onClick={syncNow} disabled={!isOnline || queuedCount === 0}>
            Sync now
          </Button>
        </div>
      </div>
    </div>
  );
}
