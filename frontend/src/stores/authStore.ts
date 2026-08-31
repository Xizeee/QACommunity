import { create } from 'zustand';
import {
  fetchCurrentUserApi,
  loginApi,
  logoutApi,
  registerApi,
  RegisterPayload,
} from '../services/api/authApi';
import { ApiClientError, getToken, setToken } from '../services/http';
import type { User } from '../types';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'guest';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',

  async login(email, password) {
    const result = await loginApi({ email, password });
    setToken(result.token);
    set({ user: result.user, status: 'authenticated' });
  },

  async register(payload) {
    await registerApi(payload);
  },

  async logout() {
    try {
      await logoutApi();
    } finally {
      setToken(null);
      set({ user: null, status: 'guest' });
    }
  },

  async initialize() {
    if (!getToken()) {
      set({ user: null, status: 'guest' });
      return;
    }
    set({ status: 'loading' });
    try {
      const user = await fetchCurrentUserApi();
      set({ user, status: 'authenticated' });
    } catch (error) {
      // 仅在 Token 确认失效时清除，网络异常保留 Token 供下次重试
      if (error instanceof ApiClientError && error.status === 401) {
        setToken(null);
      }
      set({ user: null, status: 'guest' });
    }
  },
}));
