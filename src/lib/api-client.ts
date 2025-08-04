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
        // Try to get Cognito token from cookies (SSO)
        if (typeof window !== 'undefined') {
          try {
            // First check for Timeback access token in cookies
            const cookies = document.cookie.split(';');
            const timebackToken = cookies
              .find(cookie => cookie.trim().startsWith('timeback-access-token='))
              ?.split('=')[1];
            
            if (timebackToken) {
              config.headers.Authorization = `Bearer ${timebackToken}`;
            } else {
              // Fallback: check localStorage for any stored tokens
              const storageKey = 'timeback-auth-token';
              const storedToken = localStorage.getItem(storageKey);
              if (storedToken) {
                config.headers.Authorization = `Bearer ${storedToken}`;
              }
            }
          } catch (e) {
            // Ignore errors, server will handle auth via cookies
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
        const originalRequest = error.config as any;

        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401 && originalRequest) {
          // Prevent infinite loop - only retry once
          if (originalRequest._retry) {
            // Already retried, redirect to login
            if (typeof window !== 'undefined' && !originalRequest.url?.includes('/auth/')) {
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }

          // Don't try to refresh if this is already an auth request
          if (originalRequest.url?.includes('/auth/')) {
            // Don't redirect to login if we're already on the login page
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              // Clear any stored tokens
              localStorage.removeItem('timeback-auth-token');
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }

          // Mark this request as retried
          originalRequest._retry = true;

          // Check if we have a refresh token before trying to refresh
          const hasRefreshToken = document.cookie.includes('timeback-refresh-token');
          if (!hasRefreshToken) {
            // No refresh token, redirect to login
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              localStorage.removeItem('timeback-auth-token');
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }

          // Token might be expired, try to refresh
          try {
            await this.refreshToken();
            // Retry the original request
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              localStorage.removeItem('timeback-auth-token');
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