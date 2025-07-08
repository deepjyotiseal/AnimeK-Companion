import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'react-native';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  colors: {
    background: string;
    text: string;
    secondaryText: string;
    card: string;
    border: string;
    primary: string;
    danger: string;
    statusBar: 'dark-content' | 'light-content';
  };
}

const defaultColors = {
  light: {
    background: '#FFFFFF',
    text: '#000000',
    secondaryText: '#666666',
    card: '#F5F5F5',
    border: '#F0F0F0',
    primary: '#FF0000',
    danger: '#FF3B30',
    statusBar: 'dark-content' as const,
  },
  dark: {
    background: '#121212',
    text: '#FFFFFF',
    secondaryText: '#AAAAAA',
    card: '#1E1E1E',
    border: '#2C2C2C',
    primary: '#FF5252',
    danger: '#FF453A',
    statusBar: 'light-content' as const,
  },
};

const THEME_STORAGE_KEY = 'anime_companion_theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('light');

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setThemeState(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    
    loadTheme();
  }, []);

  // Update StatusBar when theme changes
  useEffect(() => {
    StatusBar.setBarStyle(defaultColors[theme].statusBar);
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const value = {
    theme,
    isDarkMode: theme === 'dark',
    toggleTheme,
    setTheme,
    colors: defaultColors[theme],
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};