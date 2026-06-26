import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from './api/client';

const AuthCtx = createContext(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api.getToken()) { setLoading(false); return; }
    api.fetchMe()
      .then(setUser)
      .catch(() => api.setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user } = await api.login({ email, password });
    api.setToken(token);
    setUser(user);
    return user;
  }, []);

  const signup = useCallback(async (data) => {
    const { token, user } = await api.signup(data);
    api.setToken(token);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    api.setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const u = await api.fetchMe();
    setUser(u);
    return u;
  }, []);

  const patchUser = useCallback((partial) => setUser((u) => ({ ...u, ...partial })), []);

  return (
    <AuthCtx.Provider value={{ user, loading, login, signup, logout, refresh, patchUser }}>
      {children}
    </AuthCtx.Provider>
  );
}
