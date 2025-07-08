import React, { createContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { isServerAvailable } from '../api/firebaseApi';


interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Initialize auth state listener
  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      setUser(user);
      setIsLoading(false);
      setAuthInitialized(true);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Only check server availability if we're not already logged in
      if (!auth.currentUser) {
        const serverAvailable = await isServerAvailable();
        if (!serverAvailable) {
          throw new Error('Server is not available. Please check your internet connection and try again.');
        }
      }
      
      // Attempt to sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      // Check if server is available before attempting signup
      const serverAvailable = await isServerAvailable();
      if (!serverAvailable) {
        throw new Error('Server is not available. Please ensure the local server is running.');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        setUser(userCredential.user);
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // No need to check server availability for logout as it's a client-side operation
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Check if server is available before attempting password reset
      const serverAvailable = await isServerAvailable();
      if (!serverAvailable) {
        throw new Error('Server is not available. Please ensure the local server is running.');
      }
      
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const updateData: { displayName: string; photoURL?: string } = { displayName };
      if (photoURL !== undefined) {
        updateData.photoURL = photoURL;
      }
      
      await updateProfile(auth.currentUser, updateData);
      
      // Update the local user state to reflect changes immediately
      setUser(auth.currentUser);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        resetPassword,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
