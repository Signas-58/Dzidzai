'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AuthCard } from '../../components/auth/AuthCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../components/providers/AuthProvider';
import { BackendRole } from '../../lib/authApi';

function validateStrongPassword(pw: string): string | null {
  const errors: string[] = [];
  if (pw.length < 8) errors.push('at least 8 characters');
  if (!/[A-Z]/.test(pw)) errors.push('one uppercase letter');
  if (!/[a-z]/.test(pw)) errors.push('one lowercase letter');
  if (!/[0-9]/.test(pw)) errors.push('one number');
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push('one symbol');
  return errors.length ? `Password must include ${errors.join(', ')}` : null;
}

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<BackendRole>('PARENT');
  const [isLoading, setIsLoading] = useState(false);

  const passwordError = useMemo(() => validateStrongPassword(password), [password]);
  const confirmError = useMemo(() => {
    if (!confirmPassword) return null;
    return confirmPassword !== password ? 'Passwords do not match' : null;
  }, [confirmPassword, password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (confirmError) {
      toast.error(confirmError);
      return;
    }

    setIsLoading(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role,
      });

      toast.success('Account created');
      router.push('/verify');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Sign up as a Parent or Teacher. Verification is simulated for now."
      footer={
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-700 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Tendai" />
          <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Moyo" />
        </div>

        <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" autoComplete="email" />

        <Input label="Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" type="password" autoComplete="new-password" error={password ? passwordError || undefined : undefined} />

        <Input label="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" type="password" autoComplete="new-password" error={confirmError || undefined} />

        <div className="space-y-1">
          <label className="label">Role</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('PARENT')}
              className={`btn ${role === 'PARENT' ? 'btn-primary' : 'btn-outline'} flex items-center justify-center gap-2`}
            >
              <span aria-hidden>👨‍👩‍👧</span>
              Parent
            </button>
            <button
              type="button"
              onClick={() => setRole('ADMIN')}
              className={`btn ${role === 'ADMIN' ? 'btn-primary' : 'btn-outline'} flex items-center justify-center gap-2`}
            >
              <span aria-hidden>👩‍🏫</span>
              Teacher
            </button>
          </div>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Create account
        </Button>

        <p className="text-xs text-gray-500">
          By continuing, you agree to our terms. (Placeholder)
        </p>
      </form>
    </AuthCard>
  );
}
