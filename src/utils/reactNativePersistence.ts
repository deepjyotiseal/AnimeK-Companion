import AsyncStorage from '@react-native-async-storage/async-storage';

// Define interfaces to match Firebase auth expectations
interface StorageInterface {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

interface PersistenceInterface {
  type: 'LOCAL' | 'SESSION' | 'NONE';
  _shouldAllowMigration?: boolean;
  _get: (key: string) => Promise<string | null>;
  _set: (key: string, value: string) => Promise<void>;
  _remove: (key: string) => Promise<void>;
}

// This is a custom implementation of getReactNativePersistence
// based on the Firebase SDK source code for v10+
export const getReactNativePersistence = (storage: StorageInterface): PersistenceInterface => {
  return {
    type: 'LOCAL',
    _shouldAllowMigration: true,
    _get: async (key: string) => {
      return storage.getItem(key);
    },
    _set: async (key: string, value: string) => {
      return storage.setItem(key, value);
    },
    _remove: async (key: string) => {
      return storage.removeItem(key);
    }
  };
};