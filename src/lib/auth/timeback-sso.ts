// ⚠️ DEPRECATED - DO NOT USE THIS FILE
// 
// This SSO implementation uses localStorage which is insecure (XSS vulnerable).
// The application now uses server-side authentication with HttpOnly cookies.
// 
// See: docs/AUTHENTICATION_ARCHITECTURE.md for the correct approach
// 
// Migration Guide:
// - Use /api/auth/* endpoints instead of SSO class methods
// - Remove all getAuthToken() calls
// - Update API clients to use relative URLs through Next.js proxy
// 
// This file is kept temporarily for reference during migration

/**
 * Minimal TimeBack SSO SDK
 */

interface SSOConfig {
  apiBaseUrl: string;
  storageKey?: string;
  autoCheck?: boolean;
}

interface SSOUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

interface CheckSessionResult {
  authenticated: boolean;
  token?: string;
  user?: SSOUser;
}

class TimeBackSSO {
  private config: Required<SSOConfig>;
  private fingerprint: string | null = null;

  constructor(config: SSOConfig) {
    this.config = {
      apiBaseUrl: config.apiBaseUrl.replace(/\/$/, ''),
      storageKey: config.storageKey || 'timeback_token',
      autoCheck: config.autoCheck ?? true,
    };

    if (this.config.autoCheck && typeof window !== 'undefined') {
      this.checkSession();
    }
  }

  /**
   * Generate a simple but stable device fingerprint
   */
  private async getFingerprint(): Promise<string> {
    if (this.fingerprint) return this.fingerprint;

    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      // Add canvas fingerprint for more uniqueness
      await this.getCanvasFingerprint(),
    ];

    // Simple hash function
    const hash = components.join('|');
    this.fingerprint = btoa(hash).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    return this.fingerprint;
  }

  /**
   * Canvas fingerprinting for additional uniqueness
   */
  private async getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';

      canvas.width = 200;
      canvas.height = 50;
      
      // Draw test string with various styles
      ctx.textBaseline = 'top';
      ctx.font = '14px "Arial"';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('TimeBack SSO 🔐', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('TimeBack SSO 🔐', 4, 17);

      return canvas.toDataURL().substring(0, 100);
    } catch {
      return 'canvas-error';
    }
  }

  /**
   * @deprecated Use server-side auth via /api/auth/me instead
   * Get stored token
   */
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.config.storageKey);
  }

  /**
   * @deprecated Tokens are now stored in HttpOnly cookies server-side
   * Store token
   */
  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.config.storageKey, token);
  }

  /**
   * Clear stored token
   */
  clearToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.config.storageKey);
  }

  /**
   * Make authenticated request
   */
  async request(path: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    
    const headers = new Headers(options.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    return fetch(`${this.config.apiBaseUrl}${path}`, {
      ...options,
      headers,
    });
  }

  /**
   * @deprecated Use fetch('/api/auth/login') instead
   * Login with email and password
   */
  async login(email: string, password: string): Promise<{
    success: boolean;
    user?: SSOUser;
    token?: string;
    error?: string;
  }> {
    console.log('[SSO] Login method called with:', { email, password: '***' });
    try {
      console.log('[SSO] Getting fingerprint...');
      const fingerprint = await this.getFingerprint();
      console.log('[SSO] Fingerprint:', fingerprint);
      
      const url = `${this.config.apiBaseUrl}/api/auth/login`;
      console.log('[SSO] Making request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fingerprint,
        }),
      });

      console.log('[SSO] Response status:', response.status);
      console.log('[SSO] Response ok:', response.ok);

      const data = await response.json();
      console.log('[SSO] Response data:', data);

      // Handle the actual API response format: {"success":true,"data":{"accessToken":"...","idToken":"..."}}
      if (response.ok && data.success && data.data && data.data.accessToken) {
        console.log('[SSO] Login successful, setting token');
        const token = data.data.accessToken;
        this.setToken(token);
        
        // Extract user info from idToken if available, or create basic user object
        let user = null;
        if (data.data.idToken) {
          try {
            // Decode the JWT payload (basic decode, not verification)
            const payload = JSON.parse(atob(data.data.idToken.split('.')[1]));
            user = {
              id: payload.sub || payload['cognito:username'] || 'unknown',
              email: payload.email || 'unknown',
              name: payload.name || null,
              role: 'user' // Default role
            };
          } catch (e) {
            console.warn('[SSO] Could not decode idToken:', e);
            user = {
              id: 'unknown',
              email: 'unknown',
              name: null,
              role: 'user'
            };
          }
        }
        
        return {
          success: true,
          user: user,
          token: token,
        };
      }

      console.log('[SSO] Login failed - no success or no access token');
      return {
        success: false,
        error: data.message || 'Login failed',
      };
    } catch (error) {
      console.error('[SSO] Network error during login:', error);
      return {
        success: false,
        error: 'Network error during login',
      };
    }
  }

  /**
   * Check for existing SSO session
   */
  async checkSession(): Promise<CheckSessionResult> {
    const token = this.getToken();
    if (!token) {
      return { authenticated: false };
    }

    try {
      const response = await this.request('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        return {
          authenticated: true,
          token,
          user: data.user,
        };
      } else {
        // Token is invalid, clear it
        this.clearToken();
        return { authenticated: false };
      }
    } catch (error) {
      return { authenticated: false };
    }
  }

  /**
   * Logout current session
   */
  async logout(revokeAllSessions = false): Promise<{ success: boolean }> {
    try {
      const fingerprint = await this.getFingerprint();
      
      await this.request('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({
          fingerprint,
          revokeAllSessions,
        }),
      });

      this.clearToken();
      return { success: true };
    } catch (error) {
      // Clear token even if logout request fails
      this.clearToken();
      return { success: true };
    }
  }
}

import { API_CONFIG } from '@/lib/config';

// Initialize the SSO client
export const sso = new TimeBackSSO({
  apiBaseUrl: API_CONFIG.BASE_URL,
  autoCheck: true,
});

/**
 * @deprecated DO NOT USE - Tokens are in HttpOnly cookies
 * This function will always return null in the new architecture.
 * Use server-side proxy routes instead.
 */
export function getAuthToken(): string | null {
  console.warn('getAuthToken() is deprecated. Use server-side proxy routes instead.');
  return null;  // Always return null to force migration
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
