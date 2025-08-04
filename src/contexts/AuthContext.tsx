'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { UserRole } from '@/lib/cognito-auth'

interface OneRosterUserData {
  sourcedId: string
  status: 'active' | 'tobedeleted'
  dateLastModified: string
  username: string
  enabledUser: boolean
  givenName: string
  familyName: string
  role: UserRole
  email: string
  userIds?: Array<{ type: string; identifier: string }>
  metadata?: Record<string, unknown>
}

interface Profile {
  id: string
  email: string
  display_name?: string
  avatar_url?: string
  subscription_tier: 'free' | 'premium'
  created_at: string
  updated_at: string
  cognito_id?: string
  role?: UserRole
  oneroster_id?: string
  metadata?: any
}

interface CognitoUser {
  id: string
  email: string
  cognitoId: string
  role: UserRole
  name?: string
  profile?: Profile | null
  oneRosterData?: OneRosterUserData
  children?: any[] // Children profiles for this parent
}

interface AuthContextType {
  user: CognitoUser | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  oneRosterData: OneRosterUserData | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CognitoUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [oneRosterData, setOneRosterData] = useState<OneRosterUserData | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const refreshProfile = async () => {
    if (user) {
      try {
        // Get latest user data from API
        const response = await apiClient.getCurrentUser()
        if (response.success && response.data?.user) {
          const userData = response.data.user
          setProfile(userData.profile)
          setOneRosterData(userData.oneRosterData)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const response = await apiClient.login(email, password)
      
      if (response.success && response.data) {
        const userData = response.data.user
        
        // Set user data
        setUser({
          id: userData.id,
          email: userData.email,
          cognitoId: userData.cognitoId,
          role: userData.role,
          name: userData.name,
          profile: userData.profile,
          oneRosterData: userData.oneRosterData,
        })
        
        setProfile(userData.profile)
        setOneRosterData(userData.oneRosterData)
        
        // Set up token refresh after successful login
        setupTokenRefresh()
        
        // Store tokens in localStorage for client-side access
        if (response.data.tokens) {
          localStorage.setItem('timeback-auth-token', response.data.tokens.accessToken)
        }
      }
    } catch (error) {
      console.error('Sign in error:', error)
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
    // Get initial session
    const getInitialSession = async () => {
      try {
        // Check if we have a token in cookies or localStorage
        const hasToken = document.cookie.includes('timeback-access-token') || 
                        localStorage.getItem('timeback-auth-token')
        
        if (!hasToken) {
          setLoading(false)
          return
        }
        
        // Try to get current user from API
        try {
          const apiUser = await apiClient.getCurrentUser()
          if (apiUser.success && apiUser.data?.user) {
            const userData = apiUser.data.user
            
            setUser({
              id: userData.id,
              email: userData.email,
              cognitoId: userData.cognitoId,
              role: userData.role,
              name: userData.name,
              profile: userData.profile,
              oneRosterData: userData.oneRosterData,
              children: userData.relationships?.children,
            })
            
            setProfile(userData.profile)
            setOneRosterData(userData.oneRosterData)
            
            // Set up token refresh after successful authentication
            setupTokenRefresh()
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
      setProfile(null)
      setOneRosterData(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signOut,
    refreshProfile,
    oneRosterData,
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