/**
 * ScannerScreen — live front camera for the anemia eye capture.
 *
 * Real image capture via react-native-vision-camera:
 *  1. permission + device
 *  2. guide overlay (EyeGuide) + steady-hold countdown
 *  3. takePhoto → local quality validation → Processing screen
 */
import React, { useCallback, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Camera } from 'react-native-vision-camera';

import { ScreenWrapper } from '../../../shared/components/layout/ScreenWrapper';
import { useLanguage } from '../../../shared/i18n';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import type { CapturedImage } from '../../../shared/types/scan';
import type { AnemiaInput } from '../../../shared/types/prediction';
import type { ScannerStackParamList } from '../../../app/navigation/types';
import { useCamera } from '../hooks/useCamera';
import { useFaceDetection } from '../hooks/useFaceDetection';
import { captureEyePhoto } from '../services/imageCapture';
import { validateEyeImage } from '../services/imagePreprocessing';
import { CameraOverlay } from '../components/CameraOverlay';
import { InstructionCard } from '../components/InstructionCard';

type Nav = NativeStackNavigationProp<ScannerStackParamList>;

export const ScannerScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const { t } = useLanguage();
  const anemiaData = (route.params as { payload?: { kind: 'anemia'; data: AnemiaInput } } | undefined)?.payload?.data;

  const { cameraRef, device, hasPermission, requestPermission } = useCamera();
  const { countdown, ready, startSteadyHold, cancelSteadyHold } = useFaceDetection();
  const [capturing, setCapturing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleCapture = useCallback(async () => {
    if (!anemiaData) {
      setLastError('Scan data is missing. Please go back and start the scan again.');
      return;
    }
    setCapturing(true);
    setLastError(null);
    try {
      const image: CapturedImage = await captureEyePhoto(cameraRef);
      const quality = await validateEyeImage(image);
      if (!quality.ok) {
        setLastError(quality.reasons[0] ?? 'Image rejected. Try again.');
        return;
      }
      navigation.navigate('Processing', {
        condition: 'anemia',
        payload: { kind: 'anemia', data: anemiaData, image },
      });
    } catch (e) {
      setLastError(e instanceof Error ? e.message : 'Capture failed. Try again.');
    } finally {
      setCapturing(false);
    }
  }, [cameraRef, navigation, anemiaData]);

  // ── No permission ────────────────────────────────────
  if (!hasPermission) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Camera permission required</Text>
          <Text style={styles.permissionDesc}>
            AarogyaNetra needs your front camera to photograph your open eye for the anemia
            screening. The photo is sent securely to the screening server and is not shared.
          </Text>
          <Pressable style={[styles.permissionBtn, { backgroundColor: Colors.primary }]} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant camera access</Text>
          </Pressable>
          <Pressable style={styles.permissionBtnOutline} onPress={() => Linking.openSettings().catch(() => undefined)}>
            <Text style={styles.permissionBtnOutlineText}>Open settings</Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    );
  }

  // ── No front camera ──────────────────────────────────
  if (!device) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text style={styles.permissionIcon}>⚠️</Text>
          <Text style={styles.permissionTitle}>No front camera found</Text>
          <Text style={styles.permissionDesc}>
            The anemia screening requires a front-facing camera.
          </Text>
          <Pressable
            style={[styles.permissionBtn, { backgroundColor: Colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.permissionBtnText}>Go back</Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Camera preview */}
        <View style={styles.preview}>
          <Camera ref={cameraRef} style={StyleSheet.absoluteFill} device={device} isActive photo />
          <CameraOverlay
            label="👁️ Align your eye"
            hint={countdown > 0 ? `Hold still… ${countdown}s` : 'Look straight at the screen'}
            active={ready}
          />
        </View>

        <InstructionCard
          title=" Eye capture instructions"
          steps={[
            'Remove glasses and face the light',
            'Hold your phone at eye level',
            'Keep your eyelid open and look at the guide',
            'Tap capture — a steady 1 second is enough',
          ]}
          color={Colors.anemia}
        />

        {lastError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {lastError}</Text>
          </View>
        ) : null}

        <View style={styles.captureBar}>
          <Pressable
            style={[styles.captureBtn, capturing && { opacity: 0.7 }]}
            onPress={handleCapture}
            disabled={capturing}
          >
            <Text style={styles.captureBtnText}>{capturing ? '📸 Capturing…' : '📸 Capture eye'}</Text>
          </Pressable>
          <Pressable onPress={() => { cancelSteadyHold(); navigation.goBack(); }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  preview: {
    height: 340,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: `${Colors.anemia}66`,
  },
  captureBar: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing.md,
  },
  captureBtn: {
    backgroundColor: Colors.anemia,
    borderRadius: 999,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    elevation: 6,
    shadowColor: Colors.anemia,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  captureBtnText: {
    ...Typography.body,
    fontWeight: '800',
    color: '#fff',
  },
  cancelText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textDecorationLine: 'underline',
  },
  errorBox: {
    backgroundColor: `${Colors.danger}10`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.danger}40`,
    padding: Spacing.md,
  },
  errorText: {
    ...Typography.bodySmall,
    color: Colors.danger,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
  },
  permissionIcon: {
    fontSize: 60,
    marginBottom: Spacing.lg,
  },
  permissionTitle: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  permissionDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: Spacing.xl,
  },
  permissionBtn: {
    borderRadius: 999,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  permissionBtnText: {
    ...Typography.body,
    fontWeight: '800',
    color: '#fff',
  },
  permissionBtnOutline: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.sm,
  },
  permissionBtnOutlineText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
