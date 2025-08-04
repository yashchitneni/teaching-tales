import axios, { type AxiosInstance, type AxiosError } from 'axios';

interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

interface OneRosterUser {
  sourcedId: string;
  status: 'active' | 'tobedeleted';
  dateLastModified: string;
  metadata?: Record<string, unknown>;
  username: string;
  userIds?: Array<{ type: string; identifier: string }>;
  enabledUser: boolean;
  givenName: string;
  familyName: string;
  middleName?: string;
  role: 'student' | 'teacher' | 'parent' | 'guardian' | 'relative' | 'aide' | 'administrator';
  identifier?: string;
  email: string;
  sms?: string;
  phone?: string;
  agents?: Array<{ sourcedId: string; agentSourcedId: string }>;
  grades?: string[];
  password?: string;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important for HttpOnly cookies
    });

    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Try to get Supabase session token for backward compatibility
        if (typeof window !== 'undefined') {
          try {
            // Look for Supabase session in localStorage
            // The key format is sb-[project-ref]-auth-token
            const storageKey = 'sb-gccgwmuyzlsazkliswjp-auth-token';
            const storedSession = localStorage.getItem(storageKey);
            if (storedSession) {
              const session = JSON.parse(storedSession);
              if (session?.access_token) {
                config.headers.Authorization = `Bearer ${session.access_token}`;
              }
            }
          } catch (e) {
            // Ignore errors, cookie auth will be used as fallback
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config;

        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401 && originalRequest) {
          // Token might be expired, try to refresh
          try {
            await this.refreshToken();
            // Retry the original request
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        // Handle other errors
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'An unexpected error occurred';

        return Promise.reject(new Error(errorMessage));
      }
    );
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/auth/logout');
    return response.data;
  }

  async refreshToken() {
    const response = await this.client.post('/auth/refresh');
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // OneRoster endpoints
  async createOneRosterUser(userData: OneRosterUser) {
    const response = await this.client.post('/ims/oneroster/v1p1/users', userData);
    return response.data;
  }

  async getOneRosterUsers(params?: {
    limit?: number;
    offset?: number;
    filter?: string;
    orderBy?: string;
  }) {
    const response = await this.client.get('/ims/oneroster/v1p1/users', { params });
    return response.data;
  }

  async getOneRosterUser(sourcedId: string) {
    const response = await this.client.get(`/ims/oneroster/v1p1/users/${sourcedId}`);
    return response.data;
  }

  async updateOneRosterUser(sourcedId: string, userData: Partial<OneRosterUser>) {
    const response = await this.client.put(`/ims/oneroster/v1p1/users/${sourcedId}`, userData);
    return response.data;
  }

  // Generic request method for custom endpoints
  async request(method: string, url: string, data?: unknown, config?: Record<string, unknown>) {
    const response = await this.client.request({
      method,
      url,
      data,
      ...config,
    });
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types
export type { ApiError };