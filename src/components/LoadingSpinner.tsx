import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 60, 
  color = '#FF6347' 
}) => {
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }],
    };
  });

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { 
        duration: 1000,
        easing: Easing.linear,
      }),
      -1, // Infinite repetitions
      false // Don't reverse the animation
    );
  }, []);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.spinner, animatedStyle, { borderColor: color, width: size, height: size }]} />
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