import React, { createContext, useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { callFirestore, isServerAvailable } from '../api/firebaseApi';

export type WatchStatus = 'Watching' | 'Completed' | 'Plan to Watch' | 'Dropped' | 'On Hold' | 'Favorite';

export interface WatchlistItem {
  id: string;
  animeId: number;
  title: string;
  imageUrl: string;
  status: WatchStatus;
  progress: number;
  rating: number | null;
  updatedAt: Date;
  notes: string;
}

interface WatchlistContextType {
  items: WatchlistItem[];
  isLoading: boolean;
  error: Error | null;
  addToWatchlist: (
    animeId: number,
    title: string,
    imageUrl: string,
    status?: WatchStatus
  ) => Promise<void>;
  updateWatchlistItem: (
    id: string,
    updates: Partial<Omit<WatchlistItem, 'id' | 'animeId'>>
  ) => Promise<void>;
  removeFromWatchlist: (id: string) => Promise<void>;
  getItemByAnimeId: (animeId: number) => WatchlistItem | undefined;
  getAnimeStatus: (animeId: number) => WatchStatus | null;
}

export const WatchlistContext = createContext<WatchlistContextType>({} as WatchlistContextType);

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    // Set up polling for watchlist items instead of using onSnapshot
    const fetchWatchlistItems = async () => {
      try {
        // Check if server is available before fetching watchlist items
        const serverAvailable = await isServerAvailable();
        if (!serverAvailable) {
          throw new Error('Server is not available. Please ensure the local server is running.');
        }
        
        const collectionPath = `users/${user.uid}/watchlist`;
        const result = await callFirestore('get', collectionPath);
        
        const watchlistItems: WatchlistItem[] = result.map((item: any) => ({
          id: item.id,
          animeId: item.animeId,
          title: item.title,
          imageUrl: item.imageUrl,
          status: item.status,
          progress: item.progress,
          rating: item.rating,
          updatedAt: new Date(item.updatedAt._seconds * 1000), // Convert Firestore timestamp
          notes: item.notes || '',
        }));

        setItems(watchlistItems.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching watchlist items:', error);
        setError(error as Error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchWatchlistItems();

    // Set up polling interval (every 30 seconds)
    const intervalId = setInterval(fetchWatchlistItems, 30000);

    return () => clearInterval(intervalId);
  }, [user]);

  const addToWatchlist = async (
    animeId: number,
    title: string,
    imageUrl: string,
    status: WatchStatus = 'Plan to Watch'
  ) => {
    if (!user) throw new Error('User must be logged in to manage watchlist');

    try {
      // Check if server is available before adding to watchlist
      const serverAvailable = await isServerAvailable();
      if (!serverAvailable) {
        throw new Error('Server is not available. Please ensure the local server is running.');
      }
      const collectionPath = `users/${user.uid}/watchlist`;
      
      // Check if anime already exists in watchlist
      const existingItems = await callFirestore('get', collectionPath, {
        query: [['animeId', '==', animeId]]
      });
      
      if (existingItems && existingItems.length > 0) {
        throw new Error('Anime is already in your watchlist');
      }

      // Add new item
      const result = await callFirestore('add', collectionPath, {
        data: {
          animeId,
          title,
          imageUrl,
          status,
          progress: 0,
          rating: null,
          updatedAt: new Date(), // Server will convert to Firestore timestamp
          notes: '',
        }
      });
      
      // Update local state immediately
      const newItem: WatchlistItem = {
        id: result.id,
        animeId,
        title,
        imageUrl,
        status,
        progress: 0,
        rating: null,
        updatedAt: new Date(),
        notes: '',
      };
      
      setItems(prevItems => [newItem, ...prevItems]);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      setError(error as Error);
      throw error;
    }
  };

  const updateWatchlistItem = async (
    id: string,
    updates: Partial<Omit<WatchlistItem, 'id' | 'animeId'>>
  ) => {
    if (!user) throw new Error('User must be logged in to manage watchlist');

    try {
      // Check if server is available before updating watchlist item
      const serverAvailable = await isServerAvailable();
      if (!serverAvailable) {
        throw new Error('Server is not available. Please ensure the local server is running.');
      }
      const collectionPath = `users/${user.uid}/watchlist`;
      const currentItem = items.find(item => item.id === id);
      if (!currentItem) throw new Error('Item not found');

      await callFirestore('update', collectionPath, {
        document: id,
        data: {
          animeId: currentItem.animeId, // Include animeId in update
          ...updates,
          updatedAt: new Date(), // Server will convert to Firestore timestamp
        }
      });
      
      // Update local state immediately
      setItems(prevItems => {
        return prevItems.map(item => {
          if (item.id === id) {
            return {
              ...item,
              ...updates,
              updatedAt: new Date(),
            };
          }
          return item;
        });
      });
    } catch (error) {
      console.error('Error updating watchlist item:', error);
      setError(error as Error);
      throw error;
    }
  };

  const removeFromWatchlist = async (id: string) => {
    if (!user) throw new Error('User must be logged in to manage watchlist');

    try {
      // Check if server is available before removing from watchlist
      const serverAvailable = await isServerAvailable();
      if (!serverAvailable) {
        throw new Error('Server is not available. Please ensure the local server is running.');
      }
      const collectionPath = `users/${user.uid}/watchlist`;
      await callFirestore('delete', collectionPath, { document: id });
      
      // Update local state immediately
      setItems(prevItems => prevItems.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      setError(error as Error);
      throw error;
    }
  };

  const getItemByAnimeId = (animeId: number) => {
    return items.find(item => item.animeId === animeId);
  };

  const getAnimeStatus = (animeId: number): WatchStatus | null => {
    const item = items.find(item => item.animeId === animeId);
    return item ? item.status : null;
  };

  return (
    <WatchlistContext.Provider
      value={{
        items,
        isLoading,
        error,
        addToWatchlist,
        updateWatchlistItem,
        removeFromWatchlist,
        getItemByAnimeId,
        getAnimeStatus,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};