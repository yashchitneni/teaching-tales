'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { CreateChildModal } from '@/components/CreateChildModal'
import { TopNav } from '@/components/TopNav'
import { FeedbackButton } from '@/components/FeedbackButton'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      
      <main className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          {/* Illustration */}
          <div className="mb-6">
            <div className="flex justify-center space-x-2">
              <div className="w-20 h-24 bg-blue-100 rounded-lg border-2 border-blue-300 flex items-center justify-center">
                <div className="w-12 h-12 bg-blue-300 rounded-full"></div>
              </div>
              <div className="w-20 h-24 bg-red-100 rounded-lg border-2 border-red-300 flex items-center justify-center">
                <div className="w-12 h-12 bg-red-300 rounded-full"></div>
              </div>
              <div className="w-20 h-24 bg-yellow-100 rounded-lg border-2 border-yellow-300 flex items-center justify-center">
                <div className="w-12 h-12 bg-yellow-300 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-2xl font-bold mb-4">Create Your Child's Account</h1>

          {/* Subtext */}
          <p className="text-gray-600 mb-6">
            Get started by creating an account for your child. This will allow them to 
            explore and enjoy personalized content tailored to their interests and 
            reading level. Add an account now to begin the journey!
          </p>

          {/* Create Account Button */}
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            Create Account
          </Button>
        </div>
      </main>

      {/* Create Child Modal */}
      {showCreateModal && (
        <CreateChildModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Feedback Button */}
      <FeedbackButton />
    </div>
  )
}