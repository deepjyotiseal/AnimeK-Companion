import { useState, useCallback } from 'react';
import { WatchStatus } from '../contexts/WatchlistContext';

/**
 * Custom hook to manage watchlist tab state and functionality
 * This separates the tab logic from the WatchlistScreen component
 * to improve performance and prevent crashes during swipe gestures
 */
export const useWatchlistTabs = (initialTab: WatchStatus = 'Watching') => {
  const [activeTab, setActiveTab] = useState<WatchStatus>(initialTab);

  // Handle tab change with memoization to prevent unnecessary re-renders
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab as WatchStatus);
  }, []);

  // Update active tab when navigation params change
  const updateActiveTab = useCallback((newTab: WatchStatus | undefined) => {
    if (newTab) {
      setActiveTab(newTab);
    }
  }, []);

  return {
    activeTab,
    handleTabChange,
    updateActiveTab,
  };
};