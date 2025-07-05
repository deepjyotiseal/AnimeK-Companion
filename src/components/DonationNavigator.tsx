import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation/AppNavigator';

/**
 * This component handles navigation to the Support screen when triggered by the donation dialog
 * It must be used inside the NavigationContainer
 */
export const DonationNavigator: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const checkNavigationFlag = async () => {
      try {
        const shouldNavigate = await AsyncStorage.getItem('navigate_to_support');
        if (shouldNavigate === 'true') {
          // Clear the flag first to prevent navigation loops
          await AsyncStorage.removeItem('navigate_to_support');
          
          // Navigate to Support screen
          navigation.navigate('Support');
        }
      } catch (error) {
        console.error('Error checking navigation flag:', error);
      }
    };
    
    // Check when component mounts
    checkNavigationFlag();
    
    // Also set up an interval to check periodically
    const intervalId = setInterval(checkNavigationFlag, 2000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [navigation]);

  // This component doesn't render anything
  return null;
};

export default DonationNavigator;