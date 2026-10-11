/**
 * ScanProcessingScreen — full-screen progress while the backend runs the
 * ML pipeline, then navigates to the result screen.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Camera } from 'react-native-vision-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { Button } from '../../../shared/components/ui/Button';
import { ScreenWrapper } from '../../../shared/components/layout/ScreenWrapper';
import { useNetworkStatus } from '../../../shared/hooks/useNetworkStatus';
import { toNormalizedError } from '../../../shared/services/api/apiClient';
import { Colors, Spacing } from '../../../shared/theme';
import type { Condition } from '../../../shared/types/health';
import type {
  AnemiaInput,
  DiabetesInput,
  HypertensionInput,
} from '../../../shared/types/prediction';
import type { CapturedImage } from '../../../shared/types/scan';
import type { AppParamList } from '../../../app/navigation/types';
import { useCamera } from '../hooks/useCamera';
import { captureEyePhoto } from '../services/imageCapture';
import { scanService } from '../services/scanService';
import { ScanProgress } from '../components/ScanProgress';

type ScanPayload =
  | { kind: 'diabetes'; data: DiabetesInput }
  | { kind: 'hypertension'; data: HypertensionInput }
  | { kind: 'anemia'; data: AnemiaInput };

const STEP_SETS: Record<Condition, string[]> = {
  diabetes: [
    'Validating your screening data',
    'Running the diabetes risk model',
    'Generating personalized recommendations',
  ],
  hypertension: [
    'Validating your screening data',
    'Running the hypertension risk model',
    'Generating personalized recommendations',
  ],
  anemia: [
    'Uploading your eye image',
    'Detecting the eye region (YOLO)',
    'Running the anemia classifier',
    'Generating personalized recommendations',
  ],
};

export const ScanProcessingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<AppParamList>>();
  const route = useRoute();
  const { isOnline } = useNetworkStatus();
  const { cameraRef, device, hasPermission } = useCamera();

  const params = (route.params ?? {}) as {
    condition: Condition;
    payload: ScanPayload;
    eyeImage?: CapturedImage;
  };
  const { condition, payload, eyeImage } = params;

  const [failed, setFailed] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const startedRef = useRef(false);

  const finish = useCallback(
    (scanId: string) => {
      navigation.navigate('Result', { scanId });
    },
    [navigation],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const run = async () => {
      try {
        let scanId: string;
        if (payload.kind === 'diabetes') {
          const result = await scanService.submitDiabetes(payload.data);
          scanId = result.scanId;
        } else if (payload.kind === 'hypertension') {
          const result = await scanService.submitHypertension(payload.data);
          scanId = result.scanId;
        } else {
          // Anemia: ensure we have the eye photo, then upload.
          let image = eyeImage;
          if (!image?.uri) {
            setCapturing(true);
            try {
              if (!hasPermission || !device) {
                throw new Error('Camera is unavailable. Grant camera access and retry.');
              }
              // Give the camera a moment to become active before capturing.
              await new Promise<void>((resolve) => {
                setTimeout(() => resolve(), 1500);
              });
              image = await captureEyePhoto(cameraRef);
            } finally {
              setCapturing(false);
            }
          }
          const result = await scanService.submitAnemia(image, payload.data);
          scanId = result.scanId;
        }
        finish(scanId);
      } catch (error) {
        setFailed(toMessage(error));
      }
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const needsCapture = condition === 'anemia' && !eyeImage?.uri && !failed;
  const steps = STEP_SETS[condition] ?? [];

  if (failed) {
    return (
      <ScreenWrapper>
        <View style={styles.failContainer}>
          <Text style={styles.failIcon}>⚠️</Text>
          <Text style={styles.failTitle}>Scan failed</Text>
          <Text style={styles.failText}>{failed}</Text>
          <View style={styles.failActions}>
            <Button title="Retry" fullWidth onPress={() => navigation.goBack()} />
            <Button
              title="Back to Home"
              variant="ghost"
              fullWidth
              onPress={() => navigation.navigate('HomeTab')}
            />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  if (needsCapture) {
    if (!device) {
      return (
        <ScreenWrapper>
          <View style={styles.failContainer}>
            <Text style={styles.failIcon}>📷</Text>
            <Text style={styles.failTitle}>Waiting for camera…</Text>
            <Text style={styles.failText}>
              {hasPermission
                ? 'Looking for a front-facing camera.'
                : 'Grant camera access to continue, or go back and retry.'}
            </Text>
          </View>
        </ScreenWrapper>
      );
    }
    return (
      <ScreenWrapper>
        <Camera ref={cameraRef} device={device} style={StyleSheet.absoluteFill} isActive />
        <View style={styles.captureOverlay}>
          <Text style={styles.captureTitle}>📷 Taking your eye photo</Text>
          <Text style={styles.captureSubtitle}>
            Hold steady — capturing {capturing ? 'now…' : 'in a moment…'}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <ScanProgress steps={steps} autoAdvanceMs={1400} />
        {!isOnline && (
          <Text style={styles.offlineNote}>
            You appear to be offline — your scan can't be processed until the connection returns.
          </Text>
        )}
      </View>
    </ScreenWrapper>
  );
};

function toMessage(error: unknown): string {
  const normalized = toNormalizedError(error);
  if (normalized.kind === 'network' || normalized.kind === 'timeout') {
    return 'Network problem while talking to the server. Please check your connection and try again.';
  }
  return normalized.message;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'stretch' },
  failContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  failIcon: { fontSize: 56, marginBottom: Spacing.lg },
  failTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  failText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  failActions: { width: '100%', gap: Spacing.sm },
  captureOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  captureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  captureSubtitle: { fontSize: 14, color: Colors.white, opacity: 0.8, textAlign: 'center' },
  offlineNote: {
    marginTop: Spacing.lg,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
