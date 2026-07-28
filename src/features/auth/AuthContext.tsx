import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { googleLogout } from '@react-oauth/google';
import { accountApi } from '../account/api/accountApi';
import { adminApi } from '../admin/api/adminApi';
import { env } from '../../config/env';
import type { Account } from '../account/model/accountTypes';

const ACCOUNT_ID_KEY = 'drafttool_account_id';

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
    const savedID = localStorage.getItem(ACCOUNT_ID_KEY);
    if (!savedID) {
      setIsLoading(false);
      return;
    }

    const version = ++requestVersion.current;
    accountApi
      .getAccount(savedID)
      .then((savedAccount) => {
        if (requestVersion.current !== version) return;
        setAccount(savedAccount);
        if (env.skipAuth) {
          setIsAdmin(true);
        } else {
          adminApi.checkAdmin(savedAccount.accountID)
            .then((res) => { if (requestVersion.current === version) setIsAdmin(res.isAdmin); })
            .catch(() => { if (requestVersion.current === version) setIsAdmin(false); });
        }
      })
      .catch(() => {
        if (requestVersion.current === version) localStorage.removeItem(ACCOUNT_ID_KEY);
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
      const nextAccount = await accountApi.login(idToken);
      if (requestVersion.current !== version) return;
      setAccount(nextAccount);
      localStorage.setItem(ACCOUNT_ID_KEY, nextAccount.accountID);
      if (env.skipAuth) {
        setIsAdmin(true);
      } else {
        adminApi.checkAdmin(nextAccount.accountID)
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
    localStorage.removeItem(ACCOUNT_ID_KEY);
    googleLogout();
  }

  async function refreshAccount() {
    if (!account) return;
    const accountID = account.accountID;
    const version = ++requestVersion.current;
    const refreshedAccount = await accountApi.getAccount(accountID);
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
