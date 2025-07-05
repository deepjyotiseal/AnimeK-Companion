import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import WatchlistScreen from '../screens/WatchlistScreen';
import SuggestionsScreen from '../screens/SuggestionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HeaderLogo from '../components/common/HeaderLogo';

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Watchlist: undefined;
  Suggestions: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator = () => {
  const { colors } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Watchlist':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Suggestions':
              iconName = focused ? 'star' : 'star-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryText,
        headerTintColor: colors.primary,
        tabBarStyle: { backgroundColor: colors.card },
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: colors.text,
        },
        headerRight: () => <HeaderLogo />,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Discover',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Search',
        }}
      />
      <Tab.Screen
        name="Watchlist"
        component={WatchlistScreen}
        options={{
          title: 'My List',
        }}
      />
      <Tab.Screen
        name="Suggestions"
        component={SuggestionsScreen}
        options={{
          title: 'For You',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};
