'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthContext'

interface CreateChildModalProps {
  onClose: () => void
}

export function CreateChildModal({ onClose }: CreateChildModalProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    grade: '',
    email: ''
  })
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    grade: ''
  })

  const grades = [
    'Kindergarten',
    '1st Grade',
    '2nd Grade',
    '3rd Grade',
    '4th Grade',
    '5th Grade',
    '6th Grade',
    '7th Grade',
    '8th Grade'
  ]

  const validateForm = () => {
    const newErrors = {
      firstName: formData.firstName ? '' : 'First name is required',
      lastName: formData.lastName ? '' : 'Last name is required',
      grade: formData.grade ? '' : 'Grade is required'
    }
    setErrors(newErrors)
    return !newErrors.firstName && !newErrors.lastName && !newErrors.grade
  }

  const getErrorMessage = (error: any): string => {
    // Handle network errors
    if (!navigator.onLine) {
      return 'No internet connection. Please check your connection and try again.'
    }
    
    // Handle API response errors
    if (error.response?.status === 401) {
      return 'Please log in again to continue.'
    }
    if (error.response?.status === 400) {
      return 'Please check your information and try again.'
    }
    if (error.response?.status === 500) {
      return 'Server error. Please try again in a moment.'
    }
    
    // Handle specific error messages from API
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message
    }
    
    // Default fallback
    return 'Something went wrong. Please try again.'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !user) return

    setIsLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      // Prepare OneRoster user data
      const oneRosterUser = {
        role: 'student' as const,
        givenName: formData.firstName,
        familyName: formData.lastName,
        email: formData.email || `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}@child.local`,
        username: `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}`,
        enabledUser: true,
        status: 'active' as const,
        dateLastModified: new Date().toISOString(),
        grades: [formData.grade],
        agents: [{
          sourcedId: user.id,
          agentSourcedId: user.id
        }],
        metadata: {
          age: getAgeFromGrade(formData.grade),
          readingLevel: getReadingLevelFromGrade(formData.grade),
          interests: [],
          preferences: {}
        }
      }
      
      console.log('Creating child with OneRoster API:', oneRosterUser)
      const response = await apiClient.createOneRosterUser(oneRosterUser)
      console.log('Child created successfully:', response)
      
      // Set success state
      setSuccess(true)
      
      // Brief success feedback before navigation
      setTimeout(() => {
        router.push('/create-book/universe')
      }, 1500)
      
    } catch (error) {
      console.error('Error creating child:', error)
      setError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const getAgeFromGrade = (grade: string): number => {
    const gradeMap: { [key: string]: number } = {
      'Kindergarten': 5,
      '1st Grade': 6,
      '2nd Grade': 7,
      '3rd Grade': 8,
      '4th Grade': 9,
      '5th Grade': 10,
      '6th Grade': 11,
      '7th Grade': 12,
      '8th Grade': 13
    }
    return gradeMap[grade] || 8
  }

  const getReadingLevelFromGrade = (grade: string): 'beginner' | 'intermediate' | 'advanced' => {
    if (grade.includes('Kindergarten') || grade.includes('1st') || grade.includes('2nd')) {
      return 'beginner'
    } else if (grade.includes('3rd') || grade.includes('4th') || grade.includes('5th')) {
      return 'intermediate'
    }
    return 'advanced'
  }

  const isFormValid = formData.firstName && formData.lastName && formData.grade

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-gray-600">Creating account...</p>
            </div>
          </div>
        )}

        {/* Success Overlay */}
        {success && (
          <div className="absolute inset-0 bg-white/95 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <div className="inline-block w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-600 font-medium">Account created successfully!</p>
              <p className="text-gray-500 text-sm mt-1">Redirecting...</p>
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          {/* Header */}
          <h2 className="text-xl font-bold text-center mb-2 text-black">Create an Account</h2>
          <p className="text-gray-600 text-sm text-center mb-6">
            Create an account for your child that will allow them to explore 
            personalized content tailored to their interests and reading level.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="firstName" className="text-black font-medium">First Name*</Label>
              <Input
                id="firstName"
                placeholder="Enter first name..."
                value={formData.firstName}
                onChange={(e) => {
                  setFormData({ ...formData, firstName: e.target.value })
                  setError(null) // Clear error when user starts typing
                }}
                disabled={isLoading}
                className={`${errors.firstName ? 'border-red-500' : 'border-gray-300'} ${isLoading ? 'opacity-50' : ''} bg-white text-black placeholder-gray-500`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName" className="text-black font-medium">Last Name*</Label>
              <Input
                id="lastName"
                placeholder="Enter last name..."
                value={formData.lastName}
                onChange={(e) => {
                  setFormData({ ...formData, lastName: e.target.value })
                  setError(null) // Clear error when user starts typing
                }}
                disabled={isLoading}
                className={`${errors.lastName ? 'border-red-500' : 'border-gray-300'} ${isLoading ? 'opacity-50' : ''} bg-white text-black placeholder-gray-500`}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="grade" className="text-black font-medium">Grade*</Label>
              <select
                id="grade"
                value={formData.grade}
                onChange={(e) => {
                  setFormData({ ...formData, grade: e.target.value })
                  setError(null) // Clear error when user makes changes
                }}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-md bg-white text-black ${
                  errors.grade ? 'border-red-500' : 'border-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="">Select a grade</option>
                {grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              {errors.grade && (
                <p className="text-red-500 text-sm mt-1">{errors.grade}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="text-black font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address..."
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  setError(null) // Clear error when user starts typing
                }}
                disabled={isLoading}
                className={`border-gray-300 bg-white text-black placeholder-gray-500 ${isLoading ? 'opacity-50' : ''}`}
              />
              <p className="text-gray-500 text-xs mt-1">
                Optional - if not provided, we'll create a default email
              </p>
            </div>

            <Button
              type="submit"
              className={`w-full transition-colors text-white ${
                isFormValid && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-300 cursor-not-allowed'
              }`}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center text-white">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                <span className="text-white">Create Account</span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
} 