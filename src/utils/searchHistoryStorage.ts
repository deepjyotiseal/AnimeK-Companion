import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = 'anime_search_history';
const MAX_HISTORY_ITEMS = 10;

/**
 * Retrieves the search history from AsyncStorage
 * @returns Array of search history items
 */
export const getSearchHistory = async (): Promise<string[]> => {
  try {
    const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error retrieving search history:', error);
    return [];
  }
};

/**
 * Adds a search query to history
 * @param query The search query to add
 */
export const addToSearchHistory = async (query: string): Promise<void> => {
  if (!query.trim()) return;
  
  try {
    const history = await getSearchHistory();
    
    // Remove the query if it already exists (to avoid duplicates)
    const filteredHistory = history.filter(item => item.toLowerCase() !== query.toLowerCase());
    
    // Add the new query to the beginning of the array
    const newHistory = [query, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);
    
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Error adding to search history:', error);
  }
};

/**
 * Removes a specific query from search history
 * @param query The search query to remove
 */
export const removeFromSearchHistory = async (query: string): Promise<void> => {
  try {
    const history = await getSearchHistory();
    const newHistory = history.filter(item => item !== query);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('Error removing from search history:', error);
  }
};

/**
 * Clears the entire search history
 */
export const clearSearchHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
};