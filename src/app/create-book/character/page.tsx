'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'

interface Character {
  id: string
  name: string
  image: string
  isSpecial?: boolean
  isCustom?: boolean
}

const characters: Character[] = [
  { id: 'create-own', name: 'Create Your Choice', image: '', isCustom: true },
  { id: 'spiderman', name: 'Spiderman', image: '/characters/spiderman.jpg', isSpecial: true },
  { id: 'cinderella', name: 'Cinderella', image: '/characters/cinderella.jpg', isSpecial: true },
  { id: 'albert-einstein', name: 'Albert Einstein', image: '/characters/einstein.jpg', isSpecial: true },
  { id: 'patrick-mahomes', name: 'Patrick Mahomes', image: '/characters/mahomes.jpg', isSpecial: true },
  { id: 'emily-hayes', name: 'Emily Hayes', image: '/characters/emily.jpg' },
  { id: 'navin-hayes', name: 'Navin Hayes', image: '/characters/navin.jpg' },
  { id: 'miskit', name: 'Miskit', image: '/characters/miskit.jpg' },
  { id: 'trellis', name: 'Trellis', image: '/characters/trellis.jpg' },
  { id: 'leon-redbeard', name: 'Leon Redbeard', image: '/characters/leon.jpg' },
]

export default function CharacterSelectionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const universe = searchParams.get('universe')
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleCharacterSelect = (characterId: string) => {
    if (characterId === 'create-own') return // Not implemented yet
    setSelectedCharacter(characterId)
  }

  const handleNext = () => {
    if (selectedCharacter && universe) {
      router.push(`/create-book/spark?universe=${universe}&character=${selectedCharacter}`)
    }
  }

  const handleBack = () => {
    router.push('/create-book/universe')
  }

  const filteredCharacters = characters.filter(character =>
    character.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavWithTabs />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header with Progress */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Create a Book</h1>
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Create with a Friend
            </Button>
            {/* Progress Bar */}
            <div className="flex items-center space-x-1">
              <div className="w-24 h-2 bg-blue-600 rounded-full"></div>
              <div className="w-24 h-2 bg-blue-600 rounded-full"></div>
              <div className="w-24 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-24 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">
            Who will take the lead in your {universe === 'amulet' ? 'Amulet' : universe} adventure?
          </h2>
          <p className="text-gray-600">
            The power of the Amulet chooses its bearer carefully – who will step forward to face its challenges?
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex justify-end">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute right-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {filteredCharacters.map((character) => (
            <div
              key={character.id}
              onClick={() => handleCharacterSelect(character.id)}
              className={`relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                selectedCharacter === character.id
                  ? 'ring-4 ring-yellow-400 shadow-lg'
                  : 'hover:shadow-md'
              }`}
            >
              {character.isCustom ? (
                <div className="bg-gray-200 p-4 h-48 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full mb-2 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-sm mb-1">{character.name}</h3>
                  <p className="text-xs text-gray-600">Add your own unique choice</p>
                </div>
              ) : (
                <div className="bg-gray-200 h-48 flex items-end justify-center relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-gray-300 rounded-full"></div>
                  </div>
                  <div className="bg-white/90 w-full py-2 px-2 text-center">
                    <h3 className="font-medium text-sm">
                      {character.name} {character.isSpecial && '👑'}
                    </h3>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            onClick={handleBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!selectedCharacter}
            className={`px-6 py-2 ${
              selectedCharacter
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 cursor-not-allowed text-gray-500'
            }`}
          >
            Next
          </Button>
        </div>
      </main>

      <FeedbackButton />
    </div>
  )
}