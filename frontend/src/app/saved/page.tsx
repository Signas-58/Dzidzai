'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '../../components/ui/Button';
import { readCache, CachedAIResponse, getLastSynced } from '../../lib/offlineStore';
import toast from 'react-hot-toast';
import { useAuth } from '../../components/providers/AuthProvider';
import { syncCachedLessonsToBackend } from '../../lib/aiOfflineApi';

function formatLastSynced(iso: string | null) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleString();
}

export default function SavedLessonsPage() {
  const [selected, setSelected] = useState<CachedAIResponse | null>(null);

  const { tokens } = useAuth();
  const [syncing, setSyncing] = useState(false);

  const [cache, setCache] = useState<CachedAIResponse[]>([]);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  useEffect(() => {
    setCache(readCache());
    setLastSynced(getLastSynced());
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📚 Saved Lessons</h1>
          <p className="text-gray-600 text-sm">Last synced: {formatLastSynced(lastSynced)}</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-10"
            type="button"
            disabled={!tokens?.accessToken || syncing}
            onClick={async () => {
              if (!tokens?.accessToken) {
                toast.error('Please log in to sync.');
                return;
              }
              setSyncing(true);
              try {
                const res = await syncCachedLessonsToBackend(tokens.accessToken);
                setLastSynced(new Date().toISOString());
                toast.success(`Synced ${res.synced} lesson(s).`);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Sync failed');
              } finally {
                setSyncing(false);
              }
            }}
            aria-label="Sync saved lessons"
          >
            {syncing ? 'Syncing...' : 'Sync to Account'}
          </Button>
          <Link href="/learn" className="text-sm text-primary-700 hover:underline">Back to Learn</Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Lessons</h2>
            <div className="text-xs text-gray-500">{cache.length} saved</div>
          </div>

          {!cache.length ? (
            <div className="mt-4 rounded-md border border-gray-200 p-4 text-sm text-gray-700">No saved lessons yet.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {cache.map((c) => (
                <div key={c.key} className="rounded-lg border border-gray-200 p-4">
                  <div className="text-xs font-semibold text-gray-500">{c.payload.subject}</div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">{c.payload.topic}</div>
                  <div className="mt-2 text-xs text-gray-600">{c.payload.gradeLevel} · {c.payload.language}</div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-[11px] text-gray-500">Saved: {new Date(c.cachedAt).toLocaleString()}</div>
                    <Button variant="outline" className="h-9" type="button" onClick={() => setSelected(c)} aria-label="Open saved lesson">
                      Open
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
          <div className="mt-4 rounded-md border border-gray-200 bg-white p-4 text-xs text-gray-800 overflow-auto" style={{ maxHeight: 520 }}>
            {selected ? <pre className="whitespace-pre-wrap">{JSON.stringify(selected.response, null, 2)}</pre> : 'Select a lesson to preview.'}
          </div>
        </div>
      </div>
    </div>
  );
}
