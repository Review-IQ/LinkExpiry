import { create } from 'zustand';
import { api } from '@/services/api';
import type { User, LoginRequest, RegisterRequest } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
  clearError: () => void;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.login(data);
      const user: User = {
        userId: response.userId,
        email: response.email,
        planType: response.planType as any,
        plan: response.planType as any,
        linkCount: 0,
        planLimit: 10, // Default for FREE plan
        createdAt: new Date().toISOString(),
      };
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.register(data);
      const user: User = {
        userId: response.userId,
        email: response.email,
        planType: response.planType as any,
        plan: response.planType as any,
        linkCount: 0,
        planLimit: 10, // Default for FREE plan
        createdAt: new Date().toISOString(),
      };
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.logout();
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: () => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');

    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        set({ user, isAuthenticated: true });
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
    }
  },

  updateUser: (userData: Partial<User>) => {
    set((state) => {
      if (!state.user) return state;

      const updatedUser = { ...state.user, ...userData };

      // Update localStorage as well
      localStorage.setItem('user', JSON.stringify({
        userId: updatedUser.userId,
        email: updatedUser.email,
        planType: updatedUser.planType,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
      }));

      return { user: updatedUser };
    });
  },

  clearError: () => set({ error: null }),
}));
