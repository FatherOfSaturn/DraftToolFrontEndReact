import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { googleLogout } from '@react-oauth/google';
import { accountApi } from '../account/api/accountApi';
import type { Account } from '../account/model/accountTypes';

const ACCOUNT_ID_KEY = 'drafttool_account_id';

interface AuthContextType {
  account: Account | null;
  isLoading: boolean;
  login: (idToken: string) => Promise<void>;
  logout: () => void;
  refreshAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        if (requestVersion.current === version) setAccount(savedAccount);
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
    } finally {
      if (requestVersion.current === version) setIsLoading(false);
    }
  }

  function logout() {
    requestVersion.current += 1;
    setAccount(null);
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
    <AuthContext.Provider value={{ account, isLoading, login, logout, refreshAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
