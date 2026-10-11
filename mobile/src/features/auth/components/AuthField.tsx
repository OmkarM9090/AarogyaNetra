/**
 * AuthField — input with label + validation error, tailored for auth forms.
 */
import React from 'react';

import { Input } from '../../../shared/components/ui/Input';
import { useLanguage, type TranslationKey } from '../../../shared/i18n';

interface AuthFieldProps {
  labelKey?: TranslationKey;
  label?: string;
  error?: string;
  icon?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'decimal-pad';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export const AuthField: React.FC<AuthFieldProps> = ({
  labelKey,
  label,
  error,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'none',
}) => {
  const { t } = useLanguage();
  return (
    <Input
      label={label ?? (labelKey ? t(labelKey) : undefined)}
      error={error}
      icon={icon}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      autoComplete={secureTextEntry ? 'password' : 'off'}
    />
  );
};
