/**
 * storageService — typed AsyncStorage wrapper (mocked storage).
 */
jest.mock('@react-native-async-storage/async-storage', () => {
  const make = () => {
    let store: Record<string, string> = {};
    return {
      getItem: jest.fn(async (k: string) => store[k] ?? null),
      setItem: jest.fn(async (k: string, v: string) => {
        store[k] = v;
      }),
      removeItem: jest.fn(async (k: string) => {
        delete store[k];
      }),
      multiRemove: jest.fn(async (keys: string[]) => {
        keys.forEach((k) => delete store[k]);
      }),
      clear: jest.fn(async () => {
        store = {};
      }),
    };
  };
  const impl = make();
  return { __esModule: true, default: impl };
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, storageService } from '../../src/shared/services/storage/asyncStorageService';

async function reset() {
  (AsyncStorage as unknown as { clear: () => Promise<void> }).clear();
}

describe('storageService', () => {
  beforeEach(async () => {
    await reset();
  });

  test('setString then getString round-trips', async () => {
    await storageService.setString(STORAGE_KEYS.ACCESS_TOKEN, 'tok123');
    await expect(storageService.getString(STORAGE_KEYS.ACCESS_TOKEN)).resolves.toBe('tok123');
  });

  test('getString returns null for missing keys', async () => {
    await expect(storageService.getString(STORAGE_KEYS.REFRESH_TOKEN)).resolves.toBeNull();
  });

  test('setJSON then getJSON round-trips objects', async () => {
    const payload = { a: 1, nested: { b: [1, 2, 3] } };
    await storageService.setJSON(STORAGE_KEYS.LATEST_PREDICTIONS, payload);
    await expect(storageService.getJSON(STORAGE_KEYS.LATEST_PREDICTIONS)).resolves.toEqual(payload);
  });

  test('getJSON returns null for corrupt JSON', async () => {
    await (AsyncStorage as unknown as { setItem: (k: string, v: string) => Promise<void> }).setItem(
      STORAGE_KEYS.USER,
      '{not json',
    );
    await expect(storageService.getJSON(STORAGE_KEYS.USER)).resolves.toBeNull();
  });

  test('remove deletes a key', async () => {
    await storageService.setString(STORAGE_KEYS.ACCESS_TOKEN, 'x');
    await storageService.remove(STORAGE_KEYS.ACCESS_TOKEN);
    await expect(storageService.getString(STORAGE_KEYS.ACCESS_TOKEN)).resolves.toBeNull();
  });

  test('clearAll wipes all app keys', async () => {
    await storageService.setString(STORAGE_KEYS.ACCESS_TOKEN, 'x');
    await storageService.setString(STORAGE_KEYS.LANGUAGE, 'hi');
    await storageService.clearAll();
    await expect(storageService.getString(STORAGE_KEYS.ACCESS_TOKEN)).resolves.toBeNull();
    await expect(storageService.getString(STORAGE_KEYS.LANGUAGE)).resolves.toBeNull();
  });
});
