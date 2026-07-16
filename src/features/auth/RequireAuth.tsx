import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { StatusScreen } from '../../shared/components/StatusScreen';
import { useAuth } from './AuthContext';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { account, isLoading } = useAuth();

  if (isLoading) return <StatusScreen>Restoring your account…</StatusScreen>;
  if (!account) return <Navigate to="/login" replace />;
  return children;
}
