/**
 * ScanHistoryList — virtualized-feel list with pagination.
 */
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { LoadingSpinner } from '../../../shared/components/ui/LoadingSpinner';
import { EmptyState } from '../../../shared/components/feedback/EmptyState';
import { Button } from '../../../shared/components/ui/Button';
import { Colors, Spacing, Typography } from '../../../shared/theme';
import type { ScanRecord } from '../../../shared/types/scan';
import { ScanHistoryItem } from './ScanHistoryItem';

interface ScanHistoryListProps {
  items: ScanRecord[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onOpen: (scan: ScanRecord) => void;
  onRetry: () => void;
}

export const ScanHistoryList: React.FC<ScanHistoryListProps> = ({
  items,
  isLoading,
  error,
  hasMore,
  onLoadMore,
  onOpen,
  onRetry,
}) => {
  if (error && items.length === 0) {
    return (
      <EmptyState
        icon="📡"
        title="Couldn't load history"
        description={error}
        action={<Button title="🔄 Retry" variant="outline" style={{ marginTop: Spacing.lg }} onPress={onRetry} />}
      />
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <EmptyState
        icon="🗂️"
        title="No scans yet"
        description="Your completed health scans will appear here."
      />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <ScanHistoryItem scan={item} onPress={onOpen} />}
      contentContainerStyle={styles.content}
      onEndReachedThreshold={0.3}
      onEndReached={() => {
        if (hasMore && !isLoading) onLoadMore();
      }}
      ListFooterComponent={
        isLoading ? (
          <LoadingSpinner label="Loading more…" />
        ) : (
          <View style={styles.footer}>
            <Text style={styles.footerText}>{items.length} scan{items.length === 1 ? '' : 's'} loaded</Text>
          </View>
        )
      }
      ListEmptyComponent={isLoading ? <LoadingSpinner fullScreen label="Loading your scans…" /> : null}
    />
  );
};

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
});
