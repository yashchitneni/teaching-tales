'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'
import { Button } from '@/components/ui/button'

interface UserStory {
  id: string
  title: string
  universe: string
  character: string
  spark: string
  status: 'generating' | 'completed' | 'error'
  createdAt: string
  wordCount?: number
  readingTime?: string
  sections?: any[]
}

export default function MyStoriesPage() {
  const router = useRouter()
  const [stories, setStories] = useState<UserStory[]>([])
  const [loading, setLoading] = useState(true)

  // Load user stories from localStorage
  useEffect(() => {
    try {
      const storedStories = JSON.parse(localStorage.getItem('teaching-tales-stories') || '[]')
      // Sort by creation date, newest first
      const sortedStories = storedStories.sort((a: UserStory, b: UserStory) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setStories(sortedStories)
    } catch (error) {
      console.error('Error loading stories:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleReadStory = (storyId: string) => {
    router.push(`/book/${storyId}`)
  }

  const handleCreateNewStory = () => {
    router.push('/create-book/universe')
  }

  const handleDeleteStory = (storyId: string) => {
    if (confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      try {
        const updatedStories = stories.filter(story => story.id !== storyId)
        setStories(updatedStories)
        localStorage.setItem('teaching-tales-stories', JSON.stringify(updatedStories))
      } catch (error) {
        console.error('Error deleting story:', error)
      }
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Unknown date'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'generating':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Ready to Read'
      case 'generating':
        return 'Generating...'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavWithTabs />
        <FeedbackButton />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your stories...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavWithTabs />
      <FeedbackButton />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Stories</h1>
            <p className="text-gray-600 mt-2">
              {stories.length === 0 
                ? "You haven't created any stories yet. Start your first adventure!" 
                : `You have ${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`
              }
            </p>
          </div>
          <Button
            onClick={handleCreateNewStory}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
          >
            + Create New Story
          </Button>
        </div>

        {/* Stories Grid */}
        {stories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No stories yet</h3>
            <p className="text-gray-600 mb-6">Create your first personalized story to get started!</p>
            <Button
              onClick={handleCreateNewStory}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              Create Your First Story
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Story Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {story.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(story.status)}`}>
                      {getStatusText(story.status)}
                    </span>
                  </div>
                </div>

                {/* Story Details */}
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Universe:</span>
                    <span className="capitalize">{story.universe.replace('-', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Character:</span>
                    <span className="capitalize">{story.character.replace('-', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Adventure:</span>
                    <span className="capitalize">{story.spark.replace('-', ' ')}</span>
                  </div>
                  {story.wordCount && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Length:</span>
                      <span>{story.wordCount} words • {story.readingTime}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Created:</span>
                    <span>{formatDate(story.createdAt)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  {story.status === 'completed' ? (
                    <Button
                      onClick={() => handleReadStory(story.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Read Story
                    </Button>
                  ) : story.status === 'generating' ? (
                    <Button
                      disabled
                      className="flex-1 bg-gray-300 text-gray-500 cursor-not-allowed"
                    >
                      Generating...
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleReadStory(story.id)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      View Details
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => handleDeleteStory(story.id)}
                    variant="outline"
                    className="px-3 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}