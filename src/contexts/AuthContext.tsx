'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { UserRole } from '@/lib/cognito-auth'

interface CognitoUser {
  id: string
  email: string
  cognitoId: string
  role: UserRole
  name?: string
}

interface AuthContextType {
  user: CognitoUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CognitoUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] signIn called for:', email)
    try {
      setLoading(true)
      const response = await apiClient.login(email, password)
      
      console.log('[AuthContext] Login response:', response)
      
      if (response.success && response.data) {
        const userData = response.data.user
        
        console.log('[AuthContext] Setting user data:', userData)
        
        // Set user data
        setUser({
          id: userData.id,
          email: userData.email,
          cognitoId: userData.cognitoId,
          role: userData.role,
          name: userData.name,
        })
        
        // Set up token refresh after successful login
        setupTokenRefresh()
        
        // Store tokens in localStorage for client-side access
        if (response.data.tokens) {
          localStorage.setItem('timeback-auth-token', response.data.tokens.accessToken)
        }
      }
    } catch (error) {
      console.error('[AuthContext] Sign in error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Set up automatic token refresh
  const setupTokenRefresh = () => {
    // Clear any existing interval
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }

    // Set up new interval to refresh token every 45 minutes (before 1-hour expiry)
    const interval = setInterval(async () => {
      try {
        // Only refresh if we have a refresh token
        const hasRefreshToken = document.cookie.includes('timeback-refresh-token')
        if (hasRefreshToken) {
          await apiClient.refreshToken()
        }
      } catch (error) {
        console.error('Token refresh failed:', error)
        // If refresh fails, sign out the user
        await signOut()
      }
    }, 45 * 60 * 1000) // 45 minutes

    setRefreshInterval(interval)
  }

  useEffect(() => {
    // Prevent multiple auth checks
    if (hasCheckedAuth) {
      console.log('[AuthContext] Already checked auth, skipping')
      return
    }
    
    // Get initial session
    const getInitialSession = async () => {
      console.log('[AuthContext] Checking for existing session...')
      setHasCheckedAuth(true)
      
      try {
        // Check if we have a token in cookies or localStorage
        const hasToken = document.cookie.includes('timeback-access-token') || 
                        localStorage.getItem('timeback-auth-token')
        
        console.log('[AuthContext] Has token:', hasToken)
        console.log('[AuthContext] Cookies:', document.cookie)
        
        if (!hasToken) {
          console.log('[AuthContext] No token found, user not logged in')
          setLoading(false)
          return
        }
        
        // Try to get current user from API
        try {
          const apiUser = await apiClient.getCurrentUser()
          if (apiUser.success && apiUser.data?.user) {
            const userData = apiUser.data.user
            console.log('[AuthContext] User data retrieved:', userData)
            
            setUser({
              id: userData.id,
              email: userData.email,
              cognitoId: userData.cognitoId,
              role: userData.role,
              name: userData.name,
            })
            
            // Set up token refresh after successful authentication
            setupTokenRefresh()
          } else {
            console.log('[AuthContext] No user data in response')
          }
        } catch (error: any) {
          console.error('Error fetching user data:', error)
          // Clear invalid tokens
          localStorage.removeItem('timeback-auth-token')
          
          // If it's a network error, log more details
          if (error.message?.includes('401')) {
            console.log('Authentication failed - tokens may be invalid or expired')
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    return () => {
      // Clear refresh interval on unmount
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [])

  const signOut = async () => {
    try {
      // Clear token refresh interval
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
      
      // Call API logout endpoint
      await apiClient.logout()
      
      // Clear local storage
      localStorage.removeItem('timeback-auth-token')
      
      // Clear local state
      setUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signOut,
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