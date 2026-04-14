import { create } from 'zustand';
import { User } from '../types/auth.types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setAuth: (user, token) => {
    (window as any).__accessToken = token;
    set({ user, isAuthenticated: true });
  },
  clearAuth: () => {
    (window as any).__accessToken = null;
    set({ user: null, isAuthenticated: false });
  },
}));
