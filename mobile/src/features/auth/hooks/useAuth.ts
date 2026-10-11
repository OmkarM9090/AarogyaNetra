/**
 * Convenience hook over the auth store.
 */
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  return useAuthStore();
}
