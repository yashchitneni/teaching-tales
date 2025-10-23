'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'
import { ImageGenerationStatus } from '@/components/ImageGenerationStatus'
import { imageGenerationService } from '@/lib/services/image-generation-service'
import { TelemetryService } from '@/lib/services/telemetry-service'

export default function CreateUniversePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [universeName, setUniverseName] = useState('')
  const [universeDescription, setUniverseDescription] = useState('')
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageJobId, setImageJobId] = useState<string | null>(null)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!universeName.trim()) {
      newErrors.universeName = 'Universe name is required'
    } else if (universeName.length < 3) {
      newErrors.universeName = 'Universe name must be at least 3 characters'
    } else if (universeName.length > 50) {
      newErrors.universeName = 'Universe name must be less than 50 characters'
    }

    if (!universeDescription.trim()) {
      newErrors.universeDescription = 'Description is required'
    } else if (universeDescription.length < 10) {
      newErrors.universeDescription = 'Description must be at least 10 characters'
    } else if (universeDescription.length > 500) {
      newErrors.universeDescription = 'Description must be less than 500 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGenerateImage = async () => {
    if (!universeName.trim()) {
      setErrors({ universeName: 'Please enter a universe name first' })
      return
    }

    setIsGeneratingImage(true)
    setImageJobId(null)
    setGeneratedImageUrl(null)

    try {
      const prompt = imagePrompt.trim() || 
        `A magical fantasy world called "${universeName}". ${universeDescription}. Beautiful landscape, fantasy art style, detailed, colorful, child-friendly`

      const result = await imageGenerationService.generateImage({
        prompt,
        style: 'illustration',
        aspectRatio: '16:9',
        size: 'medium'
      })

      setImageJobId(result.id)

      // Track image generation
      TelemetryService.trackUserEvent({
        category: 'create_custom',
        action: 'universe_image_generation_started',
        properties: {
          universeName,
          promptLength: prompt.length,
          provider: result.provider
        }
      })
    } catch (error) {
      console.error('Failed to start image generation:', error)
      setErrors({ image: error instanceof Error ? error.message : 'Failed to generate image' })
      setIsGeneratingImage(false)
    }
  }

  const handleImageComplete = (imageUrl: string) => {
    setGeneratedImageUrl(imageUrl)
    setIsGeneratingImage(false)
    
    TelemetryService.trackUserEvent({
      category: 'create_custom',
      action: 'universe_image_generation_completed',
      properties: {
        universeName,
        imageUrl: imageUrl.substring(0, 100) // Truncate for privacy
      }
    })
  }

  const handleImageError = (error: string) => {
    setErrors({ image: error })
    setIsGeneratingImage(false)
    
    TelemetryService.trackUserEvent({
      category: 'create_custom',
      action: 'universe_image_generation_failed',
      properties: {
        universeName,
        error
      }
    })
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    // Track custom universe creation
    TelemetryService.trackUserEvent({
      category: 'create_custom',
      action: 'universe_created',
      properties: {
        universeName,
        hasCustomImage: !!generatedImageUrl,
        descriptionLength: universeDescription.length
      }
    })

    // Create custom universe ID and navigate to character selection
    const customUniverseId = `custom-${Date.now()}`
    const params = new URLSearchParams({
      universe: customUniverseId,
      customUniverse: 'true',
      universeName,
      universeDescription,
      ...(generatedImageUrl && { universeImage: generatedImageUrl })
    })

    router.push(`/create-book/character?${params.toString()}`)
  }

  const handleBack = () => {
    router.push('/create-book/universe')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavWithTabs />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex flex-col space-y-0 h-full lg:w-3/4 lg:h-[80vh] lg:max-w-[1152px] max-lg:flex-1 max-lg:h-full">
          {/* Header Section */}
          <div className="flex gap-5 p-4 bg-white rounded-t-2xl border-b border-solid border-gray-200 justify-start items-center max-lg:rounded-none">
            <h2 className="text-3xl font-semibold leading-9 text-neutral-800 max-lg:text-xl">Create Your Universe</h2>
            <div className="flex flex-1 justify-end">
              <nav className="flex gap-1 my-auto rounded-xl overflow-hidden max-md:flex-1 max-md:flex-wrap">
                <div className="h-5 cursor-pointer w-28 max-md:w-auto max-md:flex-1" style={{ backgroundColor: '#0d6efd' }}></div>
                <div className="h-5 cursor-pointer w-28 max-md:w-auto max-md:flex-1 bg-gray-200"></div>
                <div className="h-5 cursor-pointer w-28 max-md:w-auto max-md:flex-1 bg-gray-200"></div>
              </nav>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 flex flex-col gap-5 px-4 overflow-hidden bg-white border-b border-solid border-gray-200 border-opacity-30">
            <div className="flex flex-col gap-5 py-5 max-h-full overflow-auto">
              <div className="flex-col justify-start items-start gap-2 inline-flex">
                <div className="text-xl font-semibold text-left max-lg:text-base max-lg:font-bold text-gray-900">
                  Design your own magical universe
                </div>
                <div className="text-sm leading-5 max-w-[834px] text-neutral-800 text-opacity-70 text-left">
                  Create a unique world where your stories will take place. Give it a name, describe what makes it special, and we'll help generate a beautiful image for it.
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Universe Name */}
                <div>
                  <label htmlFor="universeName" className="block text-sm font-medium text-gray-700 mb-2">
                    Universe Name *
                  </label>
                  <input
                    type="text"
                    id="universeName"
                    value={universeName}
                    onChange={(e) => setUniverseName(e.target.value)}
                    placeholder="e.g., Crystal Kingdom, Robot City, Enchanted Forest..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.universeName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    maxLength={50}
                  />
                  {errors.universeName && (
                    <p className="mt-1 text-sm text-red-600">{errors.universeName}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">{universeName.length}/50 characters</p>
                </div>

                {/* Universe Description */}
                <div>
                  <label htmlFor="universeDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="universeDescription"
                    value={universeDescription}
                    onChange={(e) => setUniverseDescription(e.target.value)}
                    placeholder="Describe your universe... What does it look like? What makes it special? Who lives there? What kind of adventures happen there?"
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                      errors.universeDescription ? 'border-red-500' : 'border-gray-300'
                    }`}
                    maxLength={500}
                  />
                  {errors.universeDescription && (
                    <p className="mt-1 text-sm text-red-600">{errors.universeDescription}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">{universeDescription.length}/500 characters</p>
                </div>

                {/* Image Generation Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Universe Image (Optional)
                  </label>
                  
                  {!isGeneratingImage && !generatedImageUrl && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="Custom image description (optional) - we'll use your universe details if left blank"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        maxLength={200}
                      />
                      <button
                        onClick={handleGenerateImage}
                        disabled={!universeName.trim()}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          universeName.trim()
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Generate Universe Image
                      </button>
                    </div>
                  )}

                  {imageJobId && (
                    <ImageGenerationStatus
                      jobId={imageJobId}
                      onComplete={handleImageComplete}
                      onError={handleImageError}
                      onCancel={() => {
                        setIsGeneratingImage(false)
                        setImageJobId(null)
                      }}
                      className="mt-3"
                    />
                  )}

                  {generatedImageUrl && (
                    <div className="mt-3 space-y-3">
                      <div className="relative">
                        <img
                          src={generatedImageUrl}
                          alt={`${universeName} universe`}
                          className="w-full max-w-md rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => {
                            setGeneratedImageUrl(null)
                            setImageJobId(null)
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                      <button
                        onClick={handleGenerateImage}
                        className="text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        Generate a different image
                      </button>
                    </div>
                  )}

                  {errors.image && (
                    <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                  )}
                </div>
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
                disabled={!universeName.trim() || !universeDescription.trim()}
                className={`flex-initial justify-center whitespace-nowrap text-white border border-solid px-3.5 py-2 rounded-lg ${
                  universeName.trim() && universeDescription.trim() 
                    ? '' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd' }}
                type="button"
              >
                Next: Choose Character
              </button>
            </div>
          </div>
        </div>
      </div>

      <FeedbackButton />
    </div>
  )
}
