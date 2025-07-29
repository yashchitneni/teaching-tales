'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { db } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface CreateChildModalProps {
  onClose: () => void
}

export function CreateChildModal({ onClose }: CreateChildModalProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !user) return

    setIsLoading(true)
    try {
      // Create child profile
      const { error } = await db.createChild({
        parent_id: user.id,
        name: `${formData.firstName} ${formData.lastName}`,
        age: getAgeFromGrade(formData.grade),
        reading_level: getReadingLevelFromGrade(formData.grade),
        favorite_genres: []
      })

      if (error) throw error

      // Navigate to book creation
      router.push('/create-book/universe')
    } catch (error) {
      console.error('Error creating child:', error)
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
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          {/* Header */}
          <h2 className="text-xl font-bold text-center mb-2">Create an Account</h2>
          <p className="text-gray-600 text-sm text-center mb-6">
            Create an account for your child that will allow them to explore 
            personalized content tailored to their interests and reading level.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="firstName">First Name*</Label>
              <Input
                id="firstName"
                placeholder="Enter first name..."
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName">Last Name*</Label>
              <Input
                id="lastName"
                placeholder="Enter last name..."
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="grade">Grade*</Label>
              <select
                id="grade"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.grade ? 'border-red-500' : 'border-gray-300'
                }`}
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address..."
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <Button
              type="submit"
              className={`w-full ${
                isFormValid 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-300 cursor-not-allowed'
              }`}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
} 