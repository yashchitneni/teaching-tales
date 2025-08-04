'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { auth, Profile, db } from '@/lib/supabase'
import { apiClient } from '@/lib/api-client'

interface OneRosterUserData {
  sourcedId: string
  status: 'active' | 'tobedeleted'
  dateLastModified: string
  username: string
  enabledUser: boolean
  givenName: string
  familyName: string
  role: 'student' | 'teacher' | 'parent' | 'guardian' | 'relative' | 'aide' | 'administrator'
  email: string
  userIds?: Array<{ type: string; identifier: string }>
  metadata?: Record<string, unknown>
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  oneRosterData: OneRosterUserData | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [oneRosterData, setOneRosterData] = useState<OneRosterUserData | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  const refreshProfile = async () => {
    if (user) {
      try {
        const { data, error } = await db.getProfile(user.id)
        if (!error && data) {
          setProfile(data)
          // Extract OneRoster data from profile metadata
          if (data.metadata?.oneRoster) {
            setOneRosterData(data.metadata.oneRoster)
          }
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
        // Get current user from Supabase after successful login
        const currentUser = await auth.getCurrentUser()
        setUser(currentUser)
        
        // Set OneRoster data from response
        if (response.data.user?.oneRosterData) {
          setOneRosterData(response.data.user.oneRosterData)
        }
        
        // Refresh profile to get latest data
        await refreshProfile()
        
        // Set up token refresh after successful login
        setupTokenRefresh()
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
        await apiClient.refreshToken()
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
        const currentUser = await auth.getCurrentUser()
        setUser(currentUser)
        
        if (currentUser) {
          // Try to get user data from API (includes OneRoster data)
          try {
            const apiUser = await apiClient.getCurrentUser()
            if (apiUser.success && apiUser.data?.user?.oneRosterData) {
              setOneRosterData(apiUser.data.user.oneRosterData)
            }
          } catch (error) {
            console.error('Error fetching API user data:', error)
          }
          
          await refreshProfile()
          
          // Set up token refresh after successful authentication
          setupTokenRefresh()
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await refreshProfile()
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
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
      
      // Clear local state
      setUser(null)
      setProfile(null)
      setOneRosterData(null)
      
      // Also sign out from Supabase client
      await auth.signOut()
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