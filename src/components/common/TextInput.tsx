import React from 'react';
import {
  TextInput as RNTextInput,
  StyleSheet,
  View,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  errorStyle?: StyleProp<TextStyle>;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  iconName,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      
      <View style={styles.inputContainer}>
        {iconName && (
          <Ionicons name={iconName} size={20} color="#666" style={styles.inputIcon} />
        )}
        
        <RNTextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor="#999"
          {...props}
        />
      </View>
      
      {error && <Text style={[styles.error, errorStyle]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  error: {
    color: '#FF0000',
    fontSize: 14,
    marginTop: 4,
  },
});