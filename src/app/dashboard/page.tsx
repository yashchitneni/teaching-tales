'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { CreateChildModal } from '@/components/CreateChildModal'
import { TopNav } from '@/components/TopNav'
import { FeedbackButton } from '@/components/FeedbackButton'
import { fetchUsers, type User } from '@/lib/api/oneroster-client'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [students, setStudents] = useState<User[]>([])
  const [studentsLoading, setStudentsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadStudents()
    }
  }, [user])

  const loadStudents = async () => {
    try {
      setStudentsLoading(true)
      const response = await fetchUsers({ role: 'student' })
      setStudents(response.users)
    } catch (error) {
      console.error('Error loading students:', error)
    } finally {
      setStudentsLoading(false)
    }
  }

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
      
      <main className="min-h-[calc(100vh-64px)] px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Student Dashboard</h1>
            <Button 
              onClick={() => {
                console.log('Add Student button clicked, showing modal');
                setShowCreateModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            >
              Add Student
            </Button>
          </div>

          {studentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => (
                <div key={student.sourcedId} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {student.givenName[0]}{student.familyName[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">{student.givenName} {student.familyName}</h3>
                      <p className="text-sm text-gray-500">{student.grades?.[0] || 'No grade'}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => router.push('/create-book/universe')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                      Create Story
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 text-sm"
                    >
                      View Books
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
                  <div className="w-20 h-24 bg-yellow-100 rounded-lg border-2 border-yellow-300 flex items-center justify-center">
                    <div className="w-12 h-12 bg-yellow-300 rounded-full"></div>
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-bold mb-4">No Students Yet</h2>
              <p className="text-gray-600 mb-6">
                Get started by creating an account for a student. This will allow them to 
                explore and enjoy personalized content tailored to their interests and 
                reading level.
              </p>
              <Button 
                onClick={() => {
                  console.log('Create First Student button clicked, showing modal');
                  setShowCreateModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                Create First Student
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Debug info */}
      <div className="fixed bottom-20 left-4 bg-red-500 text-white p-2 rounded z-50">
        Modal State: {showCreateModal ? 'OPEN' : 'CLOSED'}
      </div>

      {/* Create Child Modal */}
      {showCreateModal && (
        <>
          {console.log('Rendering CreateChildModal, showCreateModal =', showCreateModal)}
          <CreateChildModal onClose={() => {
            console.log('Modal close button clicked');
            setShowCreateModal(false)
            loadStudents() // Refresh students list after creating a new one
          }} />
        </>
      )}

      {/* Feedback Button */}
      <FeedbackButton />
    </div>
  )
}