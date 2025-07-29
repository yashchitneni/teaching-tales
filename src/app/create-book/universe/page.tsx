'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'
import { StreakModal } from '@/components/StreakModal'
import { RewardsModal } from '@/components/RewardsModal'

interface Universe {
  id: string
  name: string
  image: string
  isLocked?: boolean
  tokensRequired?: number
}

const universes: Universe[] = [
  { id: 'create-own', name: 'Create Your Own Universe', image: '', isLocked: true, tokensRequired: 0 },
  { id: 'amulet', name: 'Amulet', image: '/universes/amulet.jpg' },
  { id: 'artemis-fowl', name: 'Artemis Fowl', image: '/universes/artemis-fowl.jpg' },
  { id: 'babysitters-club', name: "Babysitter's Club", image: '/universes/babysitters-club.jpg' },
  { id: 'boss-baby', name: 'Boss Baby', image: '/universes/boss-baby.jpg' },
  { id: 'dc-comics', name: 'DC Comics Universe', image: '/universes/dc-comics.jpg' },
  { id: 'dog-man', name: 'Dog Man', image: '/universes/dog-man.jpg' },
  { id: 'dork-diaries', name: 'Dork Diaries', image: '/universes/dork-diaries.jpg' },
  { id: 'harry-potter', name: 'Harry Potter', image: '/universes/harry-potter.jpg' },
  { id: 'lord-of-the-rings', name: 'Lord of the Rings', image: '/universes/lotr.jpg' },
  { id: 'mario', name: 'Mario', image: '/universes/mario.jpg' },
  { id: 'marvel', name: 'Marvel', image: '/universes/marvel.jpg' },
  { id: 'my-hero-academia', name: 'My Hero Academia', image: '/universes/mha.jpg' },
  { id: 'avatar', name: 'Avatar: The Last Airbender', image: '/universes/avatar.jpg' },
]

export default function UniverseSelectionPage() {
  const router = useRouter()
  const [selectedUniverse, setSelectedUniverse] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showStreakModal, setShowStreakModal] = useState(true)
  const [showRewardsModal, setShowRewardsModal] = useState(false)

  const handleUniverseSelect = (universeId: string) => {
    if (universeId === 'create-own') return // Locked
    setSelectedUniverse(universeId)
  }

  const handleNext = () => {
    if (selectedUniverse) {
      router.push(`/create-book/character?universe=${selectedUniverse}`)
    }
  }

  const filteredUniverses = universes.filter(universe =>
    universe.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavWithTabs />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Create a Book</h1>
          <Button variant="outline" className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Create with a Friend
          </Button>
        </div>

        {/* Section Title */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Pick your Book's Universe</h2>
          <p className="text-gray-600">
            Each world holds endless possibilities. Which one speaks to your imagination?
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex justify-end">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search for a universe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute right-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Universe Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {filteredUniverses.map((universe) => (
            <div
              key={universe.id}
              onClick={() => handleUniverseSelect(universe.id)}
              className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                selectedUniverse === universe.id
                  ? 'ring-4 ring-blue-500 shadow-lg'
                  : 'hover:shadow-md'
              } ${universe.isLocked ? 'opacity-75' : ''}`}
            >
              {universe.isLocked ? (
                <div className="bg-gray-200 p-4 h-48 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full mb-2 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-sm mb-1">{universe.name}</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    Get tokens by acing post-chapter quizzes and finding loot boxes
                  </p>
                  <p className="text-xs font-medium">Tokens: {universe.tokensRequired}</p>
                </div>
              ) : (
                <div className="bg-gray-200 h-48 flex items-center justify-center">
                  <h3 className="font-medium text-center px-2">{universe.name}</h3>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Create Book Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleNext}
            disabled={!selectedUniverse}
            className={`px-8 py-3 ${
              selectedUniverse
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Create Book
          </Button>
        </div>
      </main>

      {/* Modals */}
      {showStreakModal && (
        <StreakModal 
          onClose={() => {
            setShowStreakModal(false)
            setShowRewardsModal(true)
          }} 
        />
      )}

      {showRewardsModal && (
        <RewardsModal 
          onClose={() => setShowRewardsModal(false)} 
        />
      )}

      <FeedbackButton />
    </div>
  )
}