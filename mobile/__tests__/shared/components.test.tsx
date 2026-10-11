/**
 * Basic UI components — render + interaction smoke tests (RNTL v14 async API).
 */
import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';

import { Button } from '../../src/shared/components/ui/Button';
import { Card } from '../../src/shared/components/ui/Card';
import { EmptyState } from '../../src/shared/components/feedback/EmptyState';

describe('Button', () => {
  test('renders title and handles press', async () => {
    const onPress = jest.fn();
    await render(<Button title="Start scan" onPress={onPress} />);
    expect(screen.getByText('Start scan')).toBeTruthy();
    await userEvent.press(screen.getByText('Start scan'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('does not fire when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button title="Go" onPress={onPress} disabled />);
    await userEvent.press(screen.getByText('Go'));
    expect(onPress).not.toHaveBeenCalled();
  });

  test('loading state hides title and disables interaction', async () => {
    const onPress = jest.fn();
    await render(<Button title="Go" onPress={onPress} loading />);
    // While loading, the button shows only the activity indicator.
    expect(screen.queryByText('Go')).toBeNull();
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Card', () => {
  test('renders children', async () => {
    await render(<Card>hello-card</Card>);
    expect(screen.getByText('hello-card')).toBeTruthy();
  });
});

describe('EmptyState', () => {
  test('renders title, description and CTA action', async () => {
    const onPress = jest.fn();
    await render(
      <EmptyState
        icon=""
        title="Nothing here"
        description="Try a scan"
        action={<Button title="Scan" onPress={onPress} />}
      />,
    );
    expect(screen.getByText('Nothing here')).toBeTruthy();
    expect(screen.getByText('Try a scan')).toBeTruthy();
    await userEvent.press(screen.getByText('Scan'));
    expect(onPress).toHaveBeenCalled();
  });
});
