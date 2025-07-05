import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from './useAuth';

// Constants for donation dialog
const DONATION_DIALOG_KEY = 'donation_dialog_last_shown';
const USER_FIRST_LOGIN_KEY = 'user_first_login_timestamp';
const MIN_DAYS_BETWEEN_PROMPTS = 7; // Show at most once a week
const MIN_DAYS_FOR_NEW_USER = 7; // Minimum days after first login before showing to new users
const CHANCE_TO_SHOW = 0.2; // 20% chance to show when eligible

/**
 * Custom hook to manage the donation dialog that appears randomly and infrequently
 */
export const useDonationDialog = () => {
  const [initialized, setInitialized] = useState(false);
  const { showDialog } = useNotification();
  const { user, isLoading } = useAuth();

  // Track first login time for new users
  useEffect(() => {
    const trackFirstLogin = async () => {
      if (user && !isLoading) {
        try {
          const firstLoginTimestamp = await AsyncStorage.getItem(USER_FIRST_LOGIN_KEY);
          if (!firstLoginTimestamp) {
            // This is the first time we've seen this user, record the timestamp
            await AsyncStorage.setItem(USER_FIRST_LOGIN_KEY, new Date().toISOString());
          }
        } catch (error) {
          console.error('Error tracking first login:', error);
        }
      }
    };
    
    trackFirstLogin();
  }, [user, isLoading]);

  // Check if we should show the donation dialog
  const checkAndShowDonationDialog = async () => {
    try {
      // Don't show if user is not logged in or still loading
      if (!user || isLoading) {
        setInitialized(true);
        return;
      }
      
      // Get the last time the dialog was shown
      const lastShownStr = await AsyncStorage.getItem(DONATION_DIALOG_KEY);
      const firstLoginStr = await AsyncStorage.getItem(USER_FIRST_LOGIN_KEY);
      const now = new Date();
      let shouldCheck = true;

      // Check if this is a new user
      if (firstLoginStr) {
        const firstLogin = new Date(firstLoginStr);
        const daysSinceFirstLogin = (now.getTime() - firstLogin.getTime()) / (1000 * 60 * 60 * 24);
        
        // Don't show to new users until they've been using the app for MIN_DAYS_FOR_NEW_USER days
        if (daysSinceFirstLogin < MIN_DAYS_FOR_NEW_USER) {
          setInitialized(true);
          return;
        }
      }

      if (lastShownStr) {
        const lastShown = new Date(lastShownStr);
        const daysSinceLastShown = (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60 * 24);
        
        // Only consider showing if it's been at least MIN_DAYS_BETWEEN_PROMPTS days
        shouldCheck = daysSinceLastShown >= MIN_DAYS_BETWEEN_PROMPTS;
      }

      // If we should check, then apply the random chance
      if (shouldCheck && Math.random() < CHANCE_TO_SHOW) {
        // Show the donation dialog
        showDonationDialog();
        
        // Update the last shown timestamp
        await AsyncStorage.setItem(DONATION_DIALOG_KEY, now.toISOString());
      }
    } catch (error) {
      console.error('Error checking donation dialog status:', error);
    } finally {
      setInitialized(true);
    }
  };

  // Show the donation dialog
  const showDonationDialog = () => {
    showDialog({
      title: 'Support Development',
      message: 'If you enjoy using this app, would you consider making a small donation to support its continued development?',
      confirmText: 'Yes, I\'ll Donate',
      cancelText: 'Not Now',
      type: 'info',
      onConfirm: () => {
        // We'll handle navigation in the component that uses this hook
        if (typeof window !== 'undefined') {
          // Set a flag in storage that we want to navigate to Support screen
          AsyncStorage.setItem('navigate_to_support', 'true').catch(err => 
            console.error('Failed to set navigation flag:', err)
          );
        }
      },
      onCancel: () => {
        // User declined, do nothing
      }
    });
  };

  // Initialize on component mount
  useEffect(() => {
    if (!initialized && !isLoading) {
      checkAndShowDonationDialog();
    }
  }, [initialized, isLoading, user]);

  return {
    showDonationDialog // Expose this in case we want to manually trigger it
  };
};