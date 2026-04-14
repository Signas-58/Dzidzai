'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../components/providers/AuthProvider';
import { generateAIWithOfflineSupport } from '../../lib/aiOfflineApi';
import { AIGeneratePayload, readCache } from '../../lib/offlineStore';
import { SpeechControls } from '../../components/ui/SpeechControls';
import { SpeechToTextButton } from '../../components/ui/SpeechToTextButton';

const SUBJECTS = ['Math', 'English', 'Science', 'Social Studies'] as const;
const LANGUAGES = ['Shona', 'Ndebele', 'Tonga'] as const;
const GRADE_LEVELS = ['ECD A', 'ECD B', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'] as const;

type Mode = 'idle' | 'online' | 'offline-cache' | 'offline-queued';

export default function LearnPage() {
  const router = useRouter();
  const { tokens, isLoading, logout } = useAuth();

  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>('Math');
  const [topic, setTopic] = useState('Addition');
  const [gradeLevel, setGradeLevel] = useState<(typeof GRADE_LEVELS)[number]>('Grade 3');
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]>('Shona');

  const [mode, setMode] = useState<Mode>('idle');
  const [result, setResult] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  const cached = useMemo(() => readCache(), [mode]);

  useEffect(() => {
    if (isLoading) return;
    if (!tokens?.accessToken) {
      router.replace('/login');
    }
  }, [isLoading, tokens?.accessToken, router]);

  const payload: AIGeneratePayload = useMemo(
    () => ({
      subject,
      topic,
      gradeLevel,
      language,
    }),
    [subject, topic, gradeLevel, language]
  );

  const onGenerate = async () => {
    if (!tokens?.accessToken) return;
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setBusy(true);
    try {
      const res = await generateAIWithOfflineSupport(
        {
          ...payload,
          topic: topic.trim(),
        },
        tokens.accessToken
      );

      if (res.mode === 'online') {
        setMode('online');
        setResult(res.data);
        toast.success('Generated online and saved');
      } else if (res.mode === 'offline-cache') {
        setMode('offline-cache');
        setResult(res.data);
        toast('Offline: served saved lesson');
      } else {
        setMode('offline-queued');
        setResult({ queuedId: res.queuedId });
        toast('Offline: request queued. It will sync when online.');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learn</h1>
          <p className="text-gray-600 text-sm">Works online, and falls back to saved lessons / queue when offline.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/dashboard/parent')}>Dashboard</Button>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Generate a lesson</h2>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as any)}
                className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Addition"
              aria-label="Topic"
              rightElement={
                <SpeechToTextButton
                  onResult={(text) => {
                    setTopic(text);
                    toast.success('Filled topic from voice');
                  }}
                />
              }
            />

            <div>
              <label className="text-sm font-medium text-gray-700">Grade level</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value as any)}
                className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900"
              >
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <Button onClick={onGenerate} isLoading={busy} disabled={busy}>
              Generate
            </Button>

            <div className="text-xs text-gray-600">
              Mode: <span className="font-semibold">{mode}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Result</h2>
          <div className="mt-3">
            <SpeechControls
              language={language}
              label="Listen"
              text={
                result && typeof result === 'object'
                  ? (() => {
                      const r: any = result as any;
                      const explanation = typeof r.explanation === 'string' ? r.explanation : '';
                      const example = typeof r.example === 'string' ? r.example : '';
                      const combined = [explanation, example].filter(Boolean).join('\n\n');
                      return combined || JSON.stringify(result);
                    })()
                  : result
                  ? String(result)
                  : ''
              }
            />
          </div>
          <div className="mt-4 rounded-md border border-gray-200 bg-white p-4 text-xs text-gray-800 overflow-auto" style={{ maxHeight: 420 }}>
            {result ? <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre> : 'No result yet.'}
          </div>
        </div>
      </div>

      <div className="mt-6 card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Saved lessons</h2>
            <p className="mt-1 text-sm text-gray-600">Last 20 cached AI responses (available offline).</p>
          </div>
          <Link href="/dashboard/parent" className="text-sm text-primary-700 hover:underline">
            Back to dashboard
          </Link>
        </div>

        {!cached.length ? (
          <div className="mt-4 rounded-md border border-gray-200 p-4 text-sm text-gray-700">No saved lessons yet.</div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {cached.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => {
                  setSubject(c.payload.subject as any);
                  setTopic(c.payload.topic);
                  setGradeLevel(c.payload.gradeLevel as any);
                  setLanguage(c.payload.language as any);
                  setMode('offline-cache');
                  setResult(c.response);
                  toast('Loaded saved lesson');
                }}
                className="text-left rounded-lg border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition"
              >
                <div className="text-xs font-semibold text-gray-500">{c.payload.subject}</div>
                <div className="mt-1 text-sm font-semibold text-gray-900">{c.payload.topic}</div>
                <div className="mt-2 text-xs text-gray-600">
                  {c.payload.gradeLevel} · {c.payload.language}
                </div>
                <div className="mt-2 text-[11px] text-gray-500">Saved: {new Date(c.cachedAt).toLocaleString()}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
