import { useCallback } from 'react';
import { useWatchlist } from './useWatchlist';
import { useNotification } from '../contexts/NotificationContext';
import { WatchlistItem, WatchStatus } from '../contexts/WatchlistContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

/**
 * Custom hook to manage watchlist item actions
 * This separates the action logic from the WatchlistScreen component
 * to improve performance and prevent crashes during swipe gestures
 */
export const useWatchlistActions = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { updateWatchlistItem, removeFromWatchlist } = useWatchlist();
  const { showToast, showDialog } = useNotification();

  // Navigate to anime detail screen
  const handleAnimePress = useCallback((animeId: number) => {
    navigation.navigate('AnimeDetail', { animeId });
  }, [navigation]);

  // Update watchlist item status
  const handleStatusChange = useCallback(async (
    item: WatchlistItem, 
    newStatus: WatchStatus,
    onStatusChangeSuccess?: (newStatus: WatchStatus) => void
  ) => {
    try {
      await updateWatchlistItem(item.id, { status: newStatus });
      showDialog({
        title: 'Status Updated',
        message: `"${item.title}" moved to ${newStatus}`,
        type: 'success',
        confirmText: 'View Now',
        cancelText: 'Stay Here',
        onConfirm: () => onStatusChangeSuccess && onStatusChangeSuccess(newStatus),
      });
    } catch (error) {
      console.error('Error updating status:', error);
      showToast({
        message: 'Failed to update status',
        type: 'error',
        duration: 4000,
      });
    }
  }, [updateWatchlistItem, showDialog, showToast]);

  // Remove watchlist item
  const handleRemove = useCallback(async (item: WatchlistItem) => {
    showDialog({
      title: 'Remove Anime',
      message: `Are you sure you want to remove "${item.title}" from your watchlist?`,
      type: 'warning',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await removeFromWatchlist(item.id);
          showToast({
            message: `"${item.title}" removed from watchlist`,
            type: 'info',
            duration: 3000,
          });
        } catch (error) {
          console.error('Error removing item:', error);
          showToast({
            message: 'Failed to remove anime from watchlist',
            type: 'error',
          });
        }
      },
    });
  }, [removeFromWatchlist, showDialog, showToast]);

  // Update watchlist item progress
  const handleProgressUpdate = useCallback(async (item: WatchlistItem, increment: number) => {
    try {
      const newProgress = Math.max(0, item.progress + increment);
      await updateWatchlistItem(item.id, { progress: newProgress });
      showToast({
        message: `Progress updated: ${item.title} - ${newProgress} episodes`,
        type: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      showToast({
        message: 'Failed to update progress',
        type: 'error',
        duration: 3000,
      });
    }
  }, [updateWatchlistItem, showToast]);

  return {
    handleAnimePress,
    handleStatusChange,
    handleRemove,
    handleProgressUpdate,
  };
};