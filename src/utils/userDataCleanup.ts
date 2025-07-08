import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearSearchHistory } from './searchHistoryStorage';

/**
 * Clears all local user data when a user deletes their account
 * This ensures complete removal of user data from the device
 */
export const clearLocalUserData = async (): Promise<void> => {
  try {
    // Clear search history
    await clearSearchHistory();
    
    // Clear user settings
    await AsyncStorage.removeItem('anime_user_settings');
    
    // Clear any other user-specific data that might be stored locally
    // Add more items as needed when new local storage features are added
    
    console.log('Local user data cleared successfully');
  } catch (error) {
    console.error('Error clearing local user data:', error);
    // Don't throw the error, as we want the account deletion to proceed
    // even if local data cleanup fails
  }
};