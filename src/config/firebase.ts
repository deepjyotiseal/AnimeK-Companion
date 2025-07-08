import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define server URLs from environment variables
const LOCAL_SERVER_URL = process.env.EXPO_PUBLIC_LOCAL_API_URL || 'http://localhost:3000';
const REMOTE_SERVER_URL = process.env.EXPO_PUBLIC_REMOTE_API_URL;

// Check if local server URL is defined
if (!LOCAL_SERVER_URL) {
  console.warn('EXPO_PUBLIC_LOCAL_API_URL is not defined in .env file. Using default: http://localhost:3000');
}

// Initially set API_URL to local, will be updated after server check
let API_URL = LOCAL_SERVER_URL;

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Check if all required Firebase config values are present
const missingConfigValues = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingConfigValues.length > 0) {
  console.error(
    `Missing required Firebase configuration values: ${missingConfigValues.join(', ')}\n` +
    'Please check your .env file and ensure all EXPO_PUBLIC_FIREBASE_* variables are set.'
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with React Native persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

/**
 * Check if the local server is running and set the appropriate API URL
 * @returns {Promise<boolean>} True if any server (local or remote) is available, false otherwise
 */
const checkServerHealth = async () => {
  try {
    // First try to connect to the local server
    console.log('Checking local server health...');
    // Use a shorter timeout for the connection attempt
    const localResponse = await axios.get(`${LOCAL_SERVER_URL}`, { timeout: 3000 });
    if (localResponse.status === 200) {
      console.log('Local server is running, using local server URL');
      API_URL = LOCAL_SERVER_URL;
      return true;
    }
  } catch (localError) {
    console.log('Local server not available, trying remote server...');
    // If local server is not available, try the remote server if URL is defined
    if (REMOTE_SERVER_URL) {
      try {
        // Use a shorter timeout for the connection attempt
        const remoteResponse = await axios.get(`${REMOTE_SERVER_URL}`, { timeout: 3000 });
        if (remoteResponse.status === 200) {
          console.log('Remote server is available, using remote server URL');
          API_URL = REMOTE_SERVER_URL;
          return true;
        }
      } catch (remoteError) {
        console.error('Remote server health check failed:', remoteError);
      }
    } else {
      console.log('Remote server URL not defined in environment variables');
    }
  }
  
  console.error('Both local and remote servers are unavailable');
  return false;
};

// Initialize Firebase asynchronously
const initializeFirebase = async () => {
  try {
    // Check if Firebase configuration is valid
    if (missingConfigValues.length > 0) {
      throw new Error(
        `Cannot initialize Firebase: Missing configuration values: ${missingConfigValues.join(', ')}\n` +
        'Please check your .env file and ensure all EXPO_PUBLIC_FIREBASE_* variables are set.'
      );
    }
    
    // Check if any server is running (local or remote)
    const isServerRunning = await checkServerHealth();
    
    if (!isServerRunning) {
      throw new Error('No server is available. Please check your internet connection, start the local server, or ensure EXPO_PUBLIC_REMOTE_API_URL is properly set in your .env file.');
    }
    
    // If a server is running and config is valid, proceed with Firebase initialization
    console.log('Firebase initialized successfully with API URL:', API_URL);
    return { app, auth, db };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
};

// Export the initialization function, Firebase instances, and API URL
export { initializeFirebase, app, auth, db, API_URL };

// Export a function to get the current API URL
export const getApiUrl = () => API_URL;