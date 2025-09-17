import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

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
        const token = localStorage.getItem('access_token');
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
          // Token expired or invalid
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/auth';
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
    auto_submission?: boolean;
    billing_address?: {
      street?: string;
      city?: string;
      country?: string;
      postal_code?: string;
    };
  }) {
    return this.client.put('/api/users/profile', profileData);
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
    page_title?: string;
    page_subtitle?: string;
    form_title?: string;
    submit_button_text?: string;
    font_family?: string;
  }) {
    return this.client.put('/api/opt-in-settings', settingsData);
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
      baseURL: this.client.defaults.baseURL || import.meta.env.VITE_API_URL,
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
    country: string;
    deposit_amount: number;
    source_url?: string;
    user_agent?: string;
    ip_address?: string;
  }) {
    // Create a new client instance without auth headers for public endpoints
    const publicClient = axios.create({
      baseURL: this.client.defaults.baseURL || import.meta.env.VITE_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return publicClient.post('/api/public/submissions', submissionData);
  }

  async resolveDomain(domain: string) {
    // Create a new client instance without auth headers for public endpoints
    const publicClient = axios.create({
      baseURL: this.client.defaults.baseURL || import.meta.env.VITE_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return publicClient.get(`/api/public/resolve-domain/${domain}`);
  }
}

export const apiClient = new ApiClient();
export default apiClient;
