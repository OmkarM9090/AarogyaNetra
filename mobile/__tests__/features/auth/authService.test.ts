/**
 * authService — request/response contract with the backend (mocked axios).
 */
jest.mock('../../../src/shared/services/api/apiClient', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
  },
  uploadConfig: jest.fn(() => ({})),
}));

import { apiClient } from '../../../src/shared/services/api/apiClient';
import { API } from '../../../src/shared/services/api/endpoints';
import { authService } from '../../../src/features/auth/services/authService';

const post = apiClient.post as jest.Mock;
const get = apiClient.get as jest.Mock;
const put = apiClient.put as jest.Mock;

const TOKENS = { accessToken: 'acc', refreshToken: 'ref' };
const USER = { id: 'u1', email: 'a@b.c', fullName: 'A', medicalHistory: [], disclaimerAcknowledged: false };

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('register posts RegisterData and unwraps the envelope', async () => {
    post.mockResolvedValueOnce({ data: { success: true, data: TOKENS, timestamp: 't' } });
    const data = { email: 'a@b.c', password: 'Secret123', fullName: 'A' };
    await expect(authService.register(data)).resolves.toEqual(TOKENS);
    expect(post).toHaveBeenCalledWith(API.auth.register, data);
  });

  test('login sends {email, password}', async () => {
    post.mockResolvedValueOnce({ data: { success: true, data: TOKENS, timestamp: 't' } });
    await expect(authService.login('a@b.c', 'pw')).resolves.toEqual(TOKENS);
    expect(post).toHaveBeenCalledWith(API.auth.login, { email: 'a@b.c', password: 'pw' });
  });

  test('refresh sends {refreshToken}', async () => {
    post.mockResolvedValueOnce({ data: { success: true, data: TOKENS, timestamp: 't' } });
    await expect(authService.refresh('ref')).resolves.toEqual(TOKENS);
    expect(post).toHaveBeenCalledWith(API.auth.refresh, { refreshToken: 'ref' });
  });

  test('me GETs /auth/me and returns the User', async () => {
    get.mockResolvedValueOnce({ data: { success: true, data: USER, timestamp: 't' } });
    await expect(authService.me()).resolves.toEqual(USER);
    expect(get).toHaveBeenCalledWith(API.auth.me);
  });

  test('updateProfile PUTs /auth/me', async () => {
    put.mockResolvedValueOnce({ data: { success: true, data: { ...USER, phone: '1' }, timestamp: 't' } });
    await expect(authService.updateProfile({ phone: '1' })).resolves.toMatchObject({ phone: '1' });
    expect(put).toHaveBeenCalledWith(API.auth.me, { phone: '1' });
  });
});
