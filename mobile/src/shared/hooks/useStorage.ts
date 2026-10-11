/**
 * React hook over asyncStorageService — typed get/set with reactive state.
 */
import { useCallback, useState } from 'react';
import { storageService } from '../services/storage/asyncStorageService';

export function useStorage<T>(key: string) {
  const [value, setValue] = useState<T | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const v = await storageService.getJSON<T>(key);
    setValue(v);
    setLoaded(true);
    return v;
  }, [key]);

  const save = useCallback(
    async (next: T) => {
      setValue(next);
      await storageService.setJSON(key, next);
    },
    [key],
  );

  const clear = useCallback(async () => {
    setValue(null);
    await storageService.remove(key);
  }, [key]);

  return { value, loaded, load, save, clear, setValue };
}
