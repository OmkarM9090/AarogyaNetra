/**
 * Navigation param lists for the whole app.
 */
import type {
  AnemiaInput,
  DiabetesInput,
  HypertensionInput,
} from '../../shared/types/prediction';
import type { CapturedImage } from '../../shared/types/scan';

/** Auth (pre-login) stack. */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

/** Root tabs. */
export type MainTabParamList = {
  HomeTab: undefined;
  ScannerTab: undefined;
  HistoryTab: undefined;
  ProfileTab: undefined;
};

/** Home (dashboard) stack. */
export type HomeStackParamList = {
  Dashboard: undefined;
  Result: { scanId: string };
  ConditionResult: { condition: 'diabetes' | 'hypertension' | 'anemia'; predictionId?: string; scanId?: string };
  RiskEvolution: undefined;
  LifestyleSim: undefined;
  Settings: undefined;
};

/** Scanner stack: preparation → camera → processing → result. */
export type ScannerStackParamList = {
  Preparation: { preselected?: 'diabetes' | 'hypertension' | 'anemia' } | undefined;
  Camera: { payload: { kind: 'anemia'; data: AnemiaInput } };
  Processing: {
    condition: 'diabetes' | 'hypertension' | 'anemia';
    payload:
      | { kind: 'diabetes'; data: DiabetesInput }
      | { kind: 'hypertension'; data: HypertensionInput }
      | { kind: 'anemia'; data: AnemiaInput; image: CapturedImage };
  };
  Result: { scanId: string };
  ConditionResult: { condition: 'diabetes' | 'hypertension' | 'anemia'; predictionId?: string; scanId?: string };
};

/** History stack. */
export type HistoryStackParamList = {
  ScanHistory: undefined;
  ScanDetail: { scanId: string };
  ConditionResult: { condition: 'diabetes' | 'hypertension' | 'anemia'; predictionId?: string; scanId?: string };
};

/** Profile stack. */
export type ProfileStackParamList = {
  Profile: undefined;
  Settings: undefined;
};

/** Union of every route in the app — for `useNavigation<NavigationProp<AppParamList>>()`. */
export type AppParamList = AuthStackParamList &
  MainTabParamList &
  HomeStackParamList &
  ScannerStackParamList &
  HistoryStackParamList &
  ProfileStackParamList;
