/**
 * useScanFlow — phase machine for the scanner flow.
 *
 *   select → form → (camera) → processing → result | error
 *
 * For diabetes/hypertension the camera phase is skipped.
 */
import { useCallback, useState } from 'react';
import type { ScanCondition } from '../types';

export type ScanPhase =
  | { name: 'select' }
  | { name: 'form'; condition: ScanCondition }
  | { name: 'camera'; condition: 'anemia' }
  | { name: 'processing'; condition: ScanCondition }
  | { name: 'result'; scanId: string }
  | { name: 'error'; message: string; condition: ScanCondition };

export function useScanFlow() {
  const [phase, setPhase] = useState<ScanPhase>({ name: 'select' });

  const selectCondition = useCallback((condition: ScanCondition) => {
    if (condition === 'anemia') {
      // Anemia: demographics + symptoms form first, then camera.
      setPhase({ name: 'form', condition });
    } else {
      setPhase({ name: 'form', condition });
    }
  }, []);

  const startCamera = useCallback(() => {
    setPhase({ name: 'camera', condition: 'anemia' });
  }, []);

  const startProcessing = useCallback((condition: ScanCondition) => {
    setPhase({ name: 'processing', condition });
  }, []);

  const complete = useCallback((scanId: string) => {
    setPhase({ name: 'result', scanId });
  }, []);

  const fail = useCallback((message: string, condition: ScanCondition) => {
    setPhase({ name: 'error', message, condition });
  }, []);

  const retry = useCallback(() => {
    setPhase({ name: 'select' });
  }, []);

  return { phase, selectCondition, startCamera, startProcessing, complete, fail, retry };
}
