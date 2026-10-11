/**
 * Auth store (Zustand) — session state + token lifecycle.
 *
 *  - login/register → tokens persisted to AsyncStorage
 *  - checkAuth on app start → validates stored tokens via GET /auth/me
 *  - 401 handling → the apiClient interceptor calls refresh once; if the
 *    refresh fails the session is expired and we reset to logged-out state.
 */
import { create } from 'zustand';

import { apiClient, bindAuthCallbacks } from '../../../shared/services/api/apiClient';
import {
  storageService,
  STORAGE_KEYS,
} from '../../../shared/services/storage/asyncStorageService';
import { useAppStore } from '../../../shared/store/useAppStore';
import { useHealthStore } from '../../../shared/store/useHealthStore';
import type {
  ProfileUpdate,
  RegisterData,
  TokenPair,
  User,
} from '../../../shared/types/user';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** True while a login/register/checkAuth call is in flight. */
  isLoading: boolean;
  /** True while the very first auth check (app start) is running. */
  isBootstrapping: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
}

let callbacksBound = false;

async function persistTokens(tokens: TokenPair): Promise<void> {
  await Promise.all([
    storageService.setString(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
    storageService.setString(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
  ]);
}

async function clearTokens(): Promise<void> {
  await Promise.all([
    storageService.remove(STORAGE_KEYS.ACCESS_TOKEN),
    storageService.remove(STORAGE_KEYS.REFRESH_TOKEN),
  ]);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isBootstrapping: true,

  login: async (email, password) => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      const tokens = await authService.login(email, password);
      await persistTokens(tokens);
      const user = await authService.me();
      await cacheUser(user);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  register: async (data) => {
    if (get().isLoading) return;
    set({ isLoading: true });
    try {
      // Register → auto-login: the backend returns a token pair.
      const tokens = await authService.register(data);
      await persistTokens(tokens);
      const user = await authService.me();
      await cacheUser(user);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  logout: async () => {
    await clearTokens();
    useHealthStore.getState().clearAll();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const accessToken = await storageService.getString(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await storageService.getString(STORAGE_KEYS.REFRESH_TOKEN);
      if (!accessToken || !refreshToken) {
        set({ isBootstrapping: false });
        return;
      }
      const user = await authService.me();
      await cacheUser(user);
      set({ user, isAuthenticated: true, isBootstrapping: false });
    } catch (e) {
      // Token invalid/expired and refresh failed (interceptor already tried).
      await clearTokens();
      set({ user: null, isAuthenticated: false, isBootstrapping: false });
    }
  },

  updateProfile: async (data) => {
    const user = await authService.updateProfile(data);
    await cacheUser(user);
    set({ user });
  },
}));

async function cacheUser(user: User): Promise<void> {
  await storageService.setJSON(STORAGE_KEYS.USER, user);
  // Keep the local disclaimer flag in sync with the server profile.
  const appState = useAppStore.getState();
  if (user.disclaimerAcknowledged && !appState.disclaimerAcknowledged) {
    appState.acknowledgeDisclaimer();
  }
}

/**
 * Bind the 401→refresh→retry callbacks once. Called from App on mount.
 */
export function bindAuthSessionHandlers(): void {
  if (callbacksBound) return;
  callbacksBound = true;
  bindAuthCallbacks({
    onRefreshed: (tokens) => {
      void persistTokens(tokens);
    },
    onSessionExpired: () => {
      void (async () => {
        await clearTokens();
        const state = useAuthStore.getState();
        useAuthStore.setState({ user: null, isAuthenticated: false });
        void state;
      })();
    },
  });
  void apiClient; // keep import explicit for clarity
}
