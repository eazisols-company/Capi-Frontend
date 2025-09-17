import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { getDetectedTimezone } from '@/lib/timezone-utils';

interface TimezoneContextType {
  userTimezone: string;
  getUserTimezone: () => string;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

export const useTimezone = () => {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
};

interface TimezoneProviderProps {
  children: ReactNode;
}

export const TimezoneProvider = ({ children }: TimezoneProviderProps) => {
  const { user } = useAuth();

  const getUserTimezone = (): string => {
    // Priority: user profile timezone > detected timezone > UTC fallback
    return user?.timezone || getDetectedTimezone();
  };

  const userTimezone = getUserTimezone();

  const value = {
    userTimezone,
    getUserTimezone,
  };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
};

// Convenience hook that combines timezone with formatting functions
export const useDateFormatter = () => {
  const { userTimezone } = useTimezone();
  
  return {
    userTimezone,
    // These functions will be used directly from timezone-utils with the user's timezone
  };
};
