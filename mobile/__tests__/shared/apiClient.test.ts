/**
 * toNormalizedError maps every HTTP/network failure to the UI kinds.
 */
import { toNormalizedError } from '../../src/shared/services/api/apiClient';

function axiosLike(response: unknown, extra: Record<string, unknown> = {}) {
  return { response, isAxiosError: true, ...extra };
}

describe('toNormalizedError', () => {
  test('401 → unauthorized', () => {
    const err = toNormalizedError(
      axiosLike({ status: 401, data: { error: { code: 'unauthorized', message: 'Expired' } } }),
    );
    expect(err.kind).toBe('unauthorized');
    expect(err.status).toBe(401);
    expect(err.message).toBe('Expired');
  });

  test('404 → not_found', () => {
    const err = toNormalizedError(
      axiosLike({ status: 404, data: { error: { code: 'not_found', message: 'Nope' } } }),
    );
    expect(err.kind).toBe('not_found');
  });

  test('422 with fieldErrors → validation with field map', () => {
    const err = toNormalizedError(
      axiosLike({
        status: 422,
        data: { error: { code: 'validation_error', message: 'Validation failed.', details: { age: 'too small' } } },
      }),
    );
    expect(err.kind).toBe('validation');
    expect(err.fieldErrors).toEqual({ age: 'too small' });
  });

  test('503 model_unavailable code → model_unavailable kind', () => {
    const err = toNormalizedError(
      axiosLike({
        status: 503,
        data: { error: { code: 'model_unavailable', message: 'Model down' } },
      }),
    );
    expect(err.kind).toBe('server'); // 503 maps to server by status; code preserved
    expect(err.code).toBe('model_unavailable');
  });

  test('timeout error → timeout kind', () => {
    const err = toNormalizedError({ code: 'ECONNABORTED', message: 'timeout of 30000ms exceeded' });
    expect(err.kind).toBe('timeout');
  });

  test('Network Error → network kind', () => {
    const err = toNormalizedError({ message: 'Network Error' });
    expect(err.kind).toBe('network');
  });

  test('unknown error → unknown kind with generic message', () => {
    const err = toNormalizedError('wat');
    expect(err.kind).toBe('unknown');
    expect(err.message).toContain('Something went wrong');
  });
});
