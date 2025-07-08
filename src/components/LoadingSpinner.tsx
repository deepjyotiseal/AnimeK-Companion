import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 60, 
  color = '#FF6347' 
}) => {
  // Using ActivityIndicator as a fallback for more reliable spinning
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    borderWidth: 4,
    borderTopColor: 'transparent',
    borderRadius: 50,
  },
});

export default LoadingSpinner;