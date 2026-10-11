/**
 * useCamera — front camera permission + device selection.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';

export function useCamera() {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [permissionRequested, setPermissionRequested] = useState(false);

  const handleRequestPermission = useCallback(async () => {
    setPermissionRequested(true);
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        '📷 Camera access needed',
        'AarogyaNetra needs the front camera to capture your eye image for the anemia screening.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings().catch(() => undefined) },
        ],
      );
    }
  }, [requestPermission]);

  useEffect(() => {
    if (!hasPermission && !permissionRequested) {
      void handleRequestPermission();
    }
  }, [hasPermission, permissionRequested, handleRequestPermission]);

  return { cameraRef, device, hasPermission, requestPermission: handleRequestPermission };
}
