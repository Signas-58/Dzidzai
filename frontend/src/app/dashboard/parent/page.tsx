'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../components/providers/AuthProvider';
import { apiFetch } from '../../../lib/api';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell, Legend } from 'recharts';

type ChildDto = { id: string; name: string; gradeLevel: number; preferredLanguage: string };

type OverviewDto = {
  totalSessions: number;
  mostStudiedSubject: string | null;
  averageConfidenceScore: number | null;
  subjectDistribution: { subject: string; count: number }[];
};

type ProgressDto = {
  granularity: 'daily' | 'weekly';
  days: number;
  series: { date: string; count: number }[];
};

type RecommendationsDto = {
  recommendations: {
    subject: string;
    topic: string;
    reason: string;
    message: string;
    attempts: number;
    averageConfidenceScore: number;
  }[];
};

const PIE_COLORS = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#d97706'];

export default function ParentDashboardPage() {
  const router = useRouter();
  const { user, tokens, role, isLoading, logout } = useAuth();

  const [children, setChildren] = useState<ChildDto[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  const [overview, setOverview] = useState<OverviewDto | null>(null);
  const [progress, setProgress] = useState<ProgressDto | null>(null);
  const [recs, setRecs] = useState<RecommendationsDto | null>(null);

  const [dashLoading, setDashLoading] = useState(false);
  const [dashError, setDashError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!tokens?.accessToken) {
      router.replace('/login');
      return;
    }
    if (role && role !== 'PARENT') {
      router.replace('/dashboard/teacher');
    }
  }, [isLoading, tokens?.accessToken, role, router]);

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
  }, [tokens?.accessToken, selectedChildId]);

  useEffect(() => {
    if (!tokens?.accessToken) return;

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setDashLoading(true);
      setDashError(null);
      try {
        const childIdParam = selectedChildId ? `?childId=${encodeURIComponent(selectedChildId)}` : '';

        const [o, p, r] = await Promise.all([
          apiFetch<{ success: boolean; data: OverviewDto }>(`/analytics/overview${childIdParam}`, {
            method: 'GET',
            token: tokens.accessToken,
            signal: controller.signal,
          }),
          apiFetch<{ success: boolean; data: ProgressDto }>(`/analytics/progress${childIdParam}`, {
            method: 'GET',
            token: tokens.accessToken,
            signal: controller.signal,
          }),
          apiFetch<{ success: boolean; data: RecommendationsDto }>(`/analytics/recommendations${childIdParam}`, {
            method: 'GET',
            token: tokens.accessToken,
            signal: controller.signal,
          }),
        ]);

        if (cancelled) return;
        setOverview(o.data);
        setProgress(p.data);
        setRecs(r.data);
      } catch (e) {
        if (cancelled) return;
        setDashError(e instanceof Error ? e.message : 'Failed to load analytics');
      } finally {
        if (!cancelled) setDashLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [tokens?.accessToken, selectedChildId]);

  const hasData = Boolean(overview && overview.totalSessions > 0);

  const subjectPieData = useMemo(() => {
    return overview?.subjectDistribution?.map((s) => ({ name: s.subject, value: s.count })) || [];
  }, [overview]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
          <p className="text-gray-600">Welcome{user?.firstName ? `, ${user.firstName}` : ''}.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/')}>Home</Button>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-gray-600">
          Learning analytics based on AI sessions.
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Child</label>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900"
          >
            <option value="">All children</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {dashError ? (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {dashError}
        </div>
      ) : null}

      {dashLoading ? (
        <div className="mt-6 rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-600">
          Loading analytics...
        </div>
      ) : null}

      {!dashLoading && overview && !hasData ? (
        <div className="mt-6 card">
          <h2 className="text-lg font-semibold text-gray-900">No activity yet</h2>
          <p className="mt-1 text-sm text-gray-600">Start learning to see insights here.</p>
        </div>
      ) : null}

      {!dashLoading && hasData && overview ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="text-sm text-gray-600">Total Sessions</div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{overview.totalSessions}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Most Studied Subject</div>
            <div className="mt-2 text-2xl font-bold text-gray-900">{overview.mostStudiedSubject || '—'}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Avg Confidence</div>
            <div className="mt-2 text-2xl font-bold text-gray-900">
              {typeof overview.averageConfidenceScore === 'number'
                ? `${Math.round(overview.averageConfidenceScore * 100)}%`
                : '—'}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Activity Over Time</h2>
          <p className="mt-1 text-gray-600 text-sm">Sessions in the last {progress?.days || 30} days.</p>

          {!progress?.series?.length ? (
            <div className="mt-4 rounded-md border border-gray-200 p-4 text-sm text-gray-700">
              No activity data yet.
            </div>
          ) : (
            <div className="mt-4" style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={progress.series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Subject Distribution</h2>
          <p className="mt-1 text-gray-600 text-sm">Which subjects you study the most.</p>

          {!subjectPieData.length ? (
            <div className="mt-4 rounded-md border border-gray-200 p-4 text-sm text-gray-700">
              No subjects yet.
            </div>
          ) : (
            <div className="mt-4" style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={subjectPieData} dataKey="value" nameKey="name" outerRadius={80}>
                    {subjectPieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recommendations</h2>
            <p className="mt-1 text-gray-600 text-sm">Suggested topics to focus on next.</p>
          </div>
          <Link href="/" className="text-sm text-primary-700 hover:underline">Back to learning</Link>
        </div>

        {!recs?.recommendations?.length ? (
          <div className="mt-4 rounded-md border border-gray-200 p-4 text-sm text-gray-700">
            No recommendations yet.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {recs.recommendations.map((r) => (
              <div key={`${r.subject}-${r.topic}`} className="rounded-lg border border-gray-200 p-4">
                <div className="text-xs font-semibold text-gray-500">{r.subject}</div>
                <div className="mt-1 text-sm font-semibold text-gray-900">{r.message}</div>
                <div className="mt-2 text-xs text-gray-600">
                  Attempts: {r.attempts} · Avg confidence: {Math.round(r.averageConfidenceScore * 100)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
