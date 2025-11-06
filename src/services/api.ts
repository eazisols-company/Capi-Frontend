import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add JWT token
    this.client.interceptors.request.use(
      (config) => {
        // Check if this is a customer session
        const isCustomerSession = sessionStorage.getItem('is_customer_session') === 'true';
        const token = isCustomerSession 
          ? localStorage.getItem('customer_access_token')
          : localStorage.getItem('access_token');
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Only redirect on 401 for authenticated endpoints, not login attempts
          const isLoginEndpoint = error.config?.url?.includes('/api/auth/login');
          const isRegisterEndpoint = error.config?.url?.includes('/api/auth/register');
          
          if (!isLoginEndpoint && !isRegisterEndpoint) {
            // Token expired or invalid - only clear and redirect for authenticated requests
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            window.location.href = '/auth';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck() {
    return this.client.get('/health');
  }

  // Authentication methods
  async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) {
    return this.client.post('/api/auth/register', userData);
  }

  async login(credentials: { email: string; password: string }) {
    return this.client.post('/api/auth/login', credentials);
  }

  async getCurrentUser() {
    return this.client.get('/api/auth/me');
  }

  async forgotPassword(email: string) {
    return this.client.post('/api/auth/forgot-password', { email });
  }

  async resetPassword(resetData: {
    token: string;
    new_password: string;
    confirm_password: string;
  }) {
    return this.client.post('/api/auth/reset-password', resetData);
  }

  async verifyEmail(token: string) {
    return this.client.post('/api/auth/verify-email', { token });
  }

  async resendVerificationEmail(email: string) {
    return this.client.post('/api/auth/resend-verification', { email });
  }

  async changePassword(passwordData: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) {
    return this.client.put('/api/users/change-password', passwordData);
  }

  // User profile methods
  async getProfile() {
    return this.client.get('/api/users/profile');
  }

  async updateProfile(profileData: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    system_currency?: string;
    timezone?: string;
    auto_submission?: boolean;
    billing_address?: {
      street?: string;
      city?: string;
      country?: string;
      postal_code?: string;
    };
  }) {
    // Ensure system_currency is never sent in the payload
    const { system_currency, ...sanitizedProfileData } = profileData as any;
    return this.client.put('/api/users/profile', sanitizedProfileData);
  }

  // Connections methods
  async getConnections() {
    return this.client.get('/api/connections');
  }

  async createConnection(connectionData: {
    name: string;
    pixel_id: string;
    pixel_access_token: string;
    countries: Array<{ country: string; value: number }>;
    submission_link?: string;
    use_custom_domain?: boolean;
    custom_domain?: string;
  }) {
    return this.client.post('/api/connections', connectionData);
  }

  async updateConnection(connectionId: string, connectionData: any) {
    return this.client.put(`/api/connections/${connectionId}`, connectionData);
  }

  async deleteConnection(connectionId: string) {
    return this.client.delete(`/api/connections/${connectionId}`);
  }

  async testConnection(connectionId: string) {
    return this.client.post(`/api/connections/${connectionId}/test`);
  }

  // Submissions methods
  async getSubmissions(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    country?: string;
    connection_id?: string;
    start_date?: string;
    end_date?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = queryParams.toString() 
      ? `/api/submissions?${queryParams.toString()}` 
      : '/api/submissions';
    
    return this.client.get(url);
  }

  async createSubmission(submissionData: {
    connection_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country: string;
    deposit_amount: number;
  }) {
    return this.client.post('/api/submissions', submissionData);
  }

  async submitToMeta(submissionId: string) {
    return this.client.put(`/api/submissions/${submissionId}/submit-to-meta`);
  }

  async updateSubmission(submissionId: string, submissionData: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    country?: string;
    deposit_amount?: number;
    currency?: string;
    custom_event_name?: string;
    commission_amount?: number;
    commission_currency?: string;
    commission_tier?: string;
    platform_name?: string;
    event_sent_to?: string;
  }) {
    return this.client.put(`/api/submissions/${submissionId}`, submissionData);
  }

  async exportSubmissions(params?: {
    status?: string;
    country?: string;
    connection_id?: string;
    custom_event_name?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
    format?: 'json' | 'csv';
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = queryParams.toString() 
      ? `/api/submissions/export?${queryParams.toString()}` 
      : '/api/submissions/export';
    
    // For CSV format, we need to return the response directly to handle blob
    if (params?.format === 'csv') {
      return this.client.get(url, { responseType: 'blob' });
    }
    
    return this.client.get(url);
  }

  // Analytics methods
  async getDashboardAnalytics(period: string = '7d') {
    return this.client.get(`/api/analytics/dashboard?period=${period}`);
  }

  // Opt-in settings methods
  async getOptInSettings(connectionId?: string) {
    const params = connectionId ? `?connection_id=${connectionId}` : '';
    return this.client.get(`/api/opt-in-settings${params}`);
  }

  async updateOptInSettings(settingsData: {
    connection_id?: string;
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
    uploaded_logo_url?: string;
    page_title?: string;
    page_subtitle?: string;
    form_title?: string;
    submit_button_text?: string;
    font_family?: string;
  }) {
    return this.client.put('/api/opt-in-settings', settingsData);
  }

  // Logo upload methods
  async uploadLogo(file: File, connectionId: string) {
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('connection_id', connectionId);
    
    return this.client.post('/api/opt-in-settings/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async deleteLogo(connectionId: string) {
    return this.client.delete(`/api/opt-in-settings/delete-logo/${connectionId}`);
  }

  // Public opt-in methods (no authentication required)
  async getPublicOptInSettings(connectionId?: string, domain?: string) {
    const params = new URLSearchParams();
    if (connectionId) params.append('connection_id', connectionId);
    if (domain) params.append('domain', domain);
    
    const url = params.toString() 
      ? `/api/public/optin-settings?${params.toString()}` 
      : '/api/public/optin-settings';
    
    // Create a new client instance without auth headers for public endpoints
    // Use the same base URL as the main client for consistency
    const publicClient = axios.create({
      baseURL: this.client.defaults.baseURL || API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return publicClient.get(url);
  }

  async createPublicSubmission(submissionData: {
    connection_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country_code: string;
    country: string;
    deposit_amount: number;
    deposit_currency?: string;
    source_url?: string;
    user_agent?: string;
    ip_address?: string;
    fbp?: string | null;
    fbc?: string | null;
  }) {
    // Create a new client instance without auth headers for public endpoints
    const publicClient = axios.create({
      baseURL: this.client.defaults.baseURL || API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return publicClient.post('/api/public/submissions', submissionData);
  }

  async resolveDomain(domain: string) {
    // Create a new client instance without auth headers for public endpoints
    const publicClient = axios.create({
      baseURL: this.client.defaults.baseURL || API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return publicClient.get(`/api/public/resolve-domain/${domain}`);
  }

  // Customer management methods (admin only)
  async getCustomers(params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = queryParams.toString() 
      ? `/api/users/customers?${queryParams.toString()}` 
      : '/api/users/customers';
    
    return this.client.get(url);
  }

  async loginAsCustomer(customerId: string) {
    return this.client.post('/api/admin/login-as-customer', { customer_id: customerId });
  }

  async updateVerificationStatus(customerId: string) {
    return this.client.put('/api/admin/update-verification-status', { customer_id: customerId });
  }

  async blockUnblockCustomer(customerId: string) {
    return this.client.put('/api/admin/block-unblock-customer', { customer_id: customerId });
  }

  async deleteCustomer(customerId: string) {
    return this.client.delete(`/api/users/customers/${customerId}`);
  }

  async updateCustomerLimits(customerId: string, limitsData: {
    max_connections: number;
    connections_expiry_date: string;
    connections_start_date?: string;
  }) {
    return this.client.put('/api/admin/update-customer-limits', {
      customer_id: customerId,
      max_connections: limitsData.max_connections,
      connections_expiry_date: limitsData.connections_expiry_date,
      connections_start_date: limitsData.connections_start_date
    });
  }

}

export const apiClient = new ApiClient();
export default apiClient;
