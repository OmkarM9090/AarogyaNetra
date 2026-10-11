/**
 * Prediction API service — all scan submission + prediction reads.
 *
 * Note on naming: scan submission endpoints return the attached prediction
 * (see backend POST /scans/{condition}), so submit* methods resolve to a
 * PredictionResult.
 */
import { apiClient, uploadConfig } from '../../../shared/services/api/apiClient';
import { API } from '../../../shared/services/api/endpoints';
import type { ApiResponse, PaginatedResult } from '../../../shared/types/api';
import type { RiskSummary } from '../../../shared/types/health';
import type {
  AnemiaInput,
  AnemiaSymptom,
  DiabetesInput,
  HypertensionInput,
  PredictionResult,
} from '../../../shared/types/prediction';
import type { ScanRecord } from '../../../shared/types/scan';

/** Map a client form object to the backend's snake_case schema. */
function diabetesPayload(d: DiabetesInput) {
  return {
    age: d.age,
    gender: d.gender,
    bmi: d.bmi,
    blood_glucose_fasting: d.bloodGlucoseFasting,
    hba1c: d.hba1c,
    blood_pressure_systolic: d.bloodPressureSystolic,
    blood_pressure_diastolic: d.bloodPressureDiastolic,
    family_history_diabetes: d.familyHistoryDiabetes,
    physical_activity_minutes_weekly: d.physicalActivityMinutesWeekly,
    smoking_status: d.smokingStatus,
    ...(d.waistCircumferenceCm !== undefined ? { waist_circumference_cm: d.waistCircumferenceCm } : {}),
  };
}

function hypertensionPayload(h: HypertensionInput) {
  return {
    age: h.age,
    gender: h.gender,
    bmi: h.bmi,
    blood_pressure_systolic: h.bloodPressureSystolic,
    blood_pressure_diastolic: h.bloodPressureDiastolic,
    heart_rate: h.heartRate,
    smoking_status: h.smokingStatus,
    alcohol_consumption: h.alcoholConsumption,
    salt_intake: h.saltIntake,
    stress_level: h.stressLevel,
    family_history_hypertension: h.familyHistoryHypertension,
    physical_activity_minutes_weekly: h.physicalActivityMinutesWeekly,
    ...(h.cholesterolTotal !== undefined ? { cholesterol_total: h.cholesterolTotal } : {}),
  };
}

export const predictionService = {
  submitDiabetesScan: async (data: DiabetesInput): Promise<PredictionResult> => {
    const { data: res } = await apiClient.post<ApiResponse<PredictionResult>>(
      API.scans.diabetes,
      diabetesPayload(data),
    );
    return res.data;
  },

  submitHypertensionScan: async (data: HypertensionInput): Promise<PredictionResult> => {
    const { data: res } = await apiClient.post<ApiResponse<PredictionResult>>(
      API.scans.hypertension,
      hypertensionPayload(data),
    );
    return res.data;
  },

  /**
   * Anemia: multipart/form-data upload of the captured eye image.
   * image.uri must be a file:// URI; FormData with { uri, name, type }
   * is the standard React Native pattern.
   */
  submitAnemiaScan: async (
    image: { uri: string },
    data: AnemiaInput,
  ): Promise<PredictionResult> => {
    const form = new FormData();
    form.append('eye_image', {
      uri: image.uri,
      name: 'eye.jpg',
      type: 'image/jpeg',
    } as never);
    form.append('age', String(data.age));
    form.append('gender', data.gender);
    form.append('symptoms', JSON.stringify(data.symptoms as AnemiaSymptom[]));

    const { data: res } = await apiClient.post<ApiResponse<PredictionResult>>(
      API.scans.anemia,
      form,
      {
        ...uploadConfig(),
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return res.data;
  },

  getPredictionHistory: async (page: number, pageSize = 20): Promise<PaginatedResult<PredictionResult>> => {
    const { data: res } = await apiClient.get<ApiResponse<PaginatedResult<PredictionResult>>>(
      API.predictions.list,
      { params: { page, pageSize } },
    );
    return res.data;
  },

  getPredictionDetail: async (id: string): Promise<PredictionResult> => {
    const { data: res } = await apiClient.get<ApiResponse<PredictionResult>>(API.predictions.detail(id));
    return res.data;
  },

  getRiskSummary: async (): Promise<RiskSummary> => {
    const { data: res } = await apiClient.get<ApiResponse<RiskSummary>>(API.predictions.summary);
    return res.data;
  },

  getScanHistory: async (page: number, pageSize = 20): Promise<PaginatedResult<ScanRecord>> => {
    const { data: res } = await apiClient.get<ApiResponse<PaginatedResult<ScanRecord>>>(
      API.scans.list,
      { params: { page, pageSize } },
    );
    return res.data;
  },

  getScanDetail: async (id: string): Promise<ScanRecord> => {
    const { data: res } = await apiClient.get<ApiResponse<ScanRecord>>(API.scans.detail(id));
    return res.data;
  },
};
