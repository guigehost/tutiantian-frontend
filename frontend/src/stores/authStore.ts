import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import client from '../api/client';

interface User {
  id: number;
  email: string;
  nickname: string;
  balance: number;
  total_usage: number;
  role: string;
  email_verified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const response = await client.post('/auth/login', { email, password });
        const { access_token } = response.data;
        const userResponse = await client.get('/users/me', {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        set({
          token: access_token,
          user: userResponse.data,
          isAuthenticated: true
        });
      },

      register: async (email: string, password: string, nickname: string) => {
        const response = await client.post('/auth/register', { email, password, nickname });
        return response.data;
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      fetchUser: async () => {
        const token = get().token;
        if (!token) {
          return; // 没有token，不需要获取用户
        }
        try {
          const response = await client.get('/users/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          set({
            user: response.data,
            isAuthenticated: true
          });
        } catch (error: any) {
          // Token无效或过期，清除
          if (error.response?.status === 401) {
            get().logout();
          }
          // 其他错误不清除token，让用户保持登录状态
        }
      },

      resendVerification: async (email: string) => {
        await client.post('/auth/resend-verification', null, { params: { email } });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
