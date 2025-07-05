import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button } from '../common/Button';
import { useNotification } from '../../contexts/NotificationContext';
import { getErrorMessage } from '../../utils/errorHandlers';

/**
 * This component demonstrates how to use the error handling utilities
 * with different types of errors.
 */
const ErrorHandlingExample = () => {
  const { showToast, showDialog } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  // Simulate Firebase authentication errors
  const simulateAuthErrors = () => {
    const authErrors = [
      { code: 'auth/invalid-credential', message: 'Firebase: Error (auth/invalid-credential).' },
      { code: 'auth/user-not-found', message: 'Firebase: Error (auth/user-not-found).' },
      { code: 'auth/wrong-password', message: 'Firebase: Error (auth/wrong-password).' },
      { code: 'auth/email-already-in-use', message: 'Firebase: Error (auth/email-already-in-use).' },
      { code: 'auth/weak-password', message: 'Firebase: Error (auth/weak-password).' },
      { code: 'auth/too-many-requests', message: 'Firebase: Error (auth/too-many-requests).' },
    ];

    // Pick a random error
    const randomError = authErrors[Math.floor(Math.random() * authErrors.length)];
    
    showToast({
      message: getErrorMessage(randomError),
      type: 'error',
      duration: 4000,
    });
  };

  // Simulate Firestore errors
  const simulateFirestoreErrors = () => {
    const firestoreErrors = [
      { code: 'permission-denied', message: 'Firestore: Permission denied' },
      { code: 'not-found', message: 'Firestore: Document not found' },
      { code: 'already-exists', message: 'Firestore: Document already exists' },
      { code: 'resource-exhausted', message: 'Firestore: Quota exceeded' },
    ];

    // Pick a random error
    const randomError = firestoreErrors[Math.floor(Math.random() * firestoreErrors.length)];
    
    showToast({
      message: getErrorMessage(randomError),
      type: 'error',
      duration: 4000,
    });
  };

  // Simulate network errors
  const simulateNetworkError = () => {
    const networkError = new Error('Network Error: Unable to connect to the server');
    
    showToast({
      message: getErrorMessage(networkError),
      type: 'error',
      duration: 4000,
    });
  };

  // Simulate a critical error that requires user action
  const simulateCriticalError = () => {
    const criticalError = { code: 'auth/requires-recent-login', message: 'Firebase: Error (auth/requires-recent-login).' };
    
    showDialog({
      title: 'Action Required',
      message: getErrorMessage(criticalError),
      type: 'error',
      confirmText: 'Login Again',
      cancelText: 'Cancel',
      onConfirm: () => showToast({ message: 'Redirecting to login...', type: 'info' }),
    });
  };

  // Simulate a loading state with error
  const simulateLoadingError = async () => {
    setIsLoading(true);
    
    try {
      // Simulate an API call that fails
      await new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API request failed')), 2000);
      });
    } catch (error) {
      showToast({
        message: getErrorMessage(error),
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Button 
          onPress={simulateAuthErrors}
          style={styles.button}
        >
          Simulate Auth Error
        </Button>

        <Button 
          onPress={simulateFirestoreErrors}
          style={styles.button}
        >
          Simulate Firestore Error
        </Button>

        <Button 
          onPress={simulateNetworkError}
          style={styles.button}
        >
          Simulate Network Error
        </Button>

        <Button 
          onPress={simulateCriticalError}
          style={styles.button}
        >
          Simulate Critical Error
        </Button>

        <Button 
          onPress={simulateLoadingError}
          isLoading={isLoading}
          style={styles.button}
        >
          Simulate Loading Error
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 20,
    gap: 16,
  },
  button: {
    marginBottom: 8,
  },
});

export default ErrorHandlingExample;