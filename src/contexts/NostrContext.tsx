import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { nostrService, NostrUser } from '@/lib/nostr';
import { toast } from 'sonner';

interface NostrContextType {
  user: NostrUser | null;
  isAuthenticated: boolean;
  login: (secretKey: string) => Promise<void>;
  logout: () => void;
  generateNewAccount: () => NostrUser;
  updateProfile: (profile: { lightningAddress?: string; nwcUri?: string }) => Promise<void>;
  isLoading: boolean;
}

const NostrContext = createContext<NostrContextType | undefined>(undefined);

export const useNostr = () => {
  const context = useContext(NostrContext);
  if (!context) {
    throw new Error('useNostr must be used within a NostrProvider');
  }
  return context;
};

interface NostrProviderProps {
  children: ReactNode;
}

export const NostrProvider: React.FC<NostrProviderProps> = ({ children }) => {
  const [user, setUser] = useState<NostrUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from storage on mount
    const savedUser = nostrService.getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (secretKey: string) => {
    try {
      setIsLoading(true);
      const loggedInUser = nostrService.loginWithSecretKey(secretKey);
      setUser(loggedInUser);
      toast.success('Successfully logged in with Nostr!');
    } catch (error) {
      toast.error('Failed to login. Please check your secret key.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    nostrService.logout();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const generateNewAccount = () => {
    const newUser = nostrService.generateKeypair();
    setUser(newUser);
    nostrService.loginWithSecretKey(Array.from(newUser.secretKey!).map(b => b.toString(16).padStart(2, '0')).join(''));
    toast.success('New Nostr account created!');
    return newUser;
  };

  const updateProfile = async (profile: { lightningAddress?: string; nwcUri?: string }) => {
    try {
      await nostrService.updateProfile(profile);
      setUser(prev => prev ? { ...prev, ...profile } : null);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const value: NostrContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    generateNewAccount,
    updateProfile,
    isLoading
  };

  return (
    <NostrContext.Provider value={value}>
      {children}
    </NostrContext.Provider>
  );
};