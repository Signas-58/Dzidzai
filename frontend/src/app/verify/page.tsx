'use client';

import { useRouter } from 'next/navigation';
import { AuthCard } from '../../components/auth/AuthCard';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../components/providers/AuthProvider';
import { roleToDashboard } from '../../lib/authRedirect';

export default function VerifyPage() {
  const router = useRouter();
  const { role } = useAuth();

  return (
    <AuthCard
      title="Account created successfully"
      subtitle="We’ve sent a verification email (simulated). Click continue to proceed."
    >
      <div className="space-y-4">
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Verification is simulated for this demo. No email is actually sent.
        </div>

        <Button
          className="w-full"
          onClick={() => {
            if (role) router.push(roleToDashboard(role));
            else router.push('/dashboard/parent');
          }}
        >
          Continue to Dashboard
        </Button>
      </div>
    </AuthCard>
  );
}
