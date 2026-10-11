/**
 * LanguageSelector — pick the app language (en / hi / mr).
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/components/ui/Card';
import { useAppStore } from '../../../shared/store/useAppStore';
import { LANGUAGE_LIST, type LanguageCode } from '../../../shared/i18n';
import { Colors, Spacing, Typography } from '../../../shared/theme';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useAppStore();

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>🌐 App language</Text>
      <View style={styles.row}>
        {LANGUAGE_LIST.map((l) => (
          <Pressable
            key={l.code}
            style={[styles.option, language === l.code && styles.optionActive]}
            onPress={() => setLanguage(l.code as LanguageCode)}
          >
            <Text style={styles.flag}>{l.flag}</Text>
            <View>
              <Text style={[styles.native, language === l.code && styles.nativeActive]}>{l.native}</Text>
              <Text style={styles.english}>{l.label}</Text>
            </View>
            {language === l.code ? (
              <View style={styles.check}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
  },
  row: {
    gap: Spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
  },
  optionActive: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}08`,
  },
  flag: {
    fontSize: 22,
  },
  native: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  nativeActive: {
    color: Colors.primary,
  },
  english: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  check: {
    marginLeft: 'auto',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
});
