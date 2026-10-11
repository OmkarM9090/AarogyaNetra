/**
 * Eye-photo capture for the anemia screening flow.
 *
 * Uses VisionCamera v4's takePhoto() which writes a full-resolution JPEG to a
 * temp file. We retry a few times on capture errors; the resulting file URI is
 * what the backend upload consumes.
 */
import type { RefObject } from 'react';
import type { Camera } from 'react-native-vision-camera';

import type { CapturedImage } from '../../../shared/types/scan';

export interface CaptureResult {
  /** file:// URI pointing to the captured JPEG on disk. */
  uri: string;
  width: number;
  height: number;
}

/**
 * Capture a photo from the given (already-mounted, active) camera, retrying up
 * to `attempts` times on transient failures.
 */
export async function capturePhotoWithRetry(camera: Camera, attempts = 3): Promise<CaptureResult> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const photo = await camera.takePhoto();
      return {
        uri: `file://${photo.path}`,
        width: photo.width,
        height: photo.height,
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Photo capture failed');
}

/**
 * Convenience wrapper for screens that hold a camera ref: resolves the ref and
 * captures, returning a CapturedImage ready for upload/validation.
 */
export async function captureEyePhoto(cameraRef: RefObject<Camera | null>, attempts = 3): Promise<CapturedImage> {
  const camera = cameraRef.current;
  if (!camera) throw new Error('Camera is not ready. Please try again.');
  const result = await capturePhotoWithRetry(camera, attempts);
  return { uri: result.uri, width: result.width, height: result.height };
}
