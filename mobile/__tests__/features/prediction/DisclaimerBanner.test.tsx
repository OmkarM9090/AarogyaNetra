/**
 * DisclaimerBanner — the exact medical disclaimer text must render.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { App } from '../../../src/shared/constants/app';
import { DisclaimerBanner } from '../../../src/features/prediction/components/DisclaimerBanner';

describe('DisclaimerBanner', () => {
  test('renders the verbatim medical disclaimer', async () => {
    await render(<DisclaimerBanner />);
    expect(screen.getByText(App.MEDICAL_DISCLAIMER)).toBeTruthy();
  });

  test('disclaimer text matches the plan verbatim', () => {
    expect(App.MEDICAL_DISCLAIMER).toBe(
      'This screening result is for educational purposes only. It is not a medical diagnosis. Please consult a qualified healthcare professional for proper evaluation and treatment.',
    );
  });
});
