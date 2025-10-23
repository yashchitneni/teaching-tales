'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'
import { TelemetryService } from '@/lib/services/telemetry-service'
import { universeNames } from '@/lib/mockData'

export default function CreateSparkPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const universe = searchParams.get('universe') || ''
  const character = searchParams.get('character') || ''
  const universeName = searchParams.get('universeName') || universeNames[universe] || universe
  const characterName = searchParams.get('characterName') || character
  
  const [sparkTitle, setSparkTitle] = useState('')
  const [sparkDescription, setSparkDescription] = useState('')
  const [sparkCategory, setSparkCategory] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const sparkCategories = [
    'Adventure', 'Mystery', 'Friendship', 'Problem-Solving', 'Discovery',
    'Challenge', 'Journey', 'Magic', 'Science', 'Teamwork', 'Courage', 'Learning'
  ]

  const sparkPrompts = [
    'A mysterious object appears in...',
    'The main character discovers they can...',
    'A new friend needs help with...',
    'Something strange is happening in...',
    'The character finds a secret...',
    'A challenge arises when...',
    'An adventure begins with...',
    'The character must solve...',
    'A magical event occurs...',
    'The character learns about...'
  ]

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!sparkTitle.trim()) {
      newErrors.sparkTitle = 'Spark title is required'
    } else if (sparkTitle.length < 5) {
      newErrors.sparkTitle = 'Spark title must be at least 5 characters'
    } else if (sparkTitle.length > 100) {
      newErrors.sparkTitle = 'Spark title must be less than 100 characters'
    }

    if (!sparkDescription.trim()) {
      newErrors.sparkDescription = 'Description is required'
    } else if (sparkDescription.length < 20) {
      newErrors.sparkDescription = 'Description must be at least 20 characters'
    } else if (sparkDescription.length > 500) {
      newErrors.sparkDescription = 'Description must be less than 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePromptClick = (prompt: string) => {
    if (!sparkTitle.trim()) {
      setSparkTitle(prompt)
    } else {
      setSparkDescription(prev => prev ? `${prev} ${prompt}` : prompt)
    }
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    // Track custom spark creation
    TelemetryService.trackUserEvent({
      category: 'create_custom',
      action: 'spark_created',
      properties: {
        sparkTitle,
        sparkCategory,
        universe,
        character,
        descriptionLength: sparkDescription.length
      }
    })

    // Navigate to loading page with custom spark
    const params = new URLSearchParams(searchParams.toString())
    params.set('spark', sparkTitle)
    params.set('customSpark', 'true')
    params.set('sparkDescription', sparkDescription)
    if (sparkCategory) params.set('sparkCategory', sparkCategory)

    router.push(`/create-book/loading?${params.toString()}`)
  }

  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('spark')
    router.push(`/create-book/spark?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavWithTabs />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex flex-col space-y-0 h-full lg:w-3/4 lg:h-[80vh] lg:max-w-[1152px] max-lg:flex-1 max-lg:h-full">
          {/* Header Section */}
          <div className="flex gap-5 p-4 bg-white rounded-t-2xl border-b border-solid border-gray-200 justify-start items-center max-lg:rounded-none">
            <h2 className="text-3xl font-semibold leading-9 text-neutral-800 max-lg:text-xl">Create Your Spark</h2>
            <div className="flex flex-1 justify-end">
              <nav className="flex gap-1 my-auto rounded-xl overflow-hidden max-md:flex-1 max-md:flex-wrap">
                <div className="h-5 cursor-pointer w-28 max-md:w-auto max-md:flex-1" style={{ backgroundColor: '#0d6efd' }}></div>
                <div className="h-5 cursor-pointer w-28 max-md:w-auto max-md:flex-1" style={{ backgroundColor: '#0d6efd' }}></div>
                <div className="h-5 cursor-pointer w-28 max-md:w-auto max-md:flex-1" style={{ backgroundColor: '#0d6efd' }}></div>
              </nav>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 flex flex-col gap-5 px-4 overflow-hidden bg-white border-b border-solid border-gray-200 border-opacity-30">
            <div className="flex flex-col gap-5 py-5 max-h-full overflow-auto">
              <div className="flex-col justify-start items-start gap-2 inline-flex">
                <div className="text-xl font-semibold text-left max-lg:text-base max-lg:font-bold text-gray-900">
                  Create the spark that starts {characterName}'s adventure in {universeName}
                </div>
                <div className="text-sm leading-5 max-w-[834px] text-neutral-800 text-opacity-70 text-left">
                  What event or situation will kick off your story? This is the moment that sets everything in motion.
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Spark Title */}
                <div>
                  <label htmlFor="sparkTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    Spark Title *
                  </label>
                  <input
                    type="text"
                    id="sparkTitle"
                    value={sparkTitle}
                    onChange={(e) => setSparkTitle(e.target.value)}
                    placeholder="e.g., A mysterious portal appears in the school library"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.sparkTitle ? 'border-red-500' : 'border-gray-300'
                    }`}
                    maxLength={100}
                  />
                  {errors.sparkTitle && (
                    <p className="mt-1 text-sm text-red-600">{errors.sparkTitle}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">{sparkTitle.length}/100 characters</p>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sparkCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSparkCategory(sparkCategory === category ? '' : category)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          sparkCategory === category
                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spark Prompts */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Need inspiration? Click any prompt to use it:
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {sparkPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handlePromptClick(prompt)}
                        className="text-left p-2 text-sm bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spark Description */}
                <div>
                  <label htmlFor="sparkDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Description *
                  </label>
                  <textarea
                    id="sparkDescription"
                    value={sparkDescription}
                    onChange={(e) => setSparkDescription(e.target.value)}
                    placeholder="Describe the spark in detail... What exactly happens? How does it affect the character? What makes it interesting or mysterious?"
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                      errors.sparkDescription ? 'border-red-500' : 'border-gray-300'
                    }`}
                    maxLength={500}
                  />
                  {errors.sparkDescription && (
                    <p className="mt-1 text-sm text-red-600">{errors.sparkDescription}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">{sparkDescription.length}/500 characters</p>
                </div>

                {/* Preview */}
                {sparkTitle && sparkDescription && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900">{sparkTitle}</p>
                      <p className="text-sm text-gray-600">{sparkDescription}</p>
                      {sparkCategory && (
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {sparkCategory}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="flex flex-col gap-5 p-4 bg-white rounded-b-2xl max-lg:rounded-none max-lg:p-3">
            <div className="flex justify-between items-start">
              <button 
                onClick={handleBack}
                className="flex-initial justify-center whitespace-nowrap text-white border border-solid px-3.5 py-2 rounded-lg" 
                style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd' }}
                type="button"
              >
                Back
              </button>
              <button 
                onClick={handleSubmit}
                disabled={!sparkTitle.trim() || !sparkDescription.trim()}
                className={`flex-initial justify-center whitespace-nowrap text-white border border-solid px-3.5 py-2 rounded-lg ${
                  sparkTitle.trim() && sparkDescription.trim() 
                    ? '' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd' }}
                type="button"
              >
                Create Story
              </button>
            </div>
          </div>
        </div>
      </div>

      <FeedbackButton />
    </div>
  )
}
