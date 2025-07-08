import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_SETTINGS_KEY = 'anime_user_settings';

interface UserSettings {
  enableSearchHistory: boolean;
  // Add more user settings here as needed
}

const DEFAULT_SETTINGS: UserSettings = {
  enableSearchHistory: true,
};

/**
 * Retrieves the user settings from AsyncStorage
 * @returns User settings object
 */
export const getUserSettings = async (): Promise<UserSettings> => {
  try {
    const settings = await AsyncStorage.getItem(USER_SETTINGS_KEY);
    return settings ? { ...DEFAULT_SETTINGS, ...JSON.parse(settings) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error retrieving user settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Updates user settings
 * @param settings Partial settings to update
 */
export const updateUserSettings = async (settings: Partial<UserSettings>): Promise<void> => {
  try {
    const currentSettings = await getUserSettings();
    const newSettings = { ...currentSettings, ...settings };
    await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(newSettings));
  } catch (error) {
    console.error('Error updating user settings:', error);
  }
};

/**
 * Gets the search history enabled setting
 * @returns Boolean indicating if search history is enabled
 */
export const isSearchHistoryEnabled = async (): Promise<boolean> => {
  const settings = await getUserSettings();
  return settings.enableSearchHistory;
};

/**
 * Toggles the search history enabled setting
 * @returns The new state of the search history enabled setting
 */
export const toggleSearchHistory = async (): Promise<boolean> => {
  const settings = await getUserSettings();
  const newValue = !settings.enableSearchHistory;
  await updateUserSettings({ enableSearchHistory: newValue });
  return newValue;
};