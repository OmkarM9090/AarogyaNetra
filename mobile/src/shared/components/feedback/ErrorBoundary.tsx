/**
 * ErrorBoundary — catches render errors and shows a recoverable screen.
 */
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Linking, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Spacing, Typography } from '../../theme';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Hook for future Sentry/Crashlytics integration (Phase 6).
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, message: '' });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>⚠️</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.desc}>
          An unexpected error occurred. You can retry, or share the error details with the team.
        </Text>
        {this.state.message ? <Text style={styles.detail}>{this.state.message}</Text> : null}
        <View style={styles.actions}>
          <Button title="🔄 Try again" onPress={this.reset} fullWidth size="large" />
          <Button
            title="Report issue"
            variant="outline"
            fullWidth
            onPress={() => {
              void Share.share({
                message: `AarogyaNetra error report:\n\n${this.state.message}\n\nPlease share this with the AarogyaNetra team.`,
                title: 'AarogyaNetra error',
              }).catch(() => undefined);
            }}
          />
          <TouchableOpacity
            style={styles.homeLink}
            onPress={() => Linking.openSettings().catch(() => undefined)}
          >
            <Text style={styles.homeLinkText}>Open system settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.danger,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  desc: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  detail: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontFamily: 'monospace',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
    alignItems: 'center',
  },
  homeLink: {
    marginTop: Spacing.sm,
  },
  homeLinkText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    textDecorationLine: 'underline',
  },
});
