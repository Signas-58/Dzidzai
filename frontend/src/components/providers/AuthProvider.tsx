'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { me as meApi, login as loginApi, register as registerApi, AuthResponse, BackendRole, BackendUser, BackendTokens } from '../../lib/authApi';

interface AuthContextType {
  user: BackendUser | null;
  tokens: BackendTokens | null;
  role: BackendRole | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { email: string; password: string; firstName: string; lastName: string; role: BackendRole }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [tokens, setTokens] = useState<BackendTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('dzidza_auth');
    if (!stored) {
      setIsLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as { tokens?: BackendTokens; user?: BackendUser };
      if (parsed?.tokens?.accessToken) {
        setTokens(parsed.tokens);
      }
      if (parsed?.user?.id) {
        setUser(parsed.user);
      }
    } catch {
      localStorage.removeItem('dzidza_auth');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persist = (data: { user: BackendUser | null; tokens: BackendTokens | null }) => {
    localStorage.setItem('dzidza_auth', JSON.stringify(data));
  };

  const applyAuth = (data: AuthResponse) => {
    setUser(data.user);
    setTokens(data.tokens);
    persist({ user: data.user, tokens: data.tokens });
  };

  const refreshProfile = async () => {
    if (!tokens?.accessToken) return;
    const profile = await meApi(tokens.accessToken);
    setUser(profile);
    persist({ user: profile, tokens });
  };

  const login = async (email: string, password: string) => {
    const data = await loginApi({ email, password });
    applyAuth(data);
  };

  const register = async (userData: { email: string; password: string; firstName: string; lastName: string; role: BackendRole }) => {
    const data = await registerApi(userData);
    applyAuth(data);
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('dzidza_auth');
  };

  const role = user?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        role,
        login,
        register,
        logout,
        refreshProfile,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
