import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import axios from 'axios';

// Define server URLs from environment variables with fallbacks
const LOCAL_SERVER_URL = process.env.EXPO_PUBLIC_LOCAL_API_URL || 'http://localhost:3000';
const REMOTE_SERVER_URL = process.env.EXPO_PUBLIC_REMOTE_API_URL || 'https://anime-companion-server.onrender.com';

// Initially set API_URL to local, will be updated after server check
let API_URL = LOCAL_SERVER_URL;

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMKGycMqWAajcK5WPLDgsUQ5Wj6KtOMZc",
  authDomain: "animeapp-68ff3.firebaseapp.com",
  projectId: "animeapp-68ff3",
  storageBucket: "animeapp-68ff3.firebasestorage.app",
  messagingSenderId: "745584220135",
  appId: "1:745584220135:web:caf693cd62c021e0a04f42"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * Check if the local server is running and set the appropriate API URL
 * @returns {Promise<boolean>} True if any server (local or remote) is available, false otherwise
 */
const checkServerHealth = async () => {
  try {
    // First try to connect to the local server
    console.log('Checking local server health...');
    const localResponse = await axios.get(`${LOCAL_SERVER_URL}`, { timeout: 3000 });
    if (localResponse.status === 200) {
      console.log('Local server is running, using local server URL');
      API_URL = LOCAL_SERVER_URL;
      return true;
    }
  } catch (localError) {
    console.log('Local server not available, trying remote server...');
    // If local server is not available, try the remote server
    try {
      const remoteResponse = await axios.get(`${REMOTE_SERVER_URL}`, { timeout: 5000 });
      if (remoteResponse.status === 200) {
        console.log('Remote server is available, using remote server URL');
        API_URL = REMOTE_SERVER_URL;
        return true;
      }
    } catch (remoteError) {
      console.error('Remote server health check failed:', remoteError);
    }
  }
  
  console.error('Both local and remote servers are unavailable');
  return false;
};

// Initialize Firebase asynchronously
const initializeFirebase = async () => {
  try {
    // First check if any server is running (local or remote)
    const isServerRunning = await checkServerHealth();
    
    if (!isServerRunning) {
      throw new Error('No server is available. Please check your internet connection or start the local server and try again.');
    }
    
    // If a server is running, proceed with Firebase initialization
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