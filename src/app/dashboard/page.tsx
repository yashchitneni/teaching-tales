'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { TopNav } from '@/components/TopNav'
import { FeedbackButton } from '@/components/FeedbackButton'

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      
      <main className="min-h-[calc(100vh-64px)] px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            {/* Illustration */}
            <div className="mb-6">
              <div className="flex justify-center space-x-2">
                <div className="w-20 h-24 bg-blue-100 rounded-lg border-2 border-blue-300 flex items-center justify-center">
                  <div className="w-12 h-12 bg-blue-300 rounded-full"></div>
                </div>
                <div className="w-20 h-24 bg-red-100 rounded-lg border-2 border-red-300 flex items-center justify-center">
                  <div className="w-12 h-12 bg-red-300 rounded-full"></div>
                </div>
                <div className="w-20 h-24 bg-green-100 rounded-lg border-2 border-green-300 flex items-center justify-center">
                  <div className="w-12 h-12 bg-green-300 rounded-full"></div>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4 text-gray-900">Welcome to TeachTales!</h2>
            <p className="text-gray-600 mb-6">
              Ready to create your first story? Let your imagination run wild and bring your ideas to life!
            </p>
            <Button 
              onClick={() => router.push('/create-book/universe')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              Create Story
            </Button>
          </div>
        </div>
      </main>

      {/* Feedback Button */}
      <FeedbackButton />
    </div>
  )
}
