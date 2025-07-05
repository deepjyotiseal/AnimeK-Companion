import axios from 'axios';
import { auth, getApiUrl } from '../config/firebase';

/**
 * Check if the server is available
 * @returns {Promise<boolean>} True if server is available, false otherwise
 */
export const isServerAvailable = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${getApiUrl()}`, { timeout: 3000 });
    return response.status === 200;
  } catch (error) {
    console.error('Server availability check failed:', error);
    return false;
  }
};

/**
 * Get the server version
 * @returns {Promise<string>} The server version
 */
export const getServerVersion = async (): Promise<string> => {
  try {
    const response = await axios.get(`${getApiUrl()}/version`, { timeout: 3000 });
    return response.data.version;
  } catch (error) {
    console.error('Failed to get server version:', error);
    throw error;
  }
};

/**
 * Call Firestore operations through the server API
 */
export const callFirestore = async (
  operation: 'get' | 'add' | 'update' | 'delete',
  collection: string,
  options?: {
    document?: string;
    data?: any;
    query?: [string, string, any][];
  }
) => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth not initialized');
    }
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User must be logged in to perform Firestore operations');
    }
    
    // Get the user's ID token
    const idToken = await currentUser.getIdToken();
    
    // Make the API request
    const response = await axios.post(
      `${getApiUrl()}/callFirestore`,
      {
        operation,
        collection,
        document: options?.document,
        data: options?.data,
        query: options?.query,
      },
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );
    
    return response.data;
  } catch (error: any) {
    // Check if this is a network error (server not available)
    if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      console.error('Server connection error:', error);
      throw new Error('Server is not available. Please ensure the local server is running.');
    }
    
    console.error('Error calling Firestore API:', error);
    throw error;
  }
};

export default {
  callFirestore,
  isServerAvailable,
  getServerVersion
};