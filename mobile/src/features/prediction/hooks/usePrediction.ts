/**
 * usePrediction — submission state machine for the scan flow.
 *
 * idle → submitting → success(result) | failure(error)
 * The scanner screens drive this; on success they navigate to the
 * result screen with the prediction id.
 */
import { useCallback, useRef, useState } from 'react';
import { toNormalizedError } from '../../../shared/services/api/apiClient';
import type { NormalizedApiError } from '../../../shared/types/api';
import type { PredictionResult } from '../../../shared/types/prediction';

export type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'failure';

export function usePrediction() {
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<NormalizedApiError | null>(null);
  const seqRef = useRef(0);

  const run = useCallback(async (submit: () => Promise<PredictionResult>) => {
    const seq = ++seqRef.current;
    setStatus('submitting');
    setResult(null);
    setError(null);
    try {
      const prediction = await submit();
      if (seq === seqRef.current) {
        setResult(prediction);
        setStatus('success');
      }
      return prediction;
    } catch (e) {
      const normalized = toNormalizedError(e);
      if (seq === seqRef.current) {
        setError(normalized);
        setStatus('failure');
      }
      throw normalized;
    }
  }, []);

  const reset = useCallback(() => {
    seqRef.current += 1;
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, run, reset, isSubmitting: status === 'submitting' };
}
