'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'
import { useAuth } from '@/contexts/AuthContext'
import { fetchUsers } from '@/lib/api/oneroster-client'
import { StoryStorageService } from '@/lib/services/story-storage-service'


const loadingMessages = [
  "Gathering magical ingredients...",
  "Weaving your story threads...",
  "Adding a sprinkle of adventure...",
  "Creating memorable characters...",
  "Building your magical world...",
  "Polishing the final touches...",
  "Your story is almost ready!"
]

export default function StoryLoadingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [progress, setProgress] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)
  const [bookId, setBookId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isGeneratingRef = useRef(false)

  const universe = searchParams.get('universe') || ''
  const character = searchParams.get('character') || ''
  const spark = searchParams.get('spark') || ''

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Prevent multiple calls by checking if generation is already in progress
    if (isGeneratingRef.current) {
      return
    }

    // Mark as generating and start the story generation process
    isGeneratingRef.current = true
    generateStory()
  }, [user])

  useEffect(() => {
    // Update progress and messages
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 2
      })
    }, 100)

    const messageInterval = setInterval(() => {
      setMessageIndex(prev => {
        if (prev >= loadingMessages.length - 1) {
          clearInterval(messageInterval)
          return prev
        }
        return prev + 1
      })
    }, 2000)

    return () => {
      clearInterval(progressInterval)
      clearInterval(messageInterval)
    }
  }, [])

  const generateStory = async () => {
    try {
      // Use current authenticated user for book creation
      if (!user) {
        throw new Error('You must be logged in to create a story.')
      }
      
      // Generate a unique book ID for this story session
      const storyId = crypto.randomUUID()
      setBookId(storyId)
      
      // Store story metadata in localStorage for now (until proper API is available)
      const storyMetadata = {
        id: storyId,
        studentId: user.sourcedId,
        title: `${character}'s ${spark} Adventure`,
        universe: universe,
        character: character,
        spark: spark,
        targetGrade: user.grades?.[0] || 'Unknown',
        status: 'generating',
        createdAt: new Date().toISOString()
      }
      
      // Note: We'll save to QTI API after successful generation
      // No need to store initial metadata since we save complete stories
      
      // Generate real AI story using our server-side API
      
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include HttpOnly cookies for authentication
        body: JSON.stringify({
          universe: universe,
          character: character,
          spark: spark,
          gradeLevel: user.grades?.[0] || '4-5', // Default to 4-5 if no grade available
          studentId: user.sourcedId || user.id || user.cognitoId // Fallback chain
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`API Error: ${errorData.error} - ${errorData.details}`)
      }
      
      const storyResponse = await response.json()
      
      // Save complete story to QTI Stimuli API and create assessment tests
      const { 
        stimulus: savedStimulus, 
        assessments, 
        oneRosterIntegration 
      } = await StoryStorageService.saveStory(storyResponse, {
        universe: universe,
        character: character,
        spark: spark,
        gradeLevel: user.grades?.[0] || '4-5',
        studentId: user.sourcedId,
        storyId: storyId,
        enableOneRosterIntegration: true // Enable OneRoster integration
      })
      
      // Log OneRoster integration results
      if (oneRosterIntegration) {
        if (!oneRosterIntegration.success) {
          console.warn('⚠️ OneRoster integration failed:', oneRosterIntegration.error)
          // Story creation continues even if OneRoster integration fails
        }
      }
      
      // Navigate to reading interface using the stimulus ID
      router.push(`/book/${savedStimulus.id}`)

    } catch (error) {
      console.error('Error generating story:', error)
      setError(error instanceof Error ? error.message : 'Sorry, there was an error creating your story. Please try again.')
      
      // Navigate back to spark selection after a delay
      setTimeout(() => {
        router.push(`/create-book/spark?universe=${universe}&character=${character}`)
      }, 3000)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavWithTabs />
        <FeedbackButton />
        
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
              <p className="text-gray-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavWithTabs />
      <FeedbackButton />

      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          {/* Animated Pencil and Notepad */}
          <div className="mb-8 relative">
            <div className="w-48 h-48 mx-auto relative">
              {/* Notepad */}
              <div className="absolute inset-0 bg-white rounded-lg shadow-lg border-2 border-gray-300">
                <div className="absolute top-0 left-0 right-0 h-8 bg-blue-100 rounded-t-lg"></div>
                <div className="mt-12 px-4">
                  <div className="h-2 bg-gray-200 rounded mb-2 animate-pulse"></div>
                  <div className="h-2 bg-gray-200 rounded mb-2 animate-pulse" style={{ width: '80%' }}></div>
                  <div className="h-2 bg-gray-200 rounded mb-2 animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
              
              {/* Animated Pencil */}
              <div 
                className="absolute -right-4 top-16 transform rotate-45"
                style={{
                  animation: 'writing 2s ease-in-out infinite'
                }}
              >
                <div className="relative">
                  {/* Pencil body */}
                  <div className="w-4 h-20 bg-yellow-400 rounded-t-sm">
                    <div className="absolute top-0 left-0 right-0 h-4 bg-pink-400 rounded-t-sm"></div>
                  </div>
                  {/* Pencil tip */}
                  <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[16px] border-t-gray-700"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading Message */}
          <h2 className="text-2xl font-bold mb-2 text-gray-800">
            Creating Your Magical Story
          </h2>
          <p className="text-gray-600 mb-8 h-6">
            {loadingMessages[messageIndex]}
          </p>

          {/* Progress Bar */}
          <div className="w-full max-w-xs mx-auto mb-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Progress Percentage */}
          <p className="text-sm text-gray-500">{progress}% Complete</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes writing {
          0%, 100% {
            transform: rotate(45deg) translateX(0) translateY(0);
          }
          25% {
            transform: rotate(40deg) translateX(-2px) translateY(2px);
          }
          50% {
            transform: rotate(50deg) translateX(2px) translateY(-2px);
          }
          75% {
            transform: rotate(42deg) translateX(-1px) translateY(1px);
          }
        }
      `}</style>
    </div>
  )
} 