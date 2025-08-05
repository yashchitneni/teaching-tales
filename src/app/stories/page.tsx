'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'

// Mock story data - in a real app this would come from an API
const storyData: Record<string, Array<{
  id: string
  title: string
  description: string
  genre: 'FICTION' | 'NON-FICTION'
}>> = {
  'Languages': [
    {
      id: 'whispering-canyon',
      title: 'The Whispering Canyon',
      description: 'In a land where legends speak of whispering canyons and hidden secrets, two friends embark on a journey to uncover the truth behind the mysterious voices that echo through the canyon walls.',
      genre: 'FICTION'
    },
    {
      id: 'great-blue-hole',
      title: 'The Mysteries of the Great Blue Hole',
      description: 'Explore the intriguing features, history, and scientific significance of the Great Blue Hole, one of the most fascinating underwater sinkholes in the world.',
      genre: 'NON-FICTION'
    }
  ],
  'Traditions': [
    {
      id: 'festival-lights',
      title: 'The Festival of Lights',
      description: 'Journey through different cultures as Maya discovers how people around the world celebrate with light, from Diwali to Las Posadas.',
      genre: 'FICTION'
    },
    {
      id: 'ancient-ceremonies',
      title: 'Ancient Ceremonies Around the World',
      description: 'Learn about fascinating traditional ceremonies from different cultures and how they continue to shape communities today.',
      genre: 'NON-FICTION'
    }
  ],
  // Add more categories as needed
  'default': [
    {
      id: 'adventure-awaits',
      title: 'Adventure Awaits',
      description: 'An exciting tale of discovery and friendship in unexplored territories.',
      genre: 'FICTION'
    },
    {
      id: 'learning-journey',
      title: 'A Learning Journey',
      description: 'Discover fascinating facts and insights about the world around us.',
      genre: 'NON-FICTION'
    }
  ]
}

function StoriesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const topic = searchParams.get('topic') || 'default'
  
  const stories = storyData[topic] || storyData['default']

  const handleBackClick = () => {
    router.back()
  }

  const handleStartReading = (storyId: string) => {
    console.log('Start reading story:', storyId)
    // Navigate to reading page using the story ID
    router.push(`/book/${storyId}/chapter/1`)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <TopNavWithTabs />
      
      <div className="px-32 py-6">
        {/* Back Button */}
        <button 
          onClick={handleBackClick}
          className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 mb-8"
        >
          ← Back
        </button>

        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800">Pick a Story</h1>
        </div>

        {/* Stories Grid */}
        <div className="flex justify-center gap-8 max-w-6xl mx-auto">
          {stories.map((story) => (
            <div 
              key={story.id}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-96 flex flex-col"
            >
              {/* Story Title */}
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
                {story.title}
              </h2>

              {/* Story Description */}
              <p className="text-gray-600 text-center mb-8 flex-grow leading-relaxed">
                {story.description}
              </p>

              {/* Genre Tag and Start Reading Button */}
              <div className="flex items-center justify-between">
                {/* Genre Tag */}
                <div className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 ${
                  story.genre === 'FICTION' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    story.genre === 'FICTION' ? 'bg-green-500' : 'bg-gray-500'
                  }`}></div>
                  {story.genre}
                </div>

                {/* Start Reading Button */}
                <button 
                  onClick={() => handleStartReading(story.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  Start Reading
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function StoriesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StoriesContent />
    </Suspense>
  )
}