import AsyncStorage from '@react-native-async-storage/async-storage';
import { Persistence } from 'firebase/auth';

/**
 * This file is a wrapper for the official Firebase React Native persistence.
 * It's kept for backward compatibility but now simply re-exports the official implementation.
 * 
 * For Firebase v11.6.0+, we need to use the official implementation from the firebase/auth package.
 * The error "INTERNAL ASSERTION FAILED: Expected a class definition" occurs when using a custom
 * implementation that doesn't match the expected class structure in Firebase v11+.
 */

// Re-export the AsyncStorage instance for convenience
export { AsyncStorage };

// This is just a placeholder function that will be replaced by the import in firebase.ts
export const getReactNativePersistence = () => {
  console.warn(
    'Custom getReactNativePersistence is deprecated. ' +
    'Please use the official implementation from firebase/auth directly.'
  );
  return null;
};