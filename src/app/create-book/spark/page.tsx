'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'
import { universeNames } from '@/lib/mockData'

interface Spark {
  id: string
  name: string
  image?: string
  description?: string
  isCustom?: boolean
  isSpecial?: boolean
}

// Universe-specific sparks
const sparksByUniverse: Record<string, Spark[]> = {
  'amulet': [
    { id: 'create-own', name: 'Create Your Choice', description: 'Add your own unique choice', isCustom: true },
    { id: 'last-train', name: 'The Last Train at Midnight', image: 'https://d3dp0uoydvg1je.cloudfront.net/article-attributes/e5f6g7h8-i9j0-k1l2-m3n4-o5p6q7r8s9t0.png', isSpecial: true },
    { id: 'mysterious-map', name: 'Mysterious Map in a Bottle', image: 'https://d3dp0uoydvg1je.cloudfront.net/article-attributes/e5a81b3c-1b8e-4f9d-85b0-4e0bc3c3370d.png', isSpecial: true },
    { id: 'playground-pact', name: 'The Playground Pact', image: 'https://d3dp0uoydvg1je.cloudfront.net/article-attributes/c3d4e5f6-g7h8-i9j0-k1l2-m3n4o5p6q7r8.png', isSpecial: true },
    { id: 'rift-opens', name: 'A rift opens, releasing strange creatures into the world', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cfbf691f-c972-4007-bd39-0c1962c00d30/options/1e980d58-f380-4b40-985f-0fbfc73f8846.png' },
    { id: 'amulet-glows', name: 'The amulet begins to glow, pointing to an uncharted region', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cfbf691f-c972-4007-bd39-0c1962c00d30/options/5865612f-c67f-4d77-9380-60761110f342.png' },
    { id: 'fighters-missing', name: 'A group of resistance fighters goes missing during a mission', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cfbf691f-c972-4007-bd39-0c1962c00d30/options/8c41743e-7385-4c2a-a3d2-f683b22fb652.png' },
    { id: 'ancient-artifact', name: 'An ancient artifact is discovered, with powers that rival the amulet itself', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cfbf691f-c972-4007-bd39-0c1962c00d30/options/8f32ebba-3e6d-47e1-b42b-73c54d403a7c.png' },
  ],
  // Default sparks for other universes
  'default': [
    { id: 'create-own', name: 'Create Your Choice', description: 'Add your own unique choice', isCustom: true },
    { id: 'lost-toy', name: 'Lost Toy', isSpecial: true },
    { id: 'new-friend', name: 'New Friend', isSpecial: true },
    { id: 'birthday-party', name: 'Birthday Party', isSpecial: true },
    { id: 'first-day-school', name: 'First Day of School' },
    { id: 'camping-trip', name: 'Camping Trip' },
    { id: 'pet-adventure', name: 'Pet Adventure' },
    { id: 'magic-discovery', name: 'Magic Discovery' },
  ]
}

export default function SparkSelectionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedSpark, setSelectedSpark] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const universe = searchParams.get('universe') || ''
  const character = searchParams.get('character') || ''
  
  // Get sparks for the current universe
  const sparks = sparksByUniverse[universe] || sparksByUniverse['default']
  const universeName = universeNames[universe] || universe

  const filteredSparks = sparks.filter(spark =>
    spark.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSparkSelect = (sparkId: string) => {
    if (sparkId === 'create-own') return // Not implemented yet
    setSelectedSpark(sparkId)
  }

  const handleCreateBook = () => {
    if (!selectedSpark) return
    router.push(`/create-book/loading?universe=${universe}&character=${character}&spark=${selectedSpark}`)
  }

  const handleBack = () => {
    router.push(`/create-book/character?universe=${universe}`)
  }

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
                <div className="h-5 cursor-pointer w-28 max-md:w-auto max-md:flex-1" style={{ backgroundColor: '#0d6efd' }}></div>
                <div className="h-5 cursor-pointer w-28 max-md:w-auto max-md:flex-1" style={{ backgroundColor: '#0d6efd' }}></div>
              </nav>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 flex flex-col gap-5 px-4 overflow-hidden bg-white border-b border-solid border-gray-200 border-opacity-30">
            <div className="flex flex-col gap-3 max-h-full">
              <div className="flex justify-between items-center py-3 sticky top-0 z-10 bg-white">
                <div className="flex-col justify-start items-start gap-2 inline-flex">
                  <div className="text-xl font-semibold text-left max-lg:text-base max-lg:font-bold">
                    What event sets the {universeName} adventure in motion?
                  </div>
                  <div className="text-sm leading-5 max-w-[834px] text-neutral-800 text-opacity-70 text-left max-lg:hidden">
                    {universe === 'amulet' 
                      ? 'Dark forces are stirring in this world of magic and technology - what new danger awaits our heroes?'
                      : 'Choose an event that will drive your adventure forward.'
                    }
                  </div>
                </div>
                <div className="flex justify-end items-center">
                  <form className="flex items-center max-lg:hidden">
                    <input 
                      type="search" 
                      placeholder="Search..." 
                      className="p-2.5 rounded-lg overflow-hidden border border-gray-200 focus:border-gray-600 focus:outline-none focus:ring-0 sm:w-80" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </form>
                </div>
              </div>

              {/* Spark Grid */}
              <div className="grid overflow-auto p-1 grid-cols-4 gap-3 max-md:grid-cols-2 md:max-xl:grid-cols-3 flex-1">
                {filteredSparks.map((spark) => (
                  <div 
                    key={spark.id}
                    className="relative"
                  >
                    <button
                      type="button"
                      onClick={() => handleSparkSelect(spark.id)}
                      data-testid={`spark-option-card-${spark.name}`}
                      className="max-md:mt-3 max-lg:mt-0 w-full sm:grow relative"
                    >
                      <div className={`flex flex-col justify-center w-full text-sm rounded-xl bg-gray-50 border ${
                        spark.isSpecial ? 'border-[#eebf17]' : 'border-gray-200'
                      } cursor-pointer transition-all duration-200`}>
                        <div className="flex overflow-hidden relative flex-col w-full h-[180px]">
                          {/* Checkmark for selected state */}
                          {selectedSpark === spark.id && (
                            <div className="absolute right-2.5 top-2.5 bg-blue-600 rounded-full w-10 h-10 flex justify-center items-center z-20">
                              <svg className="w-5 h-5" fill="white" viewBox="0 0 448 512">
                                <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
                              </svg>
                            </div>
                          )}
                          {/* Selection shadow */}
                          {selectedSpark === spark.id && (
                            <div className="absolute top-0 bottom-0 left-0 right-0 rounded-xl z-[1] shadow-[0_0_0_8px_rgba(13,110,253,1)_inset]"></div>
                          )}
                          {spark.isCustom ? (
                            <>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <svg 
                                  className="w-[60px] h-[60px] text-gray-600 mt-[-20px]"
                                  fill="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                              </div>
                              <div className="absolute flex flex-col top-0 left-0 w-full h-full text-black bg-transparent rounded-xl">
                                <div className="px-3 pb-2 mt-auto xl:min-h-20">
                                  <div className="relative mb-auto text-center text-base font-medium text-gray-800 max-md:mt-5 max-md:mr-2.5">
                                    {spark.name}
                                  </div>
                                  <div className="relative mt-1 text-center opacity-50 max-md:mr-2.5 line-clamp-2">
                                    {spark.description}
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="absolute inset-0 bg-gray-100 rounded-xl overflow-hidden">
                                <img 
                                  src={spark.image} 
                                  alt={spark.name} 
                                  className="object-cover absolute inset-0 rounded-xl w-full h-full"
                                />
                              </div>
                              {spark.isSpecial && (
                                <div className="absolute top-0 left-0 right-0 bottom-0 rounded-xl z-[1] pointer-events-none" style={{
                                  border: '3px solid #eebf17',
                                  borderBottom: '6px solid #eebf17'
                                }}></div>
                              )}
                              <div className="absolute flex flex-col top-0 left-0 w-full h-full bg-gradient-to-t from-black via-black-500/25 to-transparent text-white rounded-xl">
                                <div className="px-3 pb-2 mt-auto">
                                  <div className="relative mb-auto text-left text-base font-medium flex items-end gap-2">
                                    {spark.name}
                                    {spark.isSpecial && (
                                      <svg className="text-yellow-400 mb-1 w-4 h-4" fill="currentColor" viewBox="0 0 576 512">
                                        <path d="M309 106c11.4-7 19-19.7 19-34c0-22.1-17.9-40-40-40s-40 17.9-40 40c0 14.4 7.6 27 19 34L209.7 220.6c-9.1 18.2-32.7 23.4-48.6 10.7L72 160c5-6.7 8-15 8-24c0-22.1-17.9-40-40-40S0 113.9 0 136s17.9 40 40 40c.2 0 .5 0 .7 0L86.4 427.4c5.5 30.4 32 52.6 63 52.6H426.6c30.9 0 57.4-22.1 63-52.6L535.3 176c.2 0 .5 0 .7 0c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40c0 9 3 17.3 8 24l-89.1 71.3c-15.9 12.7-39.5 7.5-48.6-10.7L309 106z"/>
                                      </svg>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="flex flex-col gap-5 p-4 bg-white rounded-b-2xl max-lg:rounded-none max-lg:p-3">
            <div className="flex justify-between items-start">
              <button 
                onClick={handleBack}
                className="flex-initial justify-center whitespace-nowrap text-white border border-solid px-3.5 py-2 rounded-lg" style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd' }} 
                type="button"
              >
                Back
              </button>
              <button 
                onClick={handleCreateBook}
                disabled={!selectedSpark}
                className={`flex-initial justify-center whitespace-nowrap text-white border border-solid px-3.5 py-2 rounded-lg ${
                  !selectedSpark ? 'opacity-50 cursor-not-allowed' : ''
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

      <FeedbackButton />
    </div>
  )
}