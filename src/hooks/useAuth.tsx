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

interface LoggedInCustomerInfo {
  id: string;
  email: string;
  name: string;
}

const extractLoggedInCustomerInfo = (rawCustomer: any): LoggedInCustomerInfo | null => {
  if (!rawCustomer) {
    return null;
  }

  const customerId: string | undefined = rawCustomer?._id || rawCustomer?.id || rawCustomer?.account_id;

  if (!customerId) {
    return null;
  }

  const email: string = typeof rawCustomer?.email === 'string' ? rawCustomer.email : '';
  const firstName: string = typeof rawCustomer?.first_name === 'string' ? rawCustomer.first_name : '';
  const lastName: string = typeof rawCustomer?.last_name === 'string' ? rawCustomer.last_name : '';
  const nameField: string = typeof rawCustomer?.name === 'string' ? rawCustomer.name : '';

  const fullName = `${firstName} ${lastName}`.trim();
  const name = fullName || nameField || email || customerId;

  return {
    id: customerId,
    email,
    name,
  };
};

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
  switchBackToAdminFromCustomer: () => Promise<void>;
  isImpersonating: boolean;
  originalAdminUser: User | null;
  isCustomerLoggedIn: boolean;
  getLoggedInCustomerInfo: () => LoggedInCustomerInfo | null;
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
            const userData = response.data.user;
            
            // Also fetch profile to get timezone and other profile-specific fields
            try {
              const profileResponse = await apiClient.getProfile();
              const profileData = profileResponse.data.profile;
              
              // Merge profile data (timezone, etc.) into user object
              const mergedUser = {
                ...userData,
                timezone: profileData.timezone,
                system_currency: profileData.system_currency,
                phone: profileData.phone,
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                country_code: profileData.country_code,
                billing_address: profileData.billing_address,
              };
              
              setUser(mergedUser);
            } catch (profileError) {
              console.error('Error fetching customer profile:', profileError);
              // Still set user even if profile fetch fails
              setUser(userData);
            }
            
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
            const userData = response.data.user;
            
            // Also fetch profile to get timezone and other profile-specific fields
            try {
              const profileResponse = await apiClient.getProfile();
              const profileData = profileResponse.data.profile;
              
              // Merge profile data (timezone, etc.) into user object
              const mergedUser = {
                ...userData,
                timezone: profileData.timezone,
                system_currency: profileData.system_currency,
                phone: profileData.phone,
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                country_code: profileData.country_code,
                billing_address: profileData.billing_address,
              };
              
              setUser(mergedUser);
            } catch (profileError) {
              console.error('Error fetching profile during auth check:', profileError);
              // Still set user even if profile fetch fails
              setUser(userData);
            }
            
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
      const { access_token, user: userData } = response.data;
      
      // Store token
      localStorage.setItem('access_token', access_token);
      
      // Fetch profile to get timezone and other profile-specific fields
      try {
        const profileResponse = await apiClient.getProfile();
        const profileData = profileResponse.data.profile;
        
        // Merge profile data (timezone, etc.) into user object
        const mergedUser = {
          ...userData,
          timezone: profileData.timezone,
          system_currency: profileData.system_currency,
          phone: profileData.phone,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          country_code: profileData.country_code,
          billing_address: profileData.billing_address,
        };
        
        localStorage.setItem('user', JSON.stringify(mergedUser));
        setUser(mergedUser);
      } catch (profileError) {
        console.error('Error fetching profile during login:', profileError);
        // Still set user even if profile fetch fails
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
      
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
        last_name: metadata?.last_name || metadata?.lastName || '',
        phone: metadata?.phone || '',
        country_code: metadata?.country_code || '',
        system_currency: metadata?.system_currency || '',
        timezone: metadata?.timezone || ''
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
      const userData = response.data.user;
      
      // Also fetch profile to get timezone and other profile-specific fields
      try {
        const profileResponse = await apiClient.getProfile();
        const profileData = profileResponse.data.profile;
        
        // Merge profile data (timezone, etc.) into user object
        const mergedUser = {
          ...userData,
          timezone: profileData.timezone,
          system_currency: profileData.system_currency,
          phone: profileData.phone,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          country_code: profileData.country_code,
          billing_address: profileData.billing_address,
        };
        
        setUser(mergedUser);
      } catch (profileError) {
        console.error('Error fetching profile:', profileError);
        // Still set user even if profile fetch fails
        setUser(userData);
      }
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
        try {
          const storedCustomer = localStorage.getItem('customer_user');
          const storedToken = localStorage.getItem('customer_access_token');
          const storedAdminInfo = localStorage.getItem('admin_logged_in_customer_info');
          const storedAdminRaw = localStorage.getItem('admin_logged_in_customer_raw');

          if (storedCustomer) {
            const parsedCustomer = JSON.parse(storedCustomer);
            const existingCustomerId: string | undefined = parsedCustomer?._id || parsedCustomer?.id || parsedCustomer?.account_id;

            if (existingCustomerId && existingCustomerId === customerId && storedToken) {
              const info = extractLoggedInCustomerInfo(parsedCustomer);
              if (info) {
                localStorage.setItem('admin_logged_in_customer_info', JSON.stringify(info));
              }
              localStorage.setItem('admin_logged_in_customer_raw', storedCustomer);

              return {
                data: {
                  access_token: storedToken,
                  customer: parsedCustomer,
                },
                error: null,
              };
            }
          }

          if (storedAdminInfo && storedToken) {
            try {
              const parsedInfo: LoggedInCustomerInfo = JSON.parse(storedAdminInfo);
              if (parsedInfo.id === customerId) {
                let customerPayload: any = parsedInfo;
                if (storedAdminRaw) {
                  try {
                    const parsedRaw = JSON.parse(storedAdminRaw);
                    if (parsedRaw && (parsedRaw._id || parsedRaw.id || parsedRaw.account_id)) {
                      customerPayload = parsedRaw;
                    }
                  } catch (rawError) {
                    console.warn('Unable to parse stored admin customer raw data:', rawError);
                  }
                }

                return {
                  data: {
                    access_token: storedToken,
                    customer: customerPayload,
                  },
                  error: null,
                };
              }
            } catch (infoError) {
              console.warn('Unable to parse stored admin customer info:', infoError);
            }
          }
        } catch (reuseError) {
          console.warn('Unable to reuse existing customer session:', reuseError);
        }

        return {
          data: null,
          error: {
            message: 'You already have a customer session active. Please logout the current customer first.'
          }
        };
      }

      // Get customer data and create a temporary session
      const response = await apiClient.loginAsCustomer(customerId);
      const responseData = response.data;
      const info = extractLoggedInCustomerInfo(responseData?.customer);

      if (info) {
        localStorage.setItem('admin_logged_in_customer_info', JSON.stringify(info));
      }
      if (responseData?.customer) {
        localStorage.setItem('admin_logged_in_customer_raw', JSON.stringify(responseData.customer));
      }
      
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

  const switchBackToAdminFromCustomer = async () => {
    try {
      // Check if we're in a customer session
      const isCustomerSession = sessionStorage.getItem('is_customer_session') === 'true';
      
      if (!isCustomerSession) {
        console.error('Not in a customer session');
        return;
      }

      // Clear customer session data
      localStorage.removeItem('customer_access_token');
      localStorage.removeItem('customer_user');
      sessionStorage.removeItem('is_customer_session');
      localStorage.removeItem('admin_has_customer_session');
      localStorage.removeItem('admin_logged_in_customer_info');
      localStorage.removeItem('admin_logged_in_customer_raw');
      setHasActiveCustomerSession(false);
      
      // Clear current user state
      setUser(null);
      setOriginalAdminUser(null);
      setIsImpersonating(false);
      
      // Try to close the current tab (customer tab) and return to admin dashboard
      // If window.close() doesn't work (some browsers prevent it), redirect to auth page
      try {
        window.close();
        // If we reach this line, the window didn't close, so redirect as fallback
        setTimeout(() => {
          window.location.href = '/auth';
        }, 100);
      } catch (closeError) {
        // Fallback: redirect to auth page if closing fails
        window.location.href = '/auth';
      }
      
    } catch (error) {
      console.error('Error switching back to admin from customer session:', error);
    }
  };

  // Check if admin has logged in as any customer (from admin's perspective)
  const isCustomerLoggedIn = () => {
    return hasActiveCustomerSession;
  };

  // Get logged in customer info (from admin's perspective)
  const getLoggedInCustomerInfo = () => {
    if (!hasActiveCustomerSession) {
      return null;
    }

    const customerUser = localStorage.getItem('customer_user');
    if (customerUser) {
      try {
        const rawCustomer = JSON.parse(customerUser);
        const info = extractLoggedInCustomerInfo(rawCustomer);
        if (info) {
          localStorage.setItem('admin_logged_in_customer_info', JSON.stringify(info));
          localStorage.setItem('admin_logged_in_customer_raw', JSON.stringify(rawCustomer));
          return info;
        }
      } catch (error) {
        console.warn('Unable to parse customer_user for logged in info:', error);
      }
    }

    const storedAdminInfo = localStorage.getItem('admin_logged_in_customer_info');
    if (storedAdminInfo) {
      try {
        return JSON.parse(storedAdminInfo) as LoggedInCustomerInfo;
      } catch (error) {
        console.warn('Unable to parse admin_logged_in_customer_info:', error);
        localStorage.removeItem('admin_logged_in_customer_info');
        localStorage.removeItem('admin_logged_in_customer_raw');
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
    switchBackToAdminFromCustomer,
    isImpersonating,
    originalAdminUser,
    isCustomerLoggedIn: hasActiveCustomerSession,
    getLoggedInCustomerInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};