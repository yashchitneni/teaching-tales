'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'
import { LibraryService } from '@/lib/services/library-service'
import { LibraryStory, LibraryReadingProgress } from '@/lib/types/library-types'
import { TelemetryService } from '@/lib/services/telemetry-service'
import Image from 'next/image'

export default function StoryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const storyId = params.id as string

  const [story, setStory] = useState<LibraryStory | null>(null)
  const [progress, setProgress] = useState<LibraryReadingProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mock user ID - in real app this would come from auth
  const userId = 'user-123'

  useEffect(() => {
    loadStoryData()
  }, [storyId])

  const loadStoryData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load story
      const storyData = LibraryService.getStoryById(storyId)
      if (!storyData) {
        setError('Story not found')
        return
      }

      setStory(storyData)

      // Load reading progress
      const progressData = LibraryService.getReadingProgress(userId, storyId)
      setProgress(progressData)

      // Track story opened event
      LibraryService.trackEvent({
        eventType: 'story_opened',
        userId,
        storyId,
        metadata: {
          title: storyData.metadata.title,
          author: storyData.metadata.author,
          readingLevel: storyData.metadata.readingLevel
        }
      })

    } catch (err) {
      console.error('Failed to load story:', err)
      setError('Failed to load story')
    } finally {
      setLoading(false)
    }
  }

  const startReading = (chapterNumber: number = 1) => {
    if (!story) return

    // Update progress
    LibraryService.updateReadingProgress({
      userId,
      storyId,
      currentChapter: chapterNumber,
      completedChapters: progress?.completedChapters || []
    })

    // Track chapter started
    const chapter = story.chapters.find(ch => ch.chapterNumber === chapterNumber)
    if (chapter) {
      LibraryService.trackEvent({
        eventType: 'chapter_started',
        userId,
        storyId,
        chapterId: chapter.id,
        metadata: {
          chapterNumber,
          chapterTitle: chapter.title
        }
      })
    }

    // Navigate to reading interface
    router.push(`/library/story/${storyId}/chapter/${chapterNumber}`)
  }

  const continueReading = () => {
    const nextChapter = progress?.currentChapter || 1
    startReading(nextChapter)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavWithTabs />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavWithTabs />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Story Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The requested story could not be found.'}</p>
            <button
              onClick={() => router.push('/library')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Library
            </button>
          </div>
        </div>
      </div>
    )
  }

  const completedChapters = progress?.completedChapters || []
  const progressPercentage = story.chapterCount > 0 
    ? Math.round((completedChapters.length / story.chapterCount) * 100) 
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavWithTabs />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/library')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Library
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Story Header */}
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Cover Image */}
              <div className="flex-shrink-0">
                {story.metadata.coverImage ? (
                  <Image
                    src={story.metadata.coverImage}
                    alt={`Cover of ${story.metadata.title}`}
                    width={200}
                    height={267}
                    className="rounded-lg shadow-md"
                  />
                ) : (
                  <div className="w-48 h-64 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg shadow-md flex items-center justify-center">
                    <div className="text-white text-center p-4">
                      <div className="text-lg font-bold mb-2">{story.metadata.title}</div>
                      <div className="text-sm opacity-90">by {story.metadata.author}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Story Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{story.metadata.title}</h1>
                    <p className="text-lg text-gray-600 mb-4">by {story.metadata.author}</p>
                  </div>
                  <div className="text-right">
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                      {story.metadata.readingLevel}
                    </div>
                    <div className="text-sm text-gray-500">
                      {story.totalEstimatedReadingTime} min read
                    </div>
                  </div>
                </div>

                {story.metadata.description && (
                  <p className="text-gray-700 mb-6 leading-relaxed">{story.metadata.description}</p>
                )}

                {/* Tags */}
                {story.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {story.metadata.tags.map(tag => (
                      <span
                        key={tag}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Progress Bar */}
                {progress && completedChapters.length > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Reading Progress</span>
                      <span className="text-sm text-gray-500">{progressPercentage}% complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {completedChapters.length} of {story.chapterCount} chapters completed
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {progress && progress.currentChapter > 1 ? (
                    <button
                      onClick={continueReading}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Continue Reading
                    </button>
                  ) : (
                    <button
                      onClick={() => startReading(1)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Start Reading
                    </button>
                  )}
                  
                  <button
                    onClick={() => startReading(1)}
                    className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Read from Beginning
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Chapter List */}
          <div className="border-t border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Chapters ({story.chapterCount})
              </h2>
              
              <div className="space-y-3">
                {story.chapters.map((chapter) => {
                  const isCompleted = completedChapters.includes(chapter.chapterNumber)
                  const isCurrent = progress?.currentChapter === chapter.chapterNumber
                  
                  return (
                    <div
                      key={chapter.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                        isCurrent ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => startReading(chapter.chapterNumber)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium">
                          {isCompleted ? (
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            chapter.chapterNumber
                          )}
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{chapter.wordCount} words</span>
                            <span>{chapter.estimatedReadingTime} min</span>
                            {chapter.questions.length > 0 && (
                              <span>{chapter.questions.length} questions</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            Current
                          </span>
                        )}
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Story Metadata */}
          <div className="border-t border-gray-200 bg-gray-50 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700">Category</div>
                <div className="text-gray-600">{story.metadata.category}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Topic</div>
                <div className="text-gray-600">{story.metadata.topic}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Word Count</div>
                <div className="text-gray-600">{story.totalWordCount.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Source</div>
                <div className="text-gray-600 capitalize">{story.metadata.source}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FeedbackButton />
    </div>
  )
}
