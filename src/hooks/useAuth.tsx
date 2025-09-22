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
  loginAsCustomer: (customerId: string) => Promise<{ error: any }>;
  switchBackToAdmin: () => Promise<void>;
  isImpersonating: boolean;
  originalAdminUser: User | null;
  isCustomerLoggedIn: boolean;
  getLoggedInCustomerInfo: () => { email: string; name: string } | null;
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
  const [originalAdminUser, setOriginalAdminUser] = useState<User | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [hasActiveCustomerSession, setHasActiveCustomerSession] = useState(false);

  // Monitor localStorage changes for customer session tracking
  useEffect(() => {
    const checkCustomerSession = () => {
      const hasSession = localStorage.getItem('admin_has_customer_session') === 'true';
      setHasActiveCustomerSession(hasSession);
    };

    // Check initially
    checkCustomerSession();

    // Listen for storage changes (when localStorage is modified from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin_has_customer_session') {
        checkCustomerSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also check periodically in case of same-tab changes
    const interval = setInterval(checkCustomerSession, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Check for existing token and validate
    const checkAuth = async () => {
      // Check for temporary session data in URL first - this is the highest priority
      const urlParams = new URLSearchParams(window.location.search);
      const tempSessionKey = urlParams.get('temp_session');
      
      if (tempSessionKey) {
        try {
          // Get temporary session data from sessionStorage
          const tempSessionData = sessionStorage.getItem(tempSessionKey);
          
          if (tempSessionData) {
            const sessionData = JSON.parse(tempSessionData);
            
            // Check if session is not too old (5 minutes max)
            const isExpired = Date.now() - sessionData.timestamp > 5 * 60 * 1000;
            
            if (!isExpired) {
              console.log('Setting up customer session from temp data:', sessionData.user.email);
              
              // Set customer session using separate keys to avoid conflict with admin
              localStorage.setItem('customer_access_token', sessionData.access_token);
              localStorage.setItem('customer_user', JSON.stringify(sessionData.user));
              // Use sessionStorage for the flag so it doesn't affect other tabs
              sessionStorage.setItem('is_customer_session', 'true');
              
              setUser(sessionData.user);
              setOriginalAdminUser(null);
              setIsImpersonating(false);
              
              // Clean up temporary session and URL immediately
              sessionStorage.removeItem(tempSessionKey);
              window.history.replaceState({}, document.title, window.location.pathname);
              
              setLoading(false);
              return;
            } else {
              // Session expired, clean up
              sessionStorage.removeItem(tempSessionKey);
            }
          }
        } catch (error) {
          console.error('Error parsing temporary session data:', error);
        }
      }
      
      // Regular authentication check
      const isCustomerSession = sessionStorage.getItem('is_customer_session') === 'true';
      
      if (isCustomerSession) {
        console.log('Customer session detected, loading customer data...');
        // Handle customer session
        const customerToken = localStorage.getItem('customer_access_token');
        const customerUser = localStorage.getItem('customer_user');
        
        if (customerToken && customerUser) {
          try {
            console.log('Customer token and user found, validating...');
            // Validate customer token by fetching current user
            const response = await apiClient.getCurrentUser();
            setUser(response.data.user);
            setOriginalAdminUser(null);
            setIsImpersonating(false);
            console.log('Customer session validated successfully');
          } catch (error) {
            console.error('Customer token validation failed:', error);
            // Customer token is invalid, clear storage
            localStorage.removeItem('customer_access_token');
            localStorage.removeItem('customer_user');
            sessionStorage.removeItem('is_customer_session');
            setUser(null);
            setOriginalAdminUser(null);
            setIsImpersonating(false);
          }
        } else {
          console.log('Customer token or user not found, clearing session');
          sessionStorage.removeItem('is_customer_session');
        }
      } else {
        // Handle admin session
        const token = localStorage.getItem('access_token');
        const storedUser = localStorage.getItem('user');
        const storedOriginalAdmin = localStorage.getItem('original_admin_user');
        const storedIsImpersonating = localStorage.getItem('is_impersonating');

        if (token && storedUser) {
          try {
            // Validate token by fetching current user
            const response = await apiClient.getCurrentUser();
            setUser(response.data.user);
            
            // Restore impersonation state if it exists
            if (storedOriginalAdmin && storedIsImpersonating === 'true') {
              setOriginalAdminUser(JSON.parse(storedOriginalAdmin));
              setIsImpersonating(true);
            }
          } catch (error) {
            // Token is invalid, clear storage
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            localStorage.removeItem('original_admin_user');
            localStorage.removeItem('is_impersonating');
            setUser(null);
            setOriginalAdminUser(null);
            setIsImpersonating(false);
          }
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
    // Check if this is a customer session
    const isCustomerSession = sessionStorage.getItem('is_customer_session') === 'true';
    
    if (isCustomerSession) {
      // Only clear customer session data
      localStorage.removeItem('customer_access_token');
      localStorage.removeItem('customer_user');
      sessionStorage.removeItem('is_customer_session');
      // Clear admin's customer session tracking when customer logs out
      localStorage.removeItem('admin_has_customer_session');
      setHasActiveCustomerSession(false);
    } else {
      // Only clear admin session data
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('original_admin_user');
      localStorage.removeItem('is_impersonating');
      // Also clear admin's customer session tracking when admin logs out
      localStorage.removeItem('admin_has_customer_session');
      setHasActiveCustomerSession(false);
    }
    
    setUser(null);
    setOriginalAdminUser(null);
    setIsImpersonating(false);
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

  const loginAsCustomer = async (customerId: string): Promise<{ data: any; error: null } | { data: null; error: any }> => {
    try {
      // Only allow admin users to impersonate customers
      if (!user?.admin) {
        return { data: null, error: { message: 'Only admin users can impersonate customers' } };
      }

      // Check if admin already has a customer session active
      if (localStorage.getItem('admin_has_customer_session') === 'true') {
        return { 
          data: null, 
          error: { 
            message: 'You already have a customer session active. Please logout the current customer first.' 
          } 
        };
      }

      // Get customer data and create a temporary session
      const response = await apiClient.loginAsCustomer(customerId);
      
      // Mark that admin has an active customer session
      localStorage.setItem('admin_has_customer_session', 'true');
      setHasActiveCustomerSession(true);
      
      return { data: response.data, error: null };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to login as customer';
      return { data: null, error: { message: errorMessage } };
    }
  };

  const switchBackToAdmin = async () => {
    try {
      if (!originalAdminUser || !isImpersonating) {
        return;
      }

      // Restore original admin session using stored token
      const adminToken = localStorage.getItem('admin_token');
      if (adminToken) {
        localStorage.setItem('access_token', adminToken);
        localStorage.setItem('user', JSON.stringify(originalAdminUser));
        setUser(originalAdminUser);
      }
      
      // Clear impersonation state
      localStorage.removeItem('original_admin_user');
      localStorage.removeItem('is_impersonating');
      localStorage.removeItem('admin_token');
      setOriginalAdminUser(null);
      setIsImpersonating(false);
    } catch (error) {
      console.error('Error switching back to admin:', error);
    }
  };

  // Check if admin has logged in as any customer (from admin's perspective)
  const isCustomerLoggedIn = () => {
    return hasActiveCustomerSession;
  };

  // Get logged in customer info (from admin's perspective)
  const getLoggedInCustomerInfo = () => {
    // Check if admin has an active customer session
    if (hasActiveCustomerSession) {
      const customerUser = localStorage.getItem('customer_user');
      if (customerUser) {
        try {
          const user = JSON.parse(customerUser);
          return {
            email: user.email,
            name: `${user.first_name} ${user.last_name}`
          };
        } catch (error) {
          return null;
        }
      }
    }
    return null;
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
    loginAsCustomer,
    switchBackToAdmin,
    isImpersonating,
    originalAdminUser,
    isCustomerLoggedIn: hasActiveCustomerSession,
    getLoggedInCustomerInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};