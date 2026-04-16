'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../components/providers/AuthProvider';
import { generateAIWithOfflineSupport } from '../../lib/aiOfflineApi';
import { AIGeneratePayload, getLastLearnInputs, getLastSynced, readCache, setLastLearnInputs } from '../../lib/offlineStore';
import { SpeechControls } from '../../components/ui/SpeechControls';
import { SpeechToTextButton } from '../../components/ui/SpeechToTextButton';
import { apiFetch } from '../../lib/api';

const SUBJECTS = ['Math', 'English', 'Science', 'Social Studies'] as const;
const LANGUAGES = ['Shona', 'Ndebele', 'Tonga'] as const;
const TRANSLATE_TARGETS = ['Shona', 'Ndebele', 'English'] as const;
const GRADE_LEVELS = ['ECD A', 'ECD B', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'] as const;

type Mode = 'idle' | 'online' | 'offline-cache' | 'offline-queued';

type ChildDto = { id: string; name: string; gradeLevel: number; preferredLanguage: string };

function formatLastSynced(iso: string | null) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleString();
}

function confidenceUi(confidenceScore: unknown): { label: string; className: string; value: number | null } {
  if (typeof confidenceScore !== 'number' || !Number.isFinite(confidenceScore)) {
    return { label: 'Confidence: —', className: 'text-gray-600 bg-gray-50 border-gray-200', value: null };
  }
  const v = Math.max(0, Math.min(1, confidenceScore));
  const pct = Math.round(v * 100);
  if (v > 0.8) return { label: `Confidence: ${pct}%`, className: 'text-emerald-800 bg-emerald-50 border-emerald-200', value: v };
  if (v >= 0.6) return { label: `Confidence: ${pct}%`, className: 'text-amber-800 bg-amber-50 border-amber-200', value: v };
  return { label: `Confidence: ${pct}%`, className: 'text-red-800 bg-red-50 border-red-200', value: v };
}

export default function LearnPage() {
  const router = useRouter();
  const { tokens, isLoading, logout } = useAuth();

  const [children, setChildren] = useState<ChildDto[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>('Math');
  const [topic, setTopic] = useState('Addition');
  const [gradeLevel, setGradeLevel] = useState<(typeof GRADE_LEVELS)[number]>('Grade 3');
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]>('Shona');

  const [mode, setMode] = useState<Mode>('idle');
  const [result, setResult] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, string>>({});
  const [practiceChecked, setPracticeChecked] = useState(false);

  const [translateTo, setTranslateTo] = useState<(typeof TRANSLATE_TARGETS)[number]>('English');

  const cached = useMemo(() => readCache(), [mode]);
  const lastSynced = useMemo(() => getLastSynced(), [mode]);

  useEffect(() => {
    if (isLoading) return;
    if (!tokens?.accessToken) {
      router.replace('/login');
    }
  }, [isLoading, tokens?.accessToken, router]);

  useEffect(() => {
    const last = getLastLearnInputs();
    if (!last) return;

    if (last.subject && SUBJECTS.includes(last.subject as any)) setSubject(last.subject as any);
    if (typeof last.topic === 'string' && last.topic.trim()) setTopic(last.topic);
    if (last.gradeLevel && GRADE_LEVELS.includes(last.gradeLevel as any)) setGradeLevel(last.gradeLevel as any);
    if (last.language && LANGUAGES.includes(last.language as any)) setLanguage(last.language as any);
    if (typeof last.childId === 'string') setSelectedChildId(last.childId);
  }, []);

  useEffect(() => {
    setLastLearnInputs({
      subject,
      topic,
      gradeLevel,
      language,
      childId: selectedChildId || undefined,
    });
  }, [subject, topic, gradeLevel, language, selectedChildId]);

  useEffect(() => {
    if (!tokens?.accessToken) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<{ success: boolean; data: ChildDto[] }>(`/users/children`, {
          method: 'GET',
          token: tokens.accessToken,
        });
        if (cancelled) return;
        setChildren(res.data);
        if (!selectedChildId && res.data.length > 0) {
          setSelectedChildId(res.data[0].id);
        }
      } catch {
        if (cancelled) return;
        setChildren([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tokens?.accessToken]);

  const payload: AIGeneratePayload = useMemo(
    () => ({
      subject,
      topic,
      gradeLevel,
      language,
      childId: selectedChildId || undefined,
    }),
    [subject, topic, gradeLevel, language, selectedChildId]
  );

  const onGenerate = async (opts?: { improve?: boolean; mode?: 'simplify' | 'translate'; translateTo?: string }) => {
    if (!tokens?.accessToken) return;
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setErrorText(null);

    setBusy(true);
    try {
      const res = await generateAIWithOfflineSupport(
        {
          ...payload,
          topic: topic.trim(),
          improve: Boolean(opts?.improve),
          mode: opts?.mode ? opts.mode : 'normal',
          ...(opts?.mode === 'translate' ? { translateTo: opts.translateTo } : {}),
        },
        tokens.accessToken
      );

      if (res.mode === 'online') {
        setMode('online');
        setResult(res.data);
        setPracticeMode(false);
        setPracticeAnswers({});
        setPracticeChecked(false);
        toast.success(opts?.improve ? 'Improved explanation saved' : 'Generated lesson saved');
      } else if (res.mode === 'offline-cache') {
        setMode('offline-cache');
        setResult(res.data);
        setPracticeMode(false);
        setPracticeAnswers({});
        setPracticeChecked(false);
        toast('You are offline. Showing saved lesson.');
      } else {
        setMode('offline-queued');
        setResult({ queuedId: res.queuedId });
        toast('Offline: request queued. It will sync when online.');
      }
    } catch (e) {
      setErrorText('Something went wrong. Please try again.');
      toast.error('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const confidenceScore = (result && typeof result === 'object' && (result as any).confidenceScore !== undefined)
    ? (result as any).confidenceScore
    : null;
  const confUi = confidenceUi(confidenceScore);

  const practiceQuestions: Array<{ question: string; hint: string; answer: string }> =
    result && typeof result === 'object' && Array.isArray((result as any).practice_questions)
      ? ((result as any).practice_questions as any[])
          .filter((q) => q && typeof q === 'object')
          .map((q) => ({
            question: String((q as any).question || ''),
            hint: String((q as any).hint || ''),
            answer: String((q as any).answer || ''),
          }))
      : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learn</h1>
          <p className="text-gray-600 text-sm">Works online, and falls back to saved lessons / queue when offline.</p>
          <div className="mt-1 text-xs text-gray-500">Last synced: {formatLastSynced(lastSynced)}</div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/dashboard/parent')}>Dashboard</Button>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>
      </div>

      {errorText ? (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorText}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Generate a lesson</h2>
              <p className="mt-1 text-sm text-gray-600">Tip: try offline mode in DevTools → Network → Offline.</p>
            </div>
            <Link href="/saved" className="text-sm text-primary-700 hover:underline">Saved lessons</Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Child</label>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900"
              >
                <option value="">All children</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

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

            <Button onClick={() => onGenerate()} isLoading={busy} disabled={busy}>
              {busy ? 'Generating lesson...' : 'Generate'}
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => onGenerate({ improve: true })}
                disabled={busy || !result || mode === 'offline-queued'}
                aria-label="Improve explanation"
                type="button"
              >
                Improve
              </Button>

              <Button
                variant="outline"
                onClick={() => onGenerate({ mode: 'simplify' })}
                disabled={busy || mode === 'offline-queued'}
                aria-label="Explain simpler"
                type="button"
              >
                Explain Simpler
              </Button>

              <div className="flex gap-2">
                <select
                  value={translateTo}
                  onChange={(e) => setTranslateTo(e.target.value as any)}
                  className="h-10 flex-1 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900"
                  aria-label="Translate target language"
                >
                  {TRANSLATE_TARGETS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  onClick={() => onGenerate({ mode: 'translate', translateTo })}
                  disabled={busy || mode === 'offline-queued'}
                  aria-label="Translate"
                  type="button"
                >
                  Translate
                </Button>
              </div>
            </div>

            <div className="text-xs text-gray-600">
              Mode: <span className="font-semibold">{mode}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Result</h2>
            <div className={`text-xs border rounded-full px-2.5 py-1 ${confUi.className}`}>{confUi.label}</div>
          </div>

          {confUi.value !== null && confUi.value < 0.6 ? (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              💡 We recommend revising this topic again.
            </div>
          ) : null}

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

          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <Button
              variant="outline"
              type="button"
              className="h-9"
              onClick={() => {
                if (!practiceQuestions.length) return;
                setPracticeMode((v) => !v);
                setPracticeChecked(false);
              }}
              disabled={!practiceQuestions.length}
              aria-label="Start practice"
            >
              📚 {practiceMode ? 'Close Practice' : 'Start Practice'}
            </Button>

            {practiceMode ? (
              <Button
                type="button"
                className="h-9"
                onClick={() => setPracticeChecked(true)}
                disabled={!practiceQuestions.length}
                aria-label="Check answers"
              >
                Check Answers
              </Button>
            ) : null}
          </div>

          {practiceMode ? (
            <div className="mt-4 space-y-3">
              {practiceQuestions.map((q, idx) => {
                const userAns = practiceAnswers[idx] ?? '';
                const correct = q.answer.trim();
                const isCorrect = practiceChecked && userAns.trim() === correct;
                const isWrong = practiceChecked && userAns.trim() !== '' && userAns.trim() !== correct;

                return (
                  <div key={idx} className="rounded-lg border border-gray-200 p-4">
                    <div className="text-sm font-semibold text-gray-900">{idx + 1}. {q.question}</div>
                    <div className="mt-1 text-xs text-gray-600">Hint: {q.hint}</div>

                    <div className="mt-3 flex flex-col md:flex-row md:items-center gap-2">
                      <input
                        value={userAns}
                        onChange={(e) => {
                          setPracticeAnswers((prev) => ({ ...prev, [idx]: e.target.value }));
                          setPracticeChecked(false);
                        }}
                        className={`input ${isCorrect ? 'border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500' : isWrong ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        placeholder="Your answer"
                        aria-label={`Answer for question ${idx + 1}`}
                      />
                      {practiceChecked ? (
                        <div className={`text-sm font-semibold ${isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                          {isCorrect ? 'Correct' : `Correct: ${correct}`}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
          <div className="mt-4 rounded-md border border-gray-200 bg-white p-4 text-xs text-gray-800 overflow-auto" style={{ maxHeight: 420 }}>
            {busy ? (
              <div className="text-sm text-gray-600">Generating lesson...</div>
            ) : result ? (
              <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            ) : (
              'No result yet.'
            )}
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
