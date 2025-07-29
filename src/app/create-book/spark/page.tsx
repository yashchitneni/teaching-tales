'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'

interface Spark {
  id: string
  name: string
  image: string
  isCustom?: boolean
}

const sparks: Spark[] = [
  { id: 'create-own', name: 'Create Your Choice', image: '', isCustom: true },
  { id: 'lost-toy', name: 'Lost Toy', image: '/sparks/lost-toy.jpg' },
  { id: 'new-friend', name: 'New Friend', image: '/sparks/new-friend.jpg' },
  { id: 'birthday-party', name: 'Birthday Party', image: '/sparks/birthday-party.jpg' },
  { id: 'first-day-school', name: 'First Day of School', image: '/sparks/first-day-school.jpg' },
  { id: 'camping-trip', name: 'Camping Trip', image: '/sparks/camping-trip.jpg' },
  { id: 'pet-adventure', name: 'Pet Adventure', image: '/sparks/pet-adventure.jpg' },
  { id: 'magic-discovery', name: 'Magic Discovery', image: '/sparks/magic-discovery.jpg' },
  { id: 'sports-challenge', name: 'Sports Challenge', image: '/sparks/sports-challenge.jpg' },
  { id: 'mystery-solve', name: 'Mystery to Solve', image: '/sparks/mystery-solve.jpg' },
  { id: 'helping-others', name: 'Helping Others', image: '/sparks/helping-others.jpg' },
  { id: 'time-travel', name: 'Time Travel', image: '/sparks/time-travel.jpg' },
]

export default function SparkSelectionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedSpark, setSelectedSpark] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const universe = searchParams.get('universe') || ''
  const character = searchParams.get('character') || ''

  const filteredSparks = sparks.filter(spark =>
    spark.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateBook = async () => {
    if (!selectedSpark) return

    setIsCreating(true)
    
    // Navigate to loading page with all selections
    router.push(`/create-book/loading?universe=${universe}&character=${character}&spark=${selectedSpark}`)
  }

  const handleBack = () => {
    router.push(`/create-book/character?universe=${universe}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavWithTabs />
      <FeedbackButton />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Step 3 of 4</span>
            <span>Almost there!</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">What event will spark your story?</h1>
          <p className="text-gray-600">Choose an event that will drive your adventure</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Sparks Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {filteredSparks.map((spark) => (
            <button
              key={spark.id}
              onClick={() => setSelectedSpark(spark.id)}
              className={`relative rounded-lg overflow-hidden transition-all ${
                selectedSpark === spark.id
                  ? 'ring-4 ring-blue-500 shadow-lg transform scale-105'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="aspect-square bg-gray-200 relative">
                {spark.isCustom ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-sm font-medium text-purple-600">Create Custom</span>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                    <span className="text-4xl">✨</span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-white">
                <h3 className="font-medium text-sm text-center">{spark.name}</h3>
              </div>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            className="px-6"
          >
            Back
          </Button>
          
          <Button
            onClick={handleCreateBook}
            disabled={!selectedSpark || isCreating}
            className="px-6 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
          >
            {isCreating ? 'Creating...' : 'Create Book'}
          </Button>
        </div>
      </div>
    </div>
  )
}