import { isAxiosError } from 'axios';
import { create } from 'zustand';

import { api } from '@/lib/api';
import type { Member, User } from '@/types';

const AUTH_USER_STORAGE_KEY = 'auth_user';
const AUTH_TOKEN_STORAGE_KEY = 'auth_token';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  token: string | null;
  status: AuthStatus;
  isInitialized: boolean;
  lastError: string | null;
  initialize: (options?: { force?: boolean }) => Promise<void>;
  login: (user: User, token?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  handleUnauthorized: (reason?: string) => Promise<void>;
}

type StoredUserShape = Partial<User> & {
  id?: string | number;
  memberId?: string | number;
};

let initializationPromise: Promise<void> | null = null;
let reauthenticationPromise: Promise<void> | null = null;

function toUser(member: Member): User {
  return {
    id: String(member.memberId),
    userId: member.id,
    name: member.name,
    ci: member.ci,
    signatureImage: member.signatureImage ?? null,
    verified: true,
  };
}

function normalizeStoredUser(payload: StoredUserShape | null | undefined): User | null {
  if (!payload) {
    return null;
  }

  const idSource = payload.id ?? payload.memberId;
  const userId = payload.userId ?? (typeof payload.id === 'string' ? payload.id : undefined);

  if (idSource == null || userId == null || userId === '') {
    return null;
  }

  return {
    id: String(idSource),
    userId: String(userId),
    name: payload.name ?? '',
    ci: payload.ci,
    signatureImage:
      payload.signatureImage === undefined ? null : payload.signatureImage ?? null,
    verified: payload.verified ?? true,
    role: payload.role,
  };
}

function readStoredUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredUserShape;
    const normalized = normalizeStoredUser(parsed);
    if (!normalized) {
      window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    }
    return normalized;
  } catch (error) {
    console.error('Failed to parse stored auth user:', error);
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

function persistUser(user: User | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

function readStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  return token && token.length > 0 ? token : null;
}

function persistToken(token: string | null): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (!token) {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  status: 'idle',
  isInitialized: false,
  lastError: null,

  async initialize(options) {
    if (typeof window === 'undefined') {
      set({ isInitialized: true, status: 'unauthenticated' });
      return;
    }

    const force = options?.force ?? false;
    if (!force) {
      if (get().isInitialized) {
        return;
      }
      if (initializationPromise) {
        return initializationPromise;
      }
    }

    const run = async () => {
      const storedUser = readStoredUser();
      const storedToken = readStoredToken();

      if (!storedUser) {
        persistToken(null);
        set({
          user: null,
          token: null,
          status: 'unauthenticated',
          isInitialized: true,
          lastError: null,
        });
        return;
      }

      set({
        user: storedUser,
        token: storedToken,
        status: 'loading',
        lastError: null,
      });

      const memberId = Number(storedUser.id);
      if (!Number.isFinite(memberId) || memberId <= 0) {
        persistUser(null);
        persistToken(null);
        set({
          user: null,
          token: null,
          status: 'unauthenticated',
          isInitialized: true,
          lastError: '저장된 사용자 정보가 올바르지 않습니다.',
        });
        return;
      }

      try {
        const response = await api.members.getProfile(memberId);
        if (response.success && response.member) {
          const freshUser = toUser(response.member);
          persistUser(freshUser);
          set({
            user: freshUser,
            token: storedToken,
            status: 'authenticated',
            isInitialized: true,
            lastError: null,
          });
          return;
        }

        persistUser(null);
        persistToken(null);
        set({
          user: null,
          token: null,
          status: 'unauthenticated',
          isInitialized: true,
          lastError: response.message ?? '인증 정보가 유효하지 않습니다.',
        });
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          persistUser(null);
          persistToken(null);
          set({
            user: null,
            token: null,
            status: 'unauthenticated',
            isInitialized: true,
            lastError: null,
          });
          return;
        }

        // 네트워크 등의 오류가 있는 경우 캐시된 사용자 정보로 유지
        set({
          user: storedUser,
          token: storedToken,
          status: 'authenticated',
          isInitialized: true,
          lastError: error instanceof Error ? error.message : '인증 정보를 확인할 수 없습니다.',
        });
      }
    };

    const promise = run().finally(() => {
      initializationPromise = null;
    });

    initializationPromise = promise;
    return promise;
  },

  async login(user, token) {
    persistUser(user);
    persistToken(token ?? null);

    set({
      user,
      token: token ?? null,
      status: 'authenticated',
      isInitialized: true,
      lastError: null,
    });
  },

  async logout() {
    try {
      await api.members.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    }

    persistUser(null);
    persistToken(null);

    set({
      user: null,
      token: null,
      status: 'unauthenticated',
      isInitialized: true,
      lastError: null,
    });
  },

  setUser(user) {
    const currentToken = user ? get().token : null;
    persistUser(user);
    set({
      user,
      token: currentToken,
      status: user ? 'authenticated' : 'unauthenticated',
      lastError: null,
    });
  },

  async handleUnauthorized(reason) {
    if (reauthenticationPromise) {
      await reauthenticationPromise;
      return;
    }

    reauthenticationPromise = (async () => {
      await get().initialize({ force: true });
      const stateAfter = get();
      if (stateAfter.status === 'authenticated') {
        set({ lastError: null });
        return;
      }

      if (stateAfter.status === 'unauthenticated') {
        set({
          lastError: reason ?? stateAfter.lastError,
        });
      }
    })();

    try {
      await reauthenticationPromise;
    } finally {
      reauthenticationPromise = null;
    }
  },
}));

if (typeof window !== 'undefined') {
  void useAuthStore.getState().initialize();
}
