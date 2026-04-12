'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { AuthCard } from '../../components/auth/AuthCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../components/providers/AuthProvider';
import { roleToDashboard } from '../../lib/authRedirect';

export default function LoginPage() {
  const router = useRouter();
  const { login, role } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error('Email and password are required');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back');

      // role might not update synchronously; do a short microtask to allow context update
      setTimeout(() => {
        const r = role;
        if (r) router.push(roleToDashboard(r));
        else router.push('/dashboard/parent');
      }, 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Sign in"
      subtitle="Access your dashboard."
      footer={
        <p className="text-sm text-gray-600">
          Don’t have an account?{' '}
          <Link href="/signup" className="text-primary-700 font-medium hover:underline">
            Create one
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" autoComplete="email" />

        <Input
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          }
        />

        <Button type="submit" isLoading={isLoading} className="w-full">
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
