'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'
import { ImageGenerationStatus } from '@/components/ImageGenerationStatus'
import { imageGenerationService } from '@/lib/services/image-generation-service'
import { TelemetryService } from '@/lib/services/telemetry-service'
import { universeNames } from '@/lib/mockData'

export default function CreateCharacterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const universe = searchParams.get('universe') || ''
  const universeName = searchParams.get('universeName') || universeNames[universe] || universe
  
  const [characterName, setCharacterName] = useState('')
  const [characterDescription, setCharacterDescription] = useState('')
  const [characterAge, setCharacterAge] = useState('')
  const [characterTraits, setCharacterTraits] = useState<string[]>([])
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageJobId, setImageJobId] = useState<string | null>(null)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const availableTraits = [
    'Brave', 'Kind', 'Curious', 'Funny', 'Smart', 'Creative', 'Loyal', 'Adventurous',
    'Helpful', 'Determined', 'Friendly', 'Imaginative', 'Patient', 'Honest', 'Caring', 'Bold'
  ]

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!characterName.trim()) {
      newErrors.characterName = 'Character name is required'
    } else if (characterName.length < 2) {
      newErrors.characterName = 'Character name must be at least 2 characters'
    } else if (characterName.length > 30) {
      newErrors.characterName = 'Character name must be less than 30 characters'
    }

    if (!characterDescription.trim()) {
      newErrors.characterDescription = 'Description is required'
    } else if (characterDescription.length < 10) {
      newErrors.characterDescription = 'Description must be at least 10 characters'
    } else if (characterDescription.length > 300) {
      newErrors.characterDescription = 'Description must be less than 300 characters'
    }

    if (characterAge && (isNaN(Number(characterAge)) || Number(characterAge) < 5 || Number(characterAge) > 18)) {
      newErrors.characterAge = 'Age must be between 5 and 18'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleTraitToggle = (trait: string) => {
    setCharacterTraits(prev => 
      prev.includes(trait) 
        ? prev.filter(t => t !== trait)
        : prev.length < 5 ? [...prev, trait] : prev
    )
  }

  const handleGenerateImage = async () => {
    if (!characterName.trim()) {
      setErrors({ characterName: 'Please enter a character name first' })
      return
    }

    setIsGeneratingImage(true)
    setImageJobId(null)
    setGeneratedImageUrl(null)

    try {
      const traitsText = characterTraits.length > 0 ? `, ${characterTraits.join(', ').toLowerCase()}` : ''
      const ageText = characterAge ? `, age ${characterAge}` : ''
      
      const prompt = imagePrompt.trim() || 
        `A character named ${characterName}${ageText}${traitsText}. ${characterDescription}. In the style of ${universeName}. Child-friendly, cartoon style, colorful, detailed character portrait`

      const result = await imageGenerationService.generateImage({
        prompt,
        style: 'cartoon',
        aspectRatio: '1:1',
        size: 'medium'
      })

      setImageJobId(result.id)

      // Track image generation
      TelemetryService.trackUserEvent({
        category: 'create_custom',
        action: 'character_image_generation_started',
        properties: {
          characterName,
          universe,
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
      action: 'character_image_generation_completed',
      properties: {
        characterName,
        universe,
        imageUrl: imageUrl.substring(0, 100) // Truncate for privacy
      }
    })
  }

  const handleImageError = (error: string) => {
    setErrors({ image: error })
    setIsGeneratingImage(false)
    
    TelemetryService.trackUserEvent({
      category: 'create_custom',
      action: 'character_image_generation_failed',
      properties: {
        characterName,
        universe,
        error
      }
    })
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    // Track custom character creation
    TelemetryService.trackUserEvent({
      category: 'create_custom',
      action: 'character_created',
      properties: {
        characterName,
        universe,
        hasCustomImage: !!generatedImageUrl,
        traitsCount: characterTraits.length,
        hasAge: !!characterAge
      }
    })

    // Create custom character ID and navigate to spark selection
    const customCharacterId = `custom-${Date.now()}`
    const params = new URLSearchParams(searchParams.toString())
    params.set('character', customCharacterId)
    params.set('customCharacter', 'true')
    params.set('characterName', characterName)
    params.set('characterDescription', characterDescription)
    if (characterAge) params.set('characterAge', characterAge)
    if (characterTraits.length > 0) params.set('characterTraits', characterTraits.join(','))
    if (generatedImageUrl) params.set('characterImage', generatedImageUrl)

    router.push(`/create-book/spark?${params.toString()}`)
  }

  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('character')
    router.push(`/create-book/character?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavWithTabs />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex flex-col space-y-0 h-full lg:w-3/4 lg:h-[80vh] lg:max-w-[1152px] max-lg:flex-1 max-lg:h-full">
          {/* Header Section */}
          <div className="flex gap-5 p-4 bg-white rounded-t-2xl border-b border-solid border-gray-200 justify-start items-center max-lg:rounded-none">
            <h2 className="text-3xl font-semibold leading-9 text-neutral-800 max-lg:text-xl">Create Your Character</h2>
            <div className="flex flex-1 justify-end">
              <nav className="flex gap-1 my-auto rounded-xl overflow-hidden max-md:flex-1 max-md:flex-wrap">
                <div className="h-5 cursor-pointer w-28 max-md:w-auto max-md:flex-1" style={{ backgroundColor: '#0d6efd' }}></div>
                <div className="h-5 cursor-pointer w-28 max-md:w-auto max-md:flex-1" style={{ backgroundColor: '#0d6efd' }}></div>
                <div className="h-5 cursor-pointer w-28 max-md:w-auto max-md:flex-1 bg-gray-200"></div>
              </nav>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 flex flex-col gap-5 px-4 overflow-hidden bg-white border-b border-solid border-gray-200 border-opacity-30">
            <div className="flex flex-col gap-5 py-5 max-h-full overflow-auto">
              <div className="flex-col justify-start items-start gap-2 inline-flex">
                <div className="text-xl font-semibold text-left max-lg:text-base max-lg:font-bold text-gray-900">
                  Design your character for {universeName}
                </div>
                <div className="text-sm leading-5 max-w-[834px] text-neutral-800 text-opacity-70 text-left">
                  Create a unique character who will be the hero of your story. Give them a name, personality, and appearance.
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Character Name */}
                <div>
                  <label htmlFor="characterName" className="block text-sm font-medium text-gray-700 mb-2">
                    Character Name *
                  </label>
                  <input
                    type="text"
                    id="characterName"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="e.g., Luna, Max, Zara, Alex..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.characterName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    maxLength={30}
                  />
                  {errors.characterName && (
                    <p className="mt-1 text-sm text-red-600">{errors.characterName}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">{characterName.length}/30 characters</p>
                </div>

                {/* Character Age */}
                <div>
                  <label htmlFor="characterAge" className="block text-sm font-medium text-gray-700 mb-2">
                    Age (Optional)
                  </label>
                  <input
                    type="number"
                    id="characterAge"
                    value={characterAge}
                    onChange={(e) => setCharacterAge(e.target.value)}
                    placeholder="e.g., 10"
                    min="5"
                    max="18"
                    className={`w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.characterAge ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.characterAge && (
                    <p className="mt-1 text-sm text-red-600">{errors.characterAge}</p>
                  )}
                </div>

                {/* Character Traits */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personality Traits (Choose up to 5)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableTraits.map((trait) => (
                      <button
                        key={trait}
                        onClick={() => handleTraitToggle(trait)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          characterTraits.includes(trait)
                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                        } ${characterTraits.length >= 5 && !characterTraits.includes(trait) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={characterTraits.length >= 5 && !characterTraits.includes(trait)}
                      >
                        {trait}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{characterTraits.length}/5 traits selected</p>
                </div>

                {/* Character Description */}
                <div>
                  <label htmlFor="characterDescription" className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="characterDescription"
                    value={characterDescription}
                    onChange={(e) => setCharacterDescription(e.target.value)}
                    placeholder="Describe your character... What do they look like? What do they like to do? What makes them special?"
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                      errors.characterDescription ? 'border-red-500' : 'border-gray-300'
                    }`}
                    maxLength={300}
                  />
                  {errors.characterDescription && (
                    <p className="mt-1 text-sm text-red-600">{errors.characterDescription}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">{characterDescription.length}/300 characters</p>
                </div>

                {/* Image Generation Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Character Image (Optional)
                  </label>
                  
                  {!isGeneratingImage && !generatedImageUrl && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="Custom appearance description (optional) - we'll use your character details if left blank"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        maxLength={200}
                      />
                      <button
                        onClick={handleGenerateImage}
                        disabled={!characterName.trim()}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          characterName.trim()
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Generate Character Image
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
                      <div className="relative inline-block">
                        <img
                          src={generatedImageUrl}
                          alt={`${characterName} character`}
                          className="w-32 h-32 rounded-lg border border-gray-200 object-cover"
                        />
                        <button
                          onClick={() => {
                            setGeneratedImageUrl(null)
                            setImageJobId(null)
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                      <button
                        onClick={handleGenerateImage}
                        className="text-sm text-blue-600 hover:text-blue-700 underline block"
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
                disabled={!characterName.trim() || !characterDescription.trim()}
                className={`flex-initial justify-center whitespace-nowrap text-white border border-solid px-3.5 py-2 rounded-lg ${
                  characterName.trim() && characterDescription.trim() 
                    ? '' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd' }}
                type="button"
              >
                Next: Choose Spark
              </button>
            </div>
          </div>
        </div>
      </div>

      <FeedbackButton />
    </div>
  )
}
