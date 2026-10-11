/**
 * i18n — LanguageProvider + useLanguage across en/hi/mr.
 */
import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { LanguageProvider, useLanguage } from '../../src/shared/i18n';
import type { TranslationKey } from '../../src/shared/i18n';

function Probe({ k }: { k: TranslationKey | (string & {}) }) {
  const { t } = useLanguage();
  return <Text>{t(k as TranslationKey)}</Text>;
}

describe('i18n', () => {
  test('renders english by default', async () => {
    await render(
      <LanguageProvider language="en">
        <Probe k="diabetes" />
      </LanguageProvider>,
    );
    expect(screen.getByText('Diabetes')).toBeTruthy();
  });

  test('switches language to hindi', async () => {
    await render(
      <LanguageProvider language="hi">
        <Probe k="diabetes" />
      </LanguageProvider>,
    );
    expect(screen.getByText('मधुमेह')).toBeTruthy();
  });

  test('renders marathi', async () => {
    await render(
      <LanguageProvider language="mr">
        <Probe k="continue" />
      </LanguageProvider>,
    );
    expect(screen.getByText('पुढे चला')).toBeTruthy();
  });

  test('missing key falls back to the key itself', async () => {
    await render(
      <LanguageProvider language="en">
        <Probe k="definitely_not_a_key" />
      </LanguageProvider>,
    );
    expect(screen.getByText('definitely_not_a_key')).toBeTruthy();
  });
});
