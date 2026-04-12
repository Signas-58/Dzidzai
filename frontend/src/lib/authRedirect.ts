import { BackendRole } from './authApi';

export function roleToDashboard(role: BackendRole): string {
  return role === 'PARENT' ? '/dashboard/parent' : '/dashboard/teacher';
}
