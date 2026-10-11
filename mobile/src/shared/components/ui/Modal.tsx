/**
 * Modal — full-screen page sheet wrapper.
 */
import React from 'react';
import { Modal as RNModal, SafeAreaView, StyleSheet } from 'react-native';

import { Colors } from '../../theme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  transparent?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ visible, onClose, children, transparent = false }) => (
  <RNModal
    visible={visible}
    animationType="slide"
    transparent={transparent}
    onRequestClose={onClose}
  >
    <SafeAreaView style={styles.container}>
      {transparent ? children : <>{children}</>}
    </SafeAreaView>
  </RNModal>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
