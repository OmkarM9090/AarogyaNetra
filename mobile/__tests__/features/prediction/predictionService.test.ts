/**
 * predictionService — snake_case payload mapping + envelope unwrapping.
 */
jest.mock('../../../src/shared/services/api/apiClient', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
  uploadConfig: jest.fn(() => ({ timeout: 60000 })),
}));

import { apiClient } from '../../../src/shared/services/api/apiClient';
import { API } from '../../../src/shared/services/api/endpoints';
import { predictionService } from '../../../src/features/prediction/services/predictionService';

const post = apiClient.post as jest.Mock;
const get = apiClient.get as jest.Mock;

const PREDICTION = {
  id: 'p1',
  userId: 'u1',
  scanId: 's1',
  condition: 'diabetes',
  riskScore: 42.5,
  riskLevel: 'moderate',
  confidence: 0.77,
  modelVersion: 'artifact-123',
  inputFeatures: {},
  outputRaw: { classProbabilities: { '0': 0.23, '1': 0.77 }, predictedClass: 1 },
  recommendations: [],
  keyMetrics: {},
  disclaimer: 'd',
  createdAt: '2026-10-01T00:00:00Z',
};

describe('predictionService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('submitDiabetesScan maps camelCase → snake_case', async () => {
    post.mockResolvedValueOnce({ data: { success: true, data: PREDICTION, timestamp: 't' } });
    const input = {
      age: 52,
      gender: 'male' as const,
      bmi: 28.4,
      bloodGlucoseFasting: 142,
      hba1c: 7.1,
      bloodPressureSystolic: 138,
      bloodPressureDiastolic: 86,
      familyHistoryDiabetes: true,
      physicalActivityMinutesWeekly: 90,
      smokingStatus: 'former' as const,
      waistCircumferenceCm: 98,
    };
    await predictionService.submitDiabetesScan(input);
    const [url, body] = post.mock.calls[0];
    expect(url).toBe(API.scans.diabetes);
    expect(body).toEqual({
      age: 52,
      gender: 'male',
      bmi: 28.4,
      blood_glucose_fasting: 142,
      hba1c: 7.1,
      blood_pressure_systolic: 138,
      blood_pressure_diastolic: 86,
      family_history_diabetes: true,
      physical_activity_minutes_weekly: 90,
      smoking_status: 'former',
      waist_circumference_cm: 98,
    });
  });

  test('submitHypertensionScan omits undefined cholesterol', async () => {
    post.mockResolvedValueOnce({ data: { success: true, data: PREDICTION, timestamp: 't' } });
    const input = {
      age: 58,
      gender: 'female' as const,
      bmi: 30.1,
      bloodPressureSystolic: 158,
      bloodPressureDiastolic: 96,
      heartRate: 78,
      smokingStatus: 'never' as const,
      alcoholConsumption: 'moderate' as const,
      saltIntake: 'high' as const,
      stressLevel: 'moderate' as const,
      familyHistoryHypertension: true,
      physicalActivityMinutesWeekly: 60,
    };
    await predictionService.submitHypertensionScan(input);
    const [, body] = post.mock.calls[0];
    expect(body).not.toHaveProperty('cholesterol_total');
    expect(body.heart_rate).toBe(78);
  });

  test('submitAnemiaScan builds multipart form', async () => {
    post.mockResolvedValueOnce({ data: { success: true, data: PREDICTION, timestamp: 't' } });
    await predictionService.submitAnemiaScan(
      { uri: 'file:///eye.jpg' },
      { age: 34, gender: 'female', symptoms: ['fatigue', 'pallor'] },
    );
    const [url, form, options] = post.mock.calls[0];
    expect(url).toBe(API.scans.anemia);
    expect(options.headers['Content-Type']).toBe('multipart/form-data');
    expect(form).toBeInstanceOf(FormData);
    expect(form.get('age')).toBe('34');
    expect(form.get('gender')).toBe('female');
    expect(JSON.parse(form.get('symptoms') as string)).toEqual(['fatigue', 'pallor']);
  });

  test('getScanHistory passes pagination params', async () => {
    const page = { items: [], total: 0, page: 2, pageSize: 20, totalPages: 0 };
    get.mockResolvedValueOnce({ data: { success: true, data: page, timestamp: 't' } });
    await predictionService.getScanHistory(2, 20);
    expect(get).toHaveBeenCalledWith(API.scans.list, { params: { page: 2, pageSize: 20 } });
  });

  test('getRiskSummary unwraps envelope', async () => {
    const summary = {
      overallRiskScore: 55,
      riskByCondition: {},
      totalScans: 3,
      disclaimer: 'd',
    };
    get.mockResolvedValueOnce({ data: { success: true, data: summary, timestamp: 't' } });
    await expect(predictionService.getRiskSummary()).resolves.toEqual(summary);
  });
});
