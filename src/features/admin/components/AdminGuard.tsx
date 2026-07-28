import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export function AdminGuard({ children }: { children: ReactNode }) {
  const { account, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-dim">
        <div className="flex flex-col items-center gap-md">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="font-label-md text-on-surface-variant">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  if (!account || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
