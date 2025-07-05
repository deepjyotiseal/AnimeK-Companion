import { APP_VERSION } from '../config/version';
import { getServerVersion } from '../api/firebaseApi';

/**
 * Compare version strings
 * @param version1 First version string
 * @param version2 Second version string
 * @returns -1 if version1 < version2, 0 if equal, 1 if version1 > version2
 */
export const compareVersions = (version1: string, version2: string): number => {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  // Compare each part of the version
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }
  
  return 0; // Versions are equal
};

/**
 * Check if an update is available
 * @returns Promise resolving to an object with update information
 */
export const checkForUpdates = async (): Promise<{ 
  updateAvailable: boolean; 
  serverVersion: string;
}> => {
  try {
    const serverVersion = await getServerVersion();
    
    // Compare versions
    const updateAvailable = compareVersions(APP_VERSION, serverVersion) < 0;
    
    return {
      updateAvailable,
      serverVersion
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    throw error;
  }
};