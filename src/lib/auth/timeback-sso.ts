import { API_CONFIG } from '@/lib/config';

// TimeBack SSO implementation based on reference app patterns
export class TimeBackSSO {
  private apiBaseUrl: string;
  private autoCheck: boolean;
  private token: string | null = null;

  constructor(config: { apiBaseUrl: string; autoCheck?: boolean }) {
    this.apiBaseUrl = config.apiBaseUrl;
    this.autoCheck = config.autoCheck ?? true;
    
    if (typeof window !== 'undefined') {
      this.token = this.getTokenFromStorage();
      
      if (this.autoCheck) {
        this.checkAuth();
      }
    }
  }

  private getTokenFromStorage(): string | null {
    // Check localStorage first
    const localToken = localStorage.getItem('timeback-auth-token');
    if (localToken) return localToken;
    
    // Check cookies
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => 
      cookie.trim().startsWith('timeback-access-token=')
    );
    
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
    
    return null;
  }

  private async checkAuth(): Promise<void> {
    if (!this.token) return;
    
    try {
      const response = await this.request('/api/auth/me');
      if (!response.ok) {
        this.clearToken();
      }
    } catch {
      this.clearToken();
    }
  }

  private clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('timeback-auth-token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.apiBaseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  }

  public async login(email: string, password: string): Promise<any> {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.success && data.data?.tokens?.accessToken) {
      this.token = data.data.tokens.accessToken;
      localStorage.setItem('timeback-auth-token', this.token!);
    }
    
    return data;
  }

  public async logout(): Promise<void> {
    if (this.token) {
      try {
        await this.request('/api/auth/logout', {
          method: 'POST',
        });
      } catch (error) {
        console.error('Logout API call failed:', error);
      }
    }
    
    this.clearToken();
  }

  public async getCurrentUser(): Promise<any> {
    if (!this.token) return null;
    
    const response = await this.request('/api/auth/me');
    return response.json();
  }

  public async refreshToken(): Promise<void> {
    const response = await this.request('/api/auth/refresh', {
      method: 'POST',
    });
    
    const data = await response.json();
    
    if (data.success && data.data?.accessToken) {
      this.token = data.data.accessToken;
      localStorage.setItem('timeback-auth-token', this.token);
    }
  }
}

// Initialize the SSO client
export const sso = new TimeBackSSO({
  apiBaseUrl: process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'http://localhost:8080',
  autoCheck: true,
});

// Helper to get the current auth token
export function getAuthToken(): string | null {
  return sso.getToken();
}

// Helper to check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    const response = await sso.request('/api/auth/me');
    return response.ok;
  } catch {
    return false;
  }
}
