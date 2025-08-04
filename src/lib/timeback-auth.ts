import axios from 'axios';

// Timeback API configuration
const TIMEBACK_API_URL = process.env.NEXT_PUBLIC_TIMEBACK_API_URL || 'https://core.timebackapi.com';

interface TimebackLoginResponse {
  success: boolean;
  data?: {
    accessToken: string;
    idToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
  error?: {
    message: string;
  };
}

interface TimebackUserResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      cognitoId: string;
      role: string;
    };
    authMethod: string;
    message: string;
  };
  error?: {
    message: string;
  };
}

// Login through Timeback API
export async function loginWithTimeback(email: string, password: string): Promise<TimebackLoginResponse> {
  try {
    const response = await axios.post(
      `${TIMEBACK_API_URL}/api/auth/login`,
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true, // Important for cookies
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}

// Validate token with Timeback API
export async function validateTimebackToken(token: string): Promise<TimebackUserResponse> {
  try {
    const response = await axios.get(
      `${TIMEBACK_API_URL}/api/auth/me`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}

// Refresh token through Timeback API
export async function refreshTimebackToken(refreshToken: string): Promise<TimebackLoginResponse> {
  try {
    const response = await axios.post(
      `${TIMEBACK_API_URL}/api/auth/refresh`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}

// Logout through Timeback API
export async function logoutFromTimeback(): Promise<void> {
  try {
    await axios.post(
      `${TIMEBACK_API_URL}/api/auth/logout`,
      {},
      {
        withCredentials: true,
      }
    );
  } catch (error) {
    // Ignore logout errors
    console.error('Logout error:', error);
  }
}

// Get SSO cookie options (same domain for both apps)
export function getTimebackSSOCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    // If both apps are on same domain, cookies will be shared
    ...(process.env.SSO_COOKIE_DOMAIN && {
      domain: process.env.SSO_COOKIE_DOMAIN
    })
  };
}