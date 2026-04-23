'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../components/providers/AuthProvider';
import { roleToDashboard } from '../../../lib/authRedirect';

export default function ChildDashboardPage() {
  const router = useRouter();
  const { user, tokens, role, isLoading, logout } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!tokens?.accessToken) {
      router.replace('/login');
      return;
    }
    if (role && role !== 'CHILD') {
      router.replace(roleToDashboard(role));
    }
  }, [isLoading, tokens?.accessToken, role, router]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Dashboard</h1>
          <p className="text-gray-600">
            Welcome{user?.firstName ? `, ${user.firstName}` : ''}. Ready to learn?
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/learn')}>Learn</Button>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Start a lesson</h2>
          <p className="mt-1 text-gray-600 text-sm">Generate a new lesson and begin practicing.</p>
          <div className="mt-4">
            <Button className="w-full" onClick={() => router.push('/learn')}>Start learning</Button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Saved lessons</h2>
          <p className="mt-1 text-gray-600 text-sm">Open lessons you saved for offline or later.</p>
          <div className="mt-4">
            <Button className="w-full" variant="outline" onClick={() => router.push('/saved')}>View saved</Button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Keep going</h2>
          <p className="mt-1 text-gray-600 text-sm">Practice a little every day to improve quickly.</p>
          <div className="mt-4 rounded-md border border-gray-200 p-4 text-sm text-gray-700">
            Tip: Choose a subject, ask for an explanation, then try a few questions.
          </div>
        </div>
      </div>
    </div>
  );
}
