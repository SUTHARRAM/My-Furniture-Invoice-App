import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const { access_token, user: u } = res.data.data;
    setAuth(u, access_token);
    navigate('/dashboard');
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    navigate('/login');
  };

  return { user, isAuthenticated, login, logout };
}
