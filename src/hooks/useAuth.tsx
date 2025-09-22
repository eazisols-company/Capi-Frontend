import { useState, useEffect, createContext, useContext } from "react";
import { apiClient } from "@/services/api";

interface User {
  _id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  account_id: string;
  phone?: string;
  system_currency?: string;
  timezone?: string;
  billing_address?: any;
  created_at: string;
  verified?: boolean;
  admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error: any }>;
  resetPassword: (token: string, newPassword: string, confirmPassword: string) => Promise<{ error: any }>;
  verifyEmail: (token: string) => Promise<{ error: any }>;
  resendVerificationEmail: (email: string) => Promise<{ error: any }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and validate
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          // Validate token by fetching current user
          const response = await apiClient.getCurrentUser();
          setUser(response.data.user);
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.login({ email, password });
      const { access_token, user } = response.data;
      
      // Store token and user data
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      return { error: { message: errorMessage } };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const registrationData = {
        email,
        password,
        first_name: metadata?.first_name || metadata?.firstName || '',
        last_name: metadata?.last_name || metadata?.lastName || ''
      };
      
      await apiClient.register(registrationData);
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      return { error: { message: errorMessage } };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    try {
      await apiClient.forgotPassword(email);
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to send reset email';
      return { error: { message: errorMessage } };
    }
  };

  const resetPassword = async (token: string, newPassword: string, confirmPassword: string) => {
    try {
      await apiClient.resetPassword({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to reset password';
      return { error: { message: errorMessage } };
    }
  };

  const verifyEmail = async (token: string) => {
    try {
      await apiClient.verifyEmail(token);
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to verify email';
      return { error: { message: errorMessage } };
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      await apiClient.resendVerificationEmail(email);
      return { error: null };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to resend verification email';
      return { error: { message: errorMessage } };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      setUser(response.data.user);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};