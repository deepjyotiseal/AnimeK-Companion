import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ButtonVariant = 'solid' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  children: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'solid',
  size = 'medium',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  iconName,
  iconPosition = 'left',
}) => {
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#FF0000',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      default:
        return {
          backgroundColor: '#FF0000',
        };
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: 8,
          paddingHorizontal: 16,
        };
      case 'large':
        return {
          paddingVertical: 16,
          paddingHorizontal: 32,
        };
      default:
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
        };
    }
  };

  const getTextColor = (): string => {
    if (disabled) return '#999';
    switch (variant) {
      case 'outline':
      case 'ghost':
        return '#FF0000';
      default:
        return '#FFFFFF';
    }
  };

  const textColor = getTextColor();

  const renderIcon = () => {
    if (!iconName) return null;
    return (
      <Ionicons
        name={iconName}
        size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
        color={textColor}
        style={[
          styles.icon,
          iconPosition === 'right' && styles.iconRight,
        ]}
      />
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading || disabled}
      style={[
        styles.button,
        getVariantStyles(),
        getSizeStyles(),
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'solid' ? '#FFFFFF' : '#FF0000'}
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <>
          {iconPosition === 'left' && renderIcon()}
          <Text
            style={[
              styles.text,
              {
                color: textColor,
                fontSize: size === 'small' ? 14 : size === 'large' ? 18 : 16,
              },
              textStyle,
            ]}
          >
            {children}
          </Text>
          {iconPosition === 'right' && renderIcon()}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: 8,
  },
  iconRight: {
    marginRight: 0,
    marginLeft: 8,
  },
});