import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AdminAuthContext {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AdminAuthCtx = createContext<AdminAuthContext>({
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("admin_token")
  );

  const login = (t: string) => {
    localStorage.setItem("admin_token", t);
    setToken(t);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
  };

  return (
    <AdminAuthCtx.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AdminAuthCtx.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthCtx);
}

export function adminFetch(path: string, token: string | null, options?: RequestInit) {
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });
}
