/**
 * Auth API service — thin wrapper over the backend auth endpoints.
 */
import { apiClient } from '../../../shared/services/api/apiClient';
import { API } from '../../../shared/services/api/endpoints';
import type { ApiResponse } from '../../../shared/types/api';
import type { ProfileUpdate, RegisterData, TokenPair, User } from '../../../shared/types/user';

export const authService = {
  async register(data: RegisterData): Promise<TokenPair> {
    const { data: res } = await apiClient.post<ApiResponse<TokenPair>>(API.auth.register, data);
    return res.data;
  },

  async login(email: string, password: string): Promise<TokenPair> {
    const { data: res } = await apiClient.post<ApiResponse<TokenPair>>(API.auth.login, {
      email,
      password,
    });
    return res.data;
  },

  async refresh(refreshToken: string): Promise<TokenPair> {
    const { data: res } = await apiClient.post<ApiResponse<TokenPair>>(API.auth.refresh, {
      refreshToken,
    });
    return res.data;
  },

  async me(): Promise<User> {
    const { data: res } = await apiClient.get<ApiResponse<User>>(API.auth.me);
    return res.data;
  },

  async updateProfile(data: ProfileUpdate): Promise<User> {
    const { data: res } = await apiClient.put<ApiResponse<User>>(API.auth.me, data);
    return res.data;
  },
};
