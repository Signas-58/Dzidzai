import { BackendRole } from './authApi';

export function roleToDashboard(role: BackendRole): string {
  if (role === 'PARENT') return '/dashboard/parent';
  if (role === 'CHILD') return '/dashboard/child';
  return '/dashboard/teacher';
}
