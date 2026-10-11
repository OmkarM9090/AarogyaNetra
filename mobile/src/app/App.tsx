/**
 * AarogyaNetra — root application component.
 */
import React, { useEffect } from 'react';

import { bindAuthSessionHandlers } from '../features/auth/store/authStore';
import { AppProviders } from './providers/AppProviders';
import { ErrorBoundary } from '../shared/components/feedback/ErrorBoundary';
import { RootNavigator } from './navigation/RootNavigator';

function App(): React.JSX.Element {
  // Wire the 401 → refresh → retry interceptors exactly once.
  useEffect(() => {
    bindAuthSessionHandlers();
  }, []);

  return (
    <ErrorBoundary>
      <AppProviders>
        <RootNavigator />
      </AppProviders>
    </ErrorBoundary>
  );
}

export default App;
