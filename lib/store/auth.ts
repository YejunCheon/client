import { create } from 'zustand';
import { api } from '@/lib/api';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  token: null, // HttpOnly 쿠키로 관리되므로 클라이언트에서는 null로 유지
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }), // 사용하지 않지만 하위 호환성을 위해 유지
  login: (user, token) => {
    // JWT는 HttpOnly 쿠키로 서버에서 관리되므로 클라이언트에서는 유저 정보만 저장
    set({ user, token: null, isAuthenticated: true });
    // 유저 정보만 localStorage에 저장 (선택사항)
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
  },
  logout: async () => {
    // 서버에 로그아웃 요청 (HttpOnly 쿠키 삭제)
    try {
      await api.members.logout();
    } catch (e) {
      console.error('Logout API call failed:', e);
    }
    // 클라이언트 상태 초기화
    set({ user: null, token: null, isAuthenticated: false });
    // localStorage에서 제거
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_user');
    }
  },
}));

// localStorage에서 초기 상태 복원 (유저 정보만)
if (typeof window !== 'undefined') {
  const userStr = localStorage.getItem('auth_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      // 토큰은 HttpOnly 쿠키로 관리되므로 null로 설정
      useAuthStore.setState({ user, token: null, isAuthenticated: true });
    } catch (e) {
      console.error('Failed to restore auth state:', e);
    }
  }
}
