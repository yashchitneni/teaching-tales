'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export function TopNav() {
  const { user, profile } = useAuth()

  return (
    <nav className="bg-blue-600 text-white">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-full mr-2"></div>
            <span className="font-bold text-lg">TeachTales</span>
          </Link>
        </div>

        {/* Center Tabs */}
        <div className="hidden md:flex items-center space-x-8">
          <Link 
            href="/dashboard" 
            className="px-4 py-2 rounded bg-white/20 text-white font-medium"
          >
            My Accounts
          </Link>
          <Link 
            href="/reading-circles" 
            className="px-4 py-2 text-white/80 hover:text-white font-medium"
          >
            My Reading Circles
          </Link>
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-4">
          <span className="text-sm">First</span>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
            FL
          </div>
        </div>
      </div>
    </nav>
  )
} 