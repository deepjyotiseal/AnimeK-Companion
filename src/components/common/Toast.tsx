import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onHide) {
          onHide();
        }
      });
    } else {
      opacity.setValue(0);
    }
  }, [visible, duration, onHide]);

  if (!visible) {
    return null;
  }

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      case 'info':
      default:
        return '#2196F3';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, backgroundColor: getBackgroundColor() },
      ]}
    >
      <Ionicons name={getIconName()} size={24} color="#fff" />
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity onPress={onHide} style={styles.closeButton}>
        <Ionicons name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  closeButton: {
    marginLeft: 10,
  },
});

export default Toast;