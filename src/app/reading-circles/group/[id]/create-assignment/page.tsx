'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'
import { ReadingCirclesService } from '@/lib/services/reading-circles-service'
import { LibraryService } from '@/lib/services/library-service'
import { ReadingGroup } from '@/lib/types/reading-circles-types'
import { LibraryStoryMetadata } from '@/lib/types/library-types'

export default function CreateAssignmentPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<ReadingGroup | null>(null)
  const [stories, setStories] = useState<LibraryStoryMetadata[]>([])
  const [selectedStory, setSelectedStory] = useState<LibraryStoryMetadata | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    storyId: '',
    chapterIds: [] as string[],
    pointsValue: 100,
    allowLateSubmission: true,
    showProgressToGroup: true,
    requireCompletion: false
  })
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Mock user ID - in real app this would come from auth
  const userId = 'user-123'

  useEffect(() => {
    loadData()
  }, [groupId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [groupData, storiesData] = await Promise.all([
        ReadingCirclesService.getGroupById(groupId),
        LibraryService.getPublishedStories()
      ])

      if (!groupData) {
        router.push('/reading-circles')
        return
      }

      setGroup(groupData)
      setStories(storiesData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStorySelect = async (story: LibraryStoryMetadata) => {
    setSelectedStory(story)
    setFormData(prev => ({
      ...prev,
      storyId: story.id,
      title: prev.title || `Read "${story.title}"`,
      description: prev.description || `Complete the reading assignment for "${story.title}" by ${story.author}.`
    }))

    // Load full story to get chapters
    const fullStory = LibraryService.getStoryById(story.id)
    if (fullStory) {
      setFormData(prev => ({
        ...prev,
        chapterIds: fullStory.chapters.map(ch => ch.id)
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Assignment title is required'
    if (!formData.storyId) newErrors.storyId = 'Please select a story'
    if (formData.chapterIds.length === 0) newErrors.chapterIds = 'Please select at least one chapter'
    if (formData.pointsValue < 1) newErrors.pointsValue = 'Points value must be at least 1'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const assignment = await ReadingCirclesService.createAssignment(userId, groupId, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        dueDate: formData.dueDate || undefined,
        storyId: formData.storyId,
        chapterIds: formData.chapterIds,
        settings: {
          pointsValue: formData.pointsValue,
          allowLateSubmission: formData.allowLateSubmission,
          showProgressToGroup: formData.showProgressToGroup,
          requireCompletion: formData.requireCompletion
        }
      })

      router.push(`/reading-circles/assignment/${assignment.id}`)
    } catch (error) {
      console.error('Failed to create assignment:', error)
      setErrors({ submit: 'Failed to create assignment. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
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

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavWithTabs />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Group Not Found</h1>
            <button
              onClick={() => router.push('/reading-circles')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Reading Circles
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavWithTabs />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/reading-circles/group/${groupId}`)}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {group.name}
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Assignment</h1>
          <p className="text-gray-600">
            Create a new reading assignment for your group members.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Assignment Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Read 'The Brave Little Turtle'"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Provide instructions or context for this assignment..."
                />
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="pointsValue" className="block text-sm font-medium text-gray-700 mb-1">
                  Points Value *
                </label>
                <input
                  type="number"
                  id="pointsValue"
                  value={formData.pointsValue}
                  onChange={(e) => setFormData({ ...formData, pointsValue: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="1000"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.pointsValue ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.pointsValue && <p className="mt-1 text-sm text-red-600">{errors.pointsValue}</p>}
              </div>
            </div>
          </div>

          {/* Story Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Story</h2>
            
            {errors.storyId && <p className="mb-4 text-sm text-red-600">{errors.storyId}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {stories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => handleStorySelect(story)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedStory?.id === story.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{story.title}</h3>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium ml-2 flex-shrink-0">
                      {story.readingLevel}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2">by {story.author}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{story.estimatedReadingTime} min</span>
                    <span>{story.category}</span>
                  </div>
                  
                  {story.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {story.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {stories.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No stories available. Add stories to the library first.</p>
              </div>
            )}
          </div>

          {/* Chapter Selection */}
          {selectedStory && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Chapters from "{selectedStory.title}"
              </h2>
              
              {errors.chapterIds && <p className="mb-4 text-sm text-red-600">{errors.chapterIds}</p>}
              
              <ChapterSelector
                storyId={selectedStory.id}
                selectedChapterIds={formData.chapterIds}
                onChapterSelectionChange={(chapterIds) => 
                  setFormData({ ...formData, chapterIds })
                }
              />
            </div>
          )}

          {/* Assignment Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assignment Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowLateSubmission"
                  checked={formData.allowLateSubmission}
                  onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="allowLateSubmission" className="ml-2 block text-sm text-gray-700">
                  Allow late submissions
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showProgressToGroup"
                  checked={formData.showProgressToGroup}
                  onChange={(e) => setFormData({ ...formData, showProgressToGroup: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="showProgressToGroup" className="ml-2 block text-sm text-gray-700">
                  Show individual progress to group members
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireCompletion"
                  checked={formData.requireCompletion}
                  onChange={(e) => setFormData({ ...formData, requireCompletion: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="requireCompletion" className="ml-2 block text-sm text-gray-700">
                  Require 100% completion to earn points
                </label>
              </div>
            </div>
          </div>

          {/* Submit */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push(`/reading-circles/group/${groupId}`)}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedStory}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </div>

      <FeedbackButton />
    </div>
  )
}

// Chapter Selector Component
interface ChapterSelectorProps {
  storyId: string
  selectedChapterIds: string[]
  onChapterSelectionChange: (chapterIds: string[]) => void
}

function ChapterSelector({ storyId, selectedChapterIds, onChapterSelectionChange }: ChapterSelectorProps) {
  const [story, setStory] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStory = async () => {
      try {
        const storyData = LibraryService.getStoryById(storyId)
        setStory(storyData)
      } catch (error) {
        console.error('Failed to load story:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadStory()
  }, [storyId])

  const handleChapterToggle = (chapterId: string) => {
    const newSelection = selectedChapterIds.includes(chapterId)
      ? selectedChapterIds.filter(id => id !== chapterId)
      : [...selectedChapterIds, chapterId]
    
    onChapterSelectionChange(newSelection)
  }

  const handleSelectAll = () => {
    if (story) {
      onChapterSelectionChange(story.chapters.map((ch: any) => ch.id))
    }
  }

  const handleSelectNone = () => {
    onChapterSelectionChange([])
  }

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Loading chapters...</div>
  }

  if (!story || !story.chapters) {
    return <div className="text-center py-4 text-gray-500">No chapters found</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          {selectedChapterIds.length} of {story.chapters.length} chapters selected
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleSelectNone}
            className="text-gray-600 hover:text-gray-700 text-sm font-medium"
          >
            Select None
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {story.chapters.map((chapter: any) => (
          <div
            key={chapter.id}
            className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <input
              type="checkbox"
              id={chapter.id}
              checked={selectedChapterIds.includes(chapter.id)}
              onChange={() => handleChapterToggle(chapter.id)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={chapter.id} className="ml-3 flex-1 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    Chapter {chapter.chapterNumber}: {chapter.title}
                  </div>
                  <div className="text-sm text-gray-600">
                    {chapter.wordCount} words • {chapter.estimatedReadingTime} min
                    {chapter.questions && chapter.questions.length > 0 && (
                      <span> • {chapter.questions.length} questions</span>
                    )}
                  </div>
                </div>
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

