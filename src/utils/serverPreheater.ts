import axios from 'axios';

/**
 * Attempts to wake up a server with multiple retries
 * @param serverUrl The URL of the server to wake up
 * @param maxAttempts Maximum number of connection attempts (default: 5)
 * @param delayMs Delay between attempts in milliseconds (default: 10000)
 * @param onProgressUpdate Optional callback to update progress
 * @returns Promise resolving to an object with success status and message
 */
export const wakeServer = async (
  serverUrl: string,
  maxAttempts: number = 5,
  delayMs: number = 10000,
  onProgressUpdate?: (attempt: number) => void
): Promise<{ success: boolean; message: string; attempt: number }> => {
  let attempt = 1;
  
  // Function to create a delay
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Try the remote server first with multiple attempts
  while (attempt <= maxAttempts) {
    try {
      console.log(`Connecting to server (Attempt ${attempt}/${maxAttempts})...`);
      
      // Update progress if callback provided
      if (onProgressUpdate) {
        onProgressUpdate(attempt);
      }
      
      // Use a shorter timeout for the actual connection attempt
      const response = await axios.get(serverUrl, { timeout: 3000 });
      
      if (response.status === 200) {
        return { 
          success: true, 
          message: `Connected successfully on attempt ${attempt}`, 
          attempt 
        };
      }
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error);
      // Continue to next attempt
    }
    
    // Increment attempt counter
    attempt++;
    
    // Wait before next attempt (but not after the last attempt)
    if (attempt <= maxAttempts) {
      await delay(delayMs);
    }
  }
  
  // If we reach here, all remote server attempts failed
  // Try local server as fallback
  try {
    console.log('Trying local server as fallback...');
    
    // Update progress for local server attempt if callback provided
    if (onProgressUpdate) {
      onProgressUpdate(maxAttempts + 1);
    }
    
    const localUrl = process.env.EXPO_PUBLIC_LOCAL_API_URL || 'http://localhost:3000';
    // Use a shorter timeout for the actual connection attempt
    const response = await axios.get(localUrl, { timeout: 3000 });
    
    if (response.status === 200) {
      return { 
        success: true, 
        message: 'Connected to local server successfully', 
        attempt: maxAttempts + 1 
      };
    }
  } catch (error) {
    console.log('Local server connection failed:', error);
  }
  
  // If we reach here, both remote and local attempts failed
  return { 
    success: false, 
    message: 'Failed to connect to any server. Please check your internet connection and try again.', 
    attempt: maxAttempts + 1 
  };
};