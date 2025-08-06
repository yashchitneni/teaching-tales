'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// NOTE: SSO class is deprecated - we use server-side auth only
// import { sso } from '@/lib/auth/timeback-sso';  // DEPRECATED
import { authEvents } from '@/lib/auth/auth-events';

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      // ONLY use server-side authentication via HttpOnly cookies
      const response = await fetch('/api/auth/me', {
        credentials: 'include'  // Includes HttpOnly cookies
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.user) {
          console.log('[AuthContext] Authenticated user:', data.data.user);
          setUser(data.data.user);
        } else {
          console.log('[AuthContext] No user in response');
          setUser(null);
        }
      } else if (response.status === 401) {
        console.log('[AuthContext] Not authenticated');
        setUser(null);
      } else {
        console.error('[AuthContext] Auth check failed with status:', response.status);
        setUser(null);
      }
    } catch (error) {
      console.error('[AuthContext] Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('[AuthContext] Login called with:', { email, password: '***' });
    try {
      // Use server API route which sets HttpOnly cookies
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('[AuthContext] Login response:', data);
      
      if (data.success && data.data && data.data.user) {
        console.log('[AuthContext] Login successful, setting user');
        setUser(data.data.user);
        return { success: true };
      }
      
      console.log('[AuthContext] Login failed');
      return { success: false, error: data.error?.message || 'Invalid credentials' };
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  };

  useEffect(() => {
    checkAuth();
    
    // Listen for logout events from other tabs/windows or 401 responses
    const unsubscribe = authEvents.onLogout(() => {
      setUser(null);
      setIsLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      // Use server-side logout
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        console.log('[AuthContext] Logout successful');
      }
      
      setUser(null);
      // Emit logout event for other tabs/windows
      authEvents.emitLogout();
    } catch (error) {
      console.error('[AuthContext] Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
