'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../components/providers/AuthProvider';
import { roleToDashboard } from '../../../lib/authRedirect';

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { user, tokens, role, isLoading, logout } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!tokens?.accessToken) {
      router.replace('/login');
      return;
    }
    if (role && role !== 'ADMIN') {
      router.replace(roleToDashboard(role));
    }
  }, [isLoading, tokens?.accessToken, role, router]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-600">Welcome{user?.firstName ? `, ${user.firstName}` : ''}.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/')}>Home</Button>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Review Content</h2>
          <p className="mt-1 text-gray-600 text-sm">Placeholder section for teacher/admin workflows.</p>
          <div className="mt-4 rounded-md border border-gray-200 p-4 text-sm text-gray-700">
            Coming soon: review AI-generated lessons, validate content, and manage curriculum.
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Admin Tools</h2>
          <p className="mt-1 text-gray-600 text-sm">Placeholder.</p>
          <div className="mt-4 rounded-md border border-gray-200 p-4 text-sm text-gray-700">
            Coming soon.
          </div>
        </div>
      </div>
    </div>
  );
}
