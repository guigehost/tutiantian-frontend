import { create } from 'zustand';
import axios from 'axios';
import { authApi } from '../api/client';

interface User {
  id: number;
  email: string;
  name: string;
  tuPoints: number;
  emailVerified: boolean;
}

interface AuthState {
  user: User | null;
  tuPoints: number;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  refreshPoints: () => Promise<void>;
  consumePoints: (amount: number, description: string) => Promise<{ success: boolean; newBalance: number }>;
}

// 跳转到 guige.host 登录页
function redirectToLogin() {
  const currentUrl = window.location.href;
  window.location.href = `/login?redirect=${encodeURIComponent(currentUrl)}`;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  tuPoints: 0,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    // 这个函数不再使用，登录通过 guige.host 进行
    // 这里保留只是为了兼容
    try {
      const response = await axios.post('/api/v1/auth/login', { email, password });
      await get().fetchUser();
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || '登录失败');
    }
  },

  logout: () => {
    set({ user: null, tuPoints: 0, isAuthenticated: false });
    // 清除 guige.host 的 session cookie
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/';
  },

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const user = await authApi.me();
      const balance = await authApi.getBalance();
      set({
        user,
        tuPoints: balance.tuPoints,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      // 未登录或 session 过期
      if (error.message?.includes('Authentication required') || error.message?.includes('UNAUTHORIZED')) {
        set({ user: null, tuPoints: 0, isAuthenticated: false, isLoading: false });
        redirectToLogin();
      } else {
        set({ isLoading: false });
        console.error('获取用户信息失败:', error);
      }
    }
  },

  refreshPoints: async () => {
    try {
      const balance = await authApi.getBalance();
      set({ tuPoints: balance.tuPoints });
    } catch (error) {
      console.error('获取余额失败:', error);
    }
  },

  consumePoints: async (amount: number, description: string) => {
    try {
      const result = await authApi.consumePoints(amount, 'tutiantian', description);
      set({ tuPoints: result.newBalance });
      return result;
    } catch (error: any) {
      if (error.message?.includes('兔点不足')) {
        throw new Error('兔点不足，请先充值');
      }
      throw error;
    }
  },
}));

// 初始化时获取用户信息
if (typeof window !== 'undefined') {
  const store = useAuthStore.getState();
  store.fetchUser();
}
