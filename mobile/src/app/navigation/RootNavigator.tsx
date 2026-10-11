/**
 * RootNavigator — auth gate.
 *
 *  - bootstrapping → splash-style loading
 *  - not authenticated → AuthStack
 *  - authenticated → MainTabs
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { useAuthStore } from '../../features/auth/store/authStore';
import { LoadingSpinner } from '../../shared/components/ui/LoadingSpinner';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isBootstrapping } = useAuthStore();

  if (isBootstrapping) {
    return (
      <NavigationContainer>
        <LoadingSpinner fullScreen label="AarogyaNetra" />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};
