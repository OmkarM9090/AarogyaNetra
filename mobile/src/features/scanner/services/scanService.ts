/**
 * scanService — orchestrates the three scan submission paths.
 * Kept separate from the prediction service so the scanner feature owns
 * its own flow (validation → preprocessing → submit).
 */
import { predictionService } from '../../prediction/services/predictionService';
import type {
  AnemiaInput,
  DiabetesInput,
  HypertensionInput,
  PredictionResult,
} from '../../../shared/types/prediction';
import type { CapturedImage } from '../../../shared/types/scan';
import { validateEyeImage } from './imagePreprocessing';

export const scanService = {
  submitDiabetes(data: DiabetesInput): Promise<PredictionResult> {
    return predictionService.submitDiabetesScan(data);
  },

  submitHypertension(data: HypertensionInput): Promise<PredictionResult> {
    return predictionService.submitHypertensionScan(data);
  },

  async submitAnemia(image: CapturedImage, data: AnemiaInput): Promise<PredictionResult> {
    const quality = await validateEyeImage(image);
    if (!quality.ok) {
      throw new Error(quality.reasons[0] ?? 'Image validation failed');
    }
    return predictionService.submitAnemiaScan(image, data);
  },
};
