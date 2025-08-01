import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { WatchlistProvider } from './contexts/WatchlistContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppNavigator } from './navigation/AppNavigator';
import { StatusBar, View, Text, Button, StyleSheet } from 'react-native';
import LoadingSpinner from './components/LoadingSpinner';
import { initializeFirebase, getApiUrl } from './config/firebase';
import { checkForUpdates } from './services/updateService';
import { UpdateDialog } from './components/UpdateDialog';
import { useDonationDialog } from './hooks/useDonationDialog';
import { wakeServer } from './utils/serverPreheater';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      networkMode: 'online',
    },
  },
});

interface AppContentProps {
  updateAvailable: boolean;
  serverVersion: string;
  onCloseUpdateDialog: () => void;
}

const AppContent: React.FC<AppContentProps> = ({ 
  updateAvailable, 
  serverVersion, 
  onCloseUpdateDialog 
}) => {
  // Initialize the donation dialog hook
  useDonationDialog();
  
  return (
    <>
      <AppNavigator />
      <StatusBar />
      {/* Update Dialog */}
      <UpdateDialog 
        visible={updateAvailable} 
        onClose={onCloseUpdateDialog}
        serverVersion={serverVersion}
      />
    </>
  );
};

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [serverVersion, setServerVersion] = useState('');
  const [isPreheating, setIsPreheating] = useState(false);
  const [preheatProgress, setPreheatProgress] = useState(1); // Start at attempt 1

  // Function to initialize Firebase and connect to server
  const initialize = async () => {
    try {
      // Start preheating the server before Firebase initialization
      setIsPreheating(true);
      
      // Get the remote server URL
      const serverUrl = process.env.EXPO_PUBLIC_REMOTE_API_URL;
      console.log('Connecting to server:', serverUrl);
      
      // Setup progress update callback for connection attempts
      const updateProgress = (attempt: number) => {
        setPreheatProgress(attempt);
      };
      
      // Attempt to connect to the server with multiple retries
      const preheatResult = await wakeServer(
        serverUrl,
        5,  // maxAttempts
        10000, // delayMs - 10 seconds between attempts
        updateProgress // progress callback
      );
      
      console.log('Server connection result:', preheatResult);
      
      if (!preheatResult.success) {
        throw new Error(preheatResult.message);
      }
      
      // Initialize Firebase after server connection
      await initializeFirebase();
      
      setIsPreheating(false);
      setIsInitialized(true);
      
      // Check for updates after initialization
      try {
        const updateInfo = await checkForUpdates();
        setUpdateAvailable(updateInfo.updateAvailable);
        setServerVersion(updateInfo.serverVersion);
      } catch (updateErr) {
        console.error('Failed to check for updates:', updateErr);
        // Don't set an error here, as the app can still function without update checks
      }
    } catch (err) {
      console.error('Failed to initialize Firebase:', err);
      setError('Failed to connect to any server.');
      setIsPreheating(false);
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  const retryInitialization = () => {
    setError(null);
    setIsInitialized(false);
    initialize();
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error}
        </Text>
        <Text style={styles.errorSubtext}>
          Please check your internet connection.
        </Text>
        <View style={styles.buttonContainer}>
          <Button 
            title="Retry Connection" 
            onPress={retryInitialization} 
            color="#6200ee"
          />
        </View>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size={40} color="#FF6347" />
        <Text style={styles.loadingText}>
          {isPreheating 
            ? `Connecting to server (Attempt ${preheatProgress}/5)...` 
            : 'Initializing...'}
        </Text>
      </View>
    );
  }

  // Close update dialog
  const handleCloseUpdateDialog = () => {
    setUpdateAvailable(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WatchlistProvider>
          <NotificationProvider>
            <ThemeProvider>
              {isInitialized && !error ? (
                <AppContent 
                  updateAvailable={updateAvailable}
                  serverVersion={serverVersion}
                  onCloseUpdateDialog={handleCloseUpdateDialog}
                />
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    {error}
                  </Text>
                  <Text style={styles.errorSubtext}>
                    The app requires either a local server or internet connection to the remote server.
                  </Text>
                  <View style={styles.buttonContainer}>
                    <Button 
                      title="Retry Connection" 
                      onPress={retryInitialization} 
                      color="#6200ee"
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.loadingContainer}>
                  <LoadingSpinner size={80} color="#FF6347" />
                  <Text style={styles.loadingText}>Connecting to server...</Text>
                </View>
              )}
            </ThemeProvider>
          </NotificationProvider>
        </WatchlistProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

// Update the styles to include new elements
const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8'
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold'
  },
  errorSubtext: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 16
  },
  buttonContainer: {
    width: '80%',
    maxWidth: 300
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8'
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center'
  }
});

export default App;