import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../contexts/NotificationContext';
import type { AuthStackParamList } from '../navigation/AuthNavigator';
import { Ionicons } from '@expo/vector-icons';
import { getErrorMessage } from '../utils/errorHandlers';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const { resetPassword } = useAuth();
  const { showToast, showDialog } = useNotification();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start a 60-second countdown timer
  const startResendTimer = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Set initial time (60 seconds)
    setTimeRemaining(60);
    
    // Start the countdown
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Clear the timer when it reaches zero
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Clean up the timer when component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleResetPassword = async () => {
    if (!email) {
      showToast({
        message: 'Please enter your email address',
        type: 'error',
      });
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword(email);
      setResetSent(true);
      startResendTimer();
      showToast({
        message: 'Password reset email sent. Check your inbox for instructions.',
        type: 'success',
        duration: 5000,
      });
    } catch (error: any) {
      showToast({
        message: getErrorMessage(error),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResend = async () => {
    // Only allow resend if timer has expired
    if (timeRemaining > 0) {
      showToast({
        message: `Please wait ${timeRemaining} seconds before requesting another email`,
        type: 'warning',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await resetPassword(email);
      startResendTimer();
      showToast({
        message: 'Password reset email has been resent',
        type: 'success',
        duration: 4000,
      });
    } catch (error: any) {
      showToast({
        message: getErrorMessage(error),
        type: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
    >
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FF0000" />
        </TouchableOpacity>
        
        <View style={styles.header}>
          <Ionicons name="lock-open-outline" size={64} color="#FF0000" />
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you instructions to reset your password
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <Button
            onPress={!resetSent ? handleResetPassword : handleResend}
            isLoading={isLoading}
            size="large"
            style={styles.resetButton}
            disabled={resetSent && timeRemaining > 0}
          >
            {!resetSent ? 'Send Reset Link' : timeRemaining > 0 ? `Resend in ${timeRemaining}s` : 'Resend Email'}
          </Button>
          
          {resetSent && (
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                {timeRemaining > 0 
                  ? `You can request another email in ${timeRemaining} seconds` 
                  : 'Didn\'t receive the email? Try checking your spam folder or click Resend Email'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  },
  resetButton: {
    marginTop: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF0000',
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
    fontSize: 16,
  },
  loginText: {
    color: '#FF0000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;