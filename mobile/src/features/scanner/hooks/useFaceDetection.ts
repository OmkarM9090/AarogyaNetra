/**
 * useFaceDetection — lightweight "is the eye in frame" guidance.
 *
 * There is no on-device eye-detection model in the mobile app: the backend
 * YOLO detector performs the real detection on the uploaded photo. This
 * hook provides capture-readiness state (steady-camera timer + guidance
 * copy) so the UI can ask the user to hold still before capture, which is
 * what most eye-detection UX is for in practice.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseFaceDetectionResult {
  /** Seconds remaining in the steady-hold guidance. */
  countdown: number;
  /** True when the user has held still long enough to capture. */
  ready: boolean;
  startSteadyHold: (seconds?: number) => void;
  cancelSteadyHold: () => void;
}

export function useFaceDetection(): UseFaceDetectionResult {
  const [countdown, setCountdown] = useState(0);
  const [ready, setReady] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startSteadyHold = useCallback(
    (seconds = 3) => {
      clearTimer();
      setCountdown(seconds);
      setReady(false);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearTimer();
            setReady(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer],
  );

  const cancelSteadyHold = useCallback(() => {
    clearTimer();
    setCountdown(0);
    setReady(false);
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  return { countdown, ready, startSteadyHold, cancelSteadyHold };
}
