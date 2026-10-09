import { createContext, createElement, useContext, useEffect, useState } from 'react';
import { getSession, onAuthChange, signOut } from '../services/authService.js';

const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL ?? '').toLowerCase();

// 관리자 여부는 여기서만 판단한다. 화면 표시용이고 실제 권한은 DB의 RLS(is_admin)가 막는다.
function isAdminSession(session) {
  return Boolean(session?.user?.email) && session.user.email.toLowerCase() === adminEmail;
}

const AuthContext = createContext({ isAdmin: false, ready: false });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getSession().then((current) => {
      setSession(current);
      setReady(true);
    });
    return onAuthChange(setSession);
  }, []);

  const isAdmin = isAdminSession(session);

  // 관리자가 아닌 계정으로 로그인된 상태는 즉시 끝낸다.
  useEffect(() => {
    if (session && !isAdmin) signOut();
  }, [session, isAdmin]);

  return createElement(AuthContext.Provider, { value: { isAdmin, ready } }, children);
}

export default function useAuth() {
  return useContext(AuthContext);
}
