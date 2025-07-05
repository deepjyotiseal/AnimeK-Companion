/**
 * Utility functions for handling and formatting error messages
 */

/**
 * Converts Firebase authentication error codes to user-friendly messages
 * @param error - The error object from Firebase
 * @returns A user-friendly error message
 */
export const getAuthErrorMessage = (error: any): string => {
  // Extract the error code from Firebase error message
  const errorCode = error?.code || '';
  const errorMessage = error?.message || 'An unknown error occurred';

  // Map Firebase error codes to user-friendly messages
  switch (errorCode) {
    // Authentication errors
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password';
    
    case 'auth/email-already-in-use':
      return 'This email is already registered';
    
    case 'auth/weak-password':
      return 'Password is too weak. Please use a stronger password';
    
    case 'auth/invalid-verification-code':
      return 'Invalid verification code';
    
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email address but different sign-in credentials';
    
    case 'auth/operation-not-allowed':
      return 'This operation is not allowed';
    
    case 'auth/too-many-requests':
      return 'Too many unsuccessful login attempts. Please try again later';
    
    case 'auth/user-disabled':
      return 'This account has been disabled';
    
    case 'auth/requires-recent-login':
      return 'This operation requires recent authentication. Please log in again';
    
    case 'auth/popup-closed-by-user':
      return 'Authentication popup was closed before completing the sign in process';
    
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for OAuth operations';
    
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection';
    
    // Default case for unhandled errors
    default:
      // If we can extract a cleaner message from the error, use it
      if (errorMessage.includes('Firebase: Error')) {
        // Extract the message part after "Firebase: Error"
        const cleanedMessage = errorMessage.split('Firebase: Error')[1];
        if (cleanedMessage) {
          // Remove parentheses and auth/ prefix if present
          return cleanedMessage
            .replace(/\([^)]*\)/g, '')
            .replace('auth/', '')
            .trim()
            .replace(/-/g, ' ');
        }
      }
      return 'An error occurred. Please try again';
  }
};

/**
 * Converts Firebase Firestore error codes to user-friendly messages
 * @param error - The error object from Firebase
 * @returns A user-friendly error message
 */
export const getFirestoreErrorMessage = (error: any): string => {
  const errorCode = error?.code || '';
  
  switch (errorCode) {
    case 'permission-denied':
      return 'You don\'t have permission to perform this action';
    
    case 'not-found':
      return 'The requested document was not found';
    
    case 'already-exists':
      return 'The document already exists';
    
    case 'resource-exhausted':
      return 'You\'ve reached the maximum limit for this operation';
    
    case 'failed-precondition':
      return 'Operation was rejected because the system is not in a state required for the operation\'s execution';
    
    case 'aborted':
      return 'The operation was aborted';
    
    case 'out-of-range':
      return 'Operation was attempted past the valid range';
    
    case 'unimplemented':
      return 'This feature is not implemented yet';
    
    case 'internal':
      return 'Internal error. Please try again later';
    
    case 'unavailable':
      return 'Service is currently unavailable. Please try again later';
    
    case 'data-loss':
      return 'Unrecoverable data loss or corruption';
    
    case 'unauthenticated':
      return 'You need to be logged in to perform this action';
    
    default:
      return 'An error occurred. Please try again';
  }
};

/**
 * General error handler that can be used throughout the app
 * @param error - Any error object
 * @returns A user-friendly error message
 */
export const getErrorMessage = (error: any): string => {
  // Check if it's a Firebase auth error
  if (error?.code?.startsWith('auth/')) {
    return getAuthErrorMessage(error);
  }
  
  // Check if it's a Firestore error
  if (error?.code && typeof error.code === 'string') {
    return getFirestoreErrorMessage(error);
  }
  
  // Handle server connectivity errors
  if (error?.message?.includes('server is not available') || 
      error?.message?.includes('Failed to connect to the server')) {
    return 'Local server is not running. Please start the server and try again';
  }
  
  // Handle network errors
  if (error?.message?.includes('Network Error')) {
    return 'Network error. Please check your internet connection and ensure the local server is running';
  }
  
  // Handle timeout errors
  if (error?.message?.includes('timeout')) {
    return 'Request timed out. Please try again and ensure the local server is running';
  }
  
  // Default error message
  return error?.message || 'An unexpected error occurred';
};