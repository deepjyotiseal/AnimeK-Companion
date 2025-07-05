import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import AnimeDetailScreen from '../screens/AnimeDetailScreen';
import AboutScreen from '../screens/AboutScreen';
import SupportScreen from '../screens/SupportScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import { DonationNavigator } from '../components/DonationNavigator';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  AnimeDetail: { 
    animeId: number;
    initialTab?: 'staff' | 'related' | 'reviews';
  };
  About: undefined;
  Support: undefined;
  EditProfile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { user, isLoading } = useAuth();
  const { isDarkMode, colors } = useTheme();
  
  // Create custom theme based on our ThemeContext colors
  const customTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  if (isLoading) {
    // You could return a splash screen here
    return null;
  }

  return (
    <NavigationContainer theme={customTheme}>
      {/* DonationNavigator must be inside NavigationContainer */}
      <>
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}>
          {user ? (
            <>
              <Stack.Screen name="Main" component={TabNavigator} />
              <Stack.Screen
                name="AnimeDetail"
                component={AnimeDetailScreen}
                options={{
                  headerShown: true,
                  title: '',
                  headerBackTitle: 'Back',
                  headerTintColor: '#FF0000',
                }}
              />
              <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: true, title: 'About' }} />
              <Stack.Screen name="Support" component={SupportScreen} options={{ headerShown: true, title: 'Support Development' }} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: true, title: 'Edit Profile' }} />
            </>
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          )}
        </Stack.Navigator>
        {/* Import DonationNavigator from components */}
        {user && <DonationNavigator />}
      </>
    </NavigationContainer>
  );
};