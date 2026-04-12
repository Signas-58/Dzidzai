import { apiFetch } from './api';

export type BackendRole = 'PARENT' | 'ADMIN';

export interface BackendUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: BackendRole;
}

export interface BackendTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: BackendUser;
  tokens: BackendTokens;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: BackendRole;
}

export async function register(req: RegisterRequest): Promise<AuthResponse> {
  const res = await apiFetch<{ success: boolean; data: AuthResponse }>(`/auth/register`, {
    method: 'POST',
    body: req,
  });
  return res.data;
}

export async function login(req: { email: string; password: string }): Promise<AuthResponse> {
  const res = await apiFetch<{ success: boolean; data: AuthResponse }>(`/auth/login`, {
    method: 'POST',
    body: req,
  });
  return res.data;
}

export async function me(token: string): Promise<BackendUser> {
  const res = await apiFetch<{ success: boolean; data: BackendUser }>(`/auth/me`, {
    method: 'GET',
    token,
  });
  return res.data;
}
