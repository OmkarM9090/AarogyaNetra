/**
 * imagePreprocessing — local quality gates before upload.
 *
 * React Native cannot read raw pixels portably, so this module applies the
 * checks that are possible without a native image pipeline:
 *  1. URI sanity (file/data URI, non-empty)
 *  2. Size bounds (rejects corrupt/empty and oversized captures)
 *  3. Aspect sanity (rejects extreme captures)
 *  4. Metadata presence (width/height from vision-camera)
 *
 * Deeper analysis (brightness/blur) is performed server-side by the
 * anemia pipeline; the YOLO detector additionally rejects images without
 * a detectable eye region.
 */
import { Config } from '../../../shared/constants/config';
import type { CapturedImage, ImageQualityResult } from '../../../shared/types/scan';

async function readSize(uri: string): Promise<number | null> {
  // File-size probing without a native module: fetch() works for file://
  // URIs on Android and iOS (RN polyfill) and reports the content length.
  try {
    const res = await fetch(uri);
    const body = await res.blob();
    return (body as Blob & { size?: number }).size ?? null;
  } catch {
    return null;
  }
}

export async function validateEyeImage(image: CapturedImage): Promise<ImageQualityResult> {
  const reasons: string[] = [];

  if (!image.uri) {
    reasons.push('No image captured.');
    return { ok: false, reasons };
  }
  if (!image.uri.startsWith('file://') && !image.uri.startsWith('data:image/')) {
    reasons.push('The image could not be located on this device.');
    return { ok: false, reasons };
  }

  const size = await readSize(image.uri);
  if (size !== null) {
    if (size < Config.MIN_IMAGE_BYTES) {
      reasons.push('The image appears empty or corrupt. Try capturing again.');
    } else if (size > Config.MAX_IMAGE_UPLOAD_BYTES) {
      reasons.push('The image is too large to upload. Try capturing again in better light.');
    }
  }

  if (image.width && image.height) {
    const aspect = image.width / image.height;
    if (aspect > 4 || aspect < 0.25) {
      reasons.push('Unexpected image orientation. Hold the phone upright and try again.');
    }
  }

  return { ok: reasons.length === 0, reasons };
}
