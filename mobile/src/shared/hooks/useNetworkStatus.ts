/**
 * Network status hook — drives the offline banner and pre-flight checks.
 */
import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected === true);
    });
    return () => unsubscribe();
  }, []);

  const ensureOnline = useCallback(async (): Promise<boolean> => {
    if (isOnline) return true;
    const state = await NetInfo.fetch();
    const online = state.isConnected === true;
    setIsOnline(online);
    return online;
  }, [isOnline]);

  return { isOnline, ensureOnline };
}
