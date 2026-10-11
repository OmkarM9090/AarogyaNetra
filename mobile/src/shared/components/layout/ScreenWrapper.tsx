/**
 * ScreenWrapper — standard screen container (background + optional scroll).
 */
import React from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors } from '../../theme';

interface ScreenWrapperProps {
  children?: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  keyboardAvoiding?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  scroll = false,
  style,
  contentStyle,
  keyboardAvoiding = false,
}) => {
  if (scroll) {
    return (
      <View style={[styles.root, style]}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    );
  }
  return (
    <View style={[styles.root, keyboardAvoiding && styles.keyboard, style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  keyboard: {
    // RN's KeyboardAvoidingView equivalent behavior is applied by parents;
    // this flag exists for API completeness.
  },
});
