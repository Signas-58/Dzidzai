'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../components/providers/AuthProvider';

export default function ParentDashboardPage() {
  const router = useRouter();
  const { user, tokens, role, isLoading, logout } = useAuth();

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

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Children</h2>
          <p className="mt-1 text-gray-600 text-sm">Placeholder list for now.</p>

          <div className="mt-4 rounded-md border border-gray-200 p-4 text-sm text-gray-700">
            No children loaded yet.
          </div>

          <div className="mt-4">
            <Button className="w-full">Add Child</Button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900">Quick Links</h2>
          <div className="mt-4 space-y-2 text-sm">
            <Link href="/" className="text-primary-700 hover:underline">Back to landing page</Link>
            <div className="text-gray-500">More features coming soon.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
