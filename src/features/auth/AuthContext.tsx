import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { googleLogout } from '@react-oauth/google';
import { accountApi } from '../account/api/accountApi';
import { adminApi } from '../admin/api/adminApi';
import { env } from '../../config/env';
import { getSessionToken, setSessionToken } from '../../shared/api/sessionToken';
import type { Account } from '../account/model/accountTypes';

const ACCOUNT_ID_KEY = 'drafttool_account_id';

// Stored in sessionStorage (not localStorage) so the account id is not
// persisted across browser sessions or readable by other tabs once the
// session ends. The backend is still the source of truth on mount.

interface AuthContextType {
  account: Account | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (idToken: string) => Promise<void>;
  logout: () => void;
  refreshAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    const savedID = sessionStorage.getItem(ACCOUNT_ID_KEY);
    const savedToken = getSessionToken();
    if (!savedID || !savedToken) {
      setIsLoading(false);
      return;
    }

    const version = ++requestVersion.current;
    accountApi
      .getAccount()
      .then((savedAccount) => {
        if (requestVersion.current !== version) return;
        setAccount(savedAccount);
        if (env.skipAuth) {
          setIsAdmin(true);
        } else {
          adminApi.checkAdmin()
            .then((res) => { if (requestVersion.current === version) setIsAdmin(res.isAdmin); })
            .catch(() => { if (requestVersion.current === version) setIsAdmin(false); });
        }
      })
      .catch(() => {
        if (requestVersion.current === version) {
          sessionStorage.removeItem(ACCOUNT_ID_KEY);
          setSessionToken(null);
        }
      })
      .finally(() => {
        if (requestVersion.current === version) setIsLoading(false);
      });

    return () => {
      if (requestVersion.current === version) requestVersion.current += 1;
    };
  }, []);

  async function login(idToken: string) {
    const version = ++requestVersion.current;
    try {
      const { account: nextAccount, jwt } = await accountApi.login(idToken);
      if (requestVersion.current !== version) return;
      setAccount(nextAccount);
      setSessionToken(jwt);
      sessionStorage.setItem(ACCOUNT_ID_KEY, nextAccount.accountID);
      if (env.skipAuth) {
        setIsAdmin(true);
      } else {
        adminApi.checkAdmin()
          .then((res) => { if (requestVersion.current === version) setIsAdmin(res.isAdmin); })
          .catch(() => { if (requestVersion.current === version) setIsAdmin(false); });
      }
    } finally {
      if (requestVersion.current === version) setIsLoading(false);
    }
  }

  function logout() {
    requestVersion.current += 1;
    setAccount(null);
    setIsAdmin(false);
    setIsLoading(false);
    sessionStorage.removeItem(ACCOUNT_ID_KEY);
    setSessionToken(null);
    googleLogout();
    accountApi.logout().catch(() => {
      // Best-effort server-side invalidation; local state is already cleared.
    });
  }

  async function refreshAccount() {
    if (!account) return;
    const version = ++requestVersion.current;
    const refreshedAccount = await accountApi.getAccount();
    if (requestVersion.current === version) setAccount(refreshedAccount);
  }

  return (
    <AuthContext.Provider value={{ account, isLoading, isAdmin, login, logout, refreshAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
