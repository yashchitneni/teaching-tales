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
  { id: 'amulet', name: 'Amulet', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/amulet.jpg' },
  { id: 'artemis-fowl', name: 'Artemis Fowl', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/artemis-fowl.jpg' },
  { id: 'babysitters-club', name: "Babysitter's Club", image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/babysitters-club.jpg' },
  { id: 'boss-baby', name: 'Boss Baby', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/boss-baby.jpg' },
  { id: 'dc-comics', name: 'DC Comics Universe', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/dc-comics-universe.jpg' },
  { id: 'dog-man', name: 'Dog Man', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/dog-man.jpg' },
  { id: 'dork-diaries', name: 'Dork Diaries', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/dork-diaries.jpg' },
  { id: 'harry-potter', name: 'Harry Potter', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/harry-potter.jpg' },
  { id: 'lord-of-the-rings', name: 'Lord of the Rings', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/lord-of-the-rings.jpg' },
  { id: 'mario', name: 'Mario', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/mario.jpg' },
  { id: 'marvel', name: 'Marvel', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/marvel.jpg' },
  { id: 'my-hero-academia', name: 'My Hero Academia', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/my-hero-academia.jpg' },
  { id: 'one-piece', name: 'One Piece', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/one-piece.jpg' },
  { id: 'paw-patrol', name: 'Paw Patrol', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/paw-patrol.jpg' },
  { id: 'percy-jackson', name: 'Percy Jackson', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/percy-jackson.jpg' },
  { id: 'pokemon', name: 'Pokémon', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/pokemon.jpg' },
  { id: 'star-wars', name: 'Star Wars', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/star-wars.jpg' },
  { id: 'narnia', name: 'The Chronicles of Narnia', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/narnia.jpg' },
  { id: 'wings-of-fire', name: 'Wings of Fire', image: 'https://d3dp0uoydvg1je.cloudfront.net/universes/wings-of-fire.jpg' },
]

export default function UniverseSelectionPage() {
  const router = useRouter()
  const [selectedUniverse, setSelectedUniverse] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showStreakModal, setShowStreakModal] = useState(false)
  const [showRewardsModal, setShowRewardsModal] = useState(false)

  // Check if user has seen the streak modal before
  useEffect(() => {
    const hasSeenStreakModal = localStorage.getItem('hasSeenStreakModal')
    if (!hasSeenStreakModal) {
      setShowStreakModal(true)
    }
  }, [])

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
      
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex flex-col space-y-0 h-full lg:w-3/4 lg:h-[80vh] lg:max-w-[1152px] max-lg:flex-1 max-lg:h-full">
          {/* Header Section */}
          <div className="flex gap-5 p-4 bg-white rounded-t-2xl border-b border-solid border-gray-200 justify-start items-center max-lg:rounded-none">
            <h2 className="text-3xl font-semibold leading-9 text-neutral-800 max-lg:text-xl">Create a Book</h2>
            <button 
              onClick={() => {}} 
              className="flex items-center gap-2 px-2 py-1 text-sm font-medium bg-white border rounded-full hover:bg-blue-50" style={{ color: '#0d6efd', borderColor: '#0d6efd' }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 640 512">
                <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z"/>
              </svg>
              <span className="md:inline hidden">Create with a Friend</span>
            </button>
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
            <div className="flex justify-between items-center py-3 sticky top-0 z-10 bg-white">
              <div className="flex-col justify-start items-start gap-2 inline-flex">
                <div className="text-xl font-semibold text-left max-lg:text-base max-lg:font-bold text-gray-900">
                  Pick your Book's Universe
                </div>
                <div className="text-sm leading-5 max-w-[834px] text-neutral-800 text-opacity-70 text-left max-lg:hidden">
                  Each world holds endless possibilities. Which one speaks to your imagination?
                </div>
              </div>
              <div className="flex justify-end items-center">
                <form className="flex items-center max-lg:hidden">
                  <input 
                    type="search" 
                    placeholder="Search for a universe..." 
                    className="p-2.5 rounded-lg overflow-hidden border border-gray-200 focus:border-gray-600 focus:outline-none focus:ring-0 sm:w-80" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </form>
              </div>
            </div>

            {/* Universe Grid */}
            <div className="grid grid-cols-4 gap-3 overflow-auto max-md:grid-cols-2 md:max-xl:grid-cols-3 md:max-xl:gap-3 md:max-xl:mt-1">
              {filteredUniverses.map((universe) => (
                <div
                  key={universe.id}
                  onClick={() => handleUniverseSelect(universe.id)}
                  data-testid={`universe-selection-card-${universe.name}`}
                  className={`flex flex-col justify-center w-full text-sm rounded-xl max-md:mt-3 cursor-pointer bg-gray-50 border border-gray-200 max-lg:mt-0 sm:grow ${
                    universe.isLocked ? 'cursor-not-allowed' : ''
                  }`}
                  title={universe.isLocked ? "Get tokens by acing post-chapter quizzes and finding loot boxes" : undefined}
                >
                  <div className="flex overflow-hidden relative flex-col w-full h-[180px]">
                    {/* Checkmark for selected state */}
                    {selectedUniverse === universe.id && !universe.isLocked && (
                      <div className="absolute right-2.5 top-2.5 bg-blue-600 rounded-full w-10 h-10 flex justify-center items-center z-20">
                        <svg className="w-5 h-5" fill="white" viewBox="0 0 448 512">
                          <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
                        </svg>
                      </div>
                    )}
                    {/* Selection shadow */}
                    {selectedUniverse === universe.id && !universe.isLocked && (
                      <div className="absolute top-0 bottom-0 left-0 right-0 rounded-xl z-[1] shadow-[0_0_0_8px_rgba(13,110,253,1)_inset]"></div>
                    )}
                    {universe.isLocked ? (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg 
                            className="w-[60px] h-[60px] text-gray-400 mt-[-20px]" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={1.5} 
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        </div>
                        <div className="absolute left-1.5 top-1.5 px-2 py-1.5 rounded-full text-sm font-bold" style={{ backgroundColor: '#d1e7ff', color: '#0d6efd' }}>
                          Tokens: {universe.tokensRequired}
                        </div>
                        <div className="absolute flex flex-col top-0 left-0 w-full h-full text-black bg-transparent rounded-xl">
                          <div className="px-3 pb-2 mt-auto xl:min-h-20">
                            <div className="relative mb-auto text-left text-base font-medium max-md:mt-5 max-md:mr-2.5">
                              {universe.name}
                            </div>
                            <div className="relative mt-1 text-left opacity-50 max-md:mr-2.5 line-clamp-2">
                              Get tokens by acing post-chapter quizzes and finding loot boxes
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gray-100 rounded-xl">
                          <img 
                            src={universe.image} 
                            alt={universe.name} 
                            className="object-cover absolute inset-0 rounded-xl size-full"
                          />
                        </div>
                        <div className="absolute flex flex-col top-0 left-0 w-full h-full bg-gradient-to-t from-black via-black-500/25 to-transparent text-white rounded-xl">
                          <div className="px-3 pb-2 mt-auto">
                            <div className="mb-auto text-left text-base font-medium max-md:mt-5 max-md:mr-2.5">
                              {universe.name}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Section */}
          <div className="flex flex-col gap-5 p-4 bg-white rounded-b-2xl max-lg:rounded-none max-lg:p-3">
            <div className="flex justify-between items-start">
              <button 
                className="flex-initial justify-center whitespace-nowrap text-white border border-solid px-3.5 py-2 rounded-lg invisible" style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd' }} 
                type="button"
              >
                Back
              </button>
              <button 
                onClick={handleNext}
                disabled={!selectedUniverse}
                className={`flex-initial justify-center whitespace-nowrap text-white border border-solid px-3.5 py-2 rounded-lg ${
                  !selectedUniverse ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd' }}
                type="button" 
                data-testid="submit-button"
              >
                Create Book
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showStreakModal && (
        <StreakModal 
          onClose={() => {
            localStorage.setItem('hasSeenStreakModal', 'true')
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