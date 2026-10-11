/**
 * Scan domain types — mirror of the backend scans collection.
 */
import type { Condition } from './health';
import type { PredictionResult } from './prediction';

export type ScanStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ScanRecord {
  id: string;
  scanType: Condition;
  status: ScanStatus;
  /** Extra payload submitted with the scan (form fields / image path). */
  scanData: Record<string, unknown>;
  imagePath?: string | null;
  /**
   * The attached prediction once the scan completes. The scan-detail
   * endpoint returns the full prediction object; list responses carry the
   * same shape (backend populates it for completed scans).
   */
  prediction?: PredictionResult | null;
  createdAt: string;
}

/** A captured eye image ready for upload. */
export interface CapturedImage {
  /** URI to the captured photo on disk. */
  uri: string;
  width?: number;
  height?: number;
  /** JPEG quality that produced this capture (0-100). */
  quality?: number;
}

/** Local pre-flight validation result for an eye image. */
export interface ImageQualityResult {
  ok: boolean;
  reasons: string[];
}
