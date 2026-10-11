/**
 * SafeAreaWrapper — insets-aware container.
 */
import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../../theme';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
  style?: ViewStyle;
}

export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  edges = ['top', 'bottom'],
  style,
}) => {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
  };
  edges.forEach((edge) => {
    if (edge === 'top') padding.paddingTop = insets.top;
    if (edge === 'bottom') padding.paddingBottom = insets.bottom;
    if (edge === 'left') padding.paddingLeft = insets.left;
    if (edge === 'right') padding.paddingRight = insets.right;
  });
  return (
    <View style={[styles.root, padding, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
