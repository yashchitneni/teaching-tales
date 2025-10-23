'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'
import { SparkSelector } from '@/components/SparkSelector'
import { universeNames } from '@/lib/mockData'


export default function SparkSelectionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedSpark, setSelectedSpark] = useState<string>('')
  const [selectedSparkLabel, setSelectedSparkLabel] = useState<string>('')

  const universe = searchParams.get('universe') || ''
  const character = searchParams.get('character') || ''
  const universeName = universeNames[universe] || universe

  const handleSparkSelect = (sparkId: string, sparkLabel: string) => {
    if (sparkId === 'create-own') {
      // Navigate to create spark page
      const params = new URLSearchParams(searchParams.toString())
      router.push(`/create-book/create-spark?${params.toString()}`)
      return
    }
    setSelectedSpark(sparkId)
    setSelectedSparkLabel(sparkLabel)
  }

  const handleCreateBook = () => {
    if (!selectedSpark) return
    router.push(`/create-book/loading?universe=${universe}&character=${character}&spark=${selectedSparkLabel}`)
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
                  <div className="text-xl font-semibold text-left max-lg:text-base max-lg:font-bold text-gray-900">
                    What event sets the {universeName} adventure in motion?
                  </div>
                  <div className="text-sm leading-5 max-w-[834px] text-neutral-800 text-opacity-70 text-left max-lg:hidden">
                    {universe === 'amulet' 
                      ? 'Dark forces are stirring in this world of magic and technology - what new danger awaits our heroes?'
                      : 'Choose an event that will drive your adventure forward.'
                    }
                  </div>
                </div>
              </div>

              {/* New SparkSelector Component */}
              <div className="flex-1 overflow-auto">
                <SparkSelector
                  universe={universe}
                  character={character}
                  selectedSpark={selectedSpark}
                  onSparkSelect={handleSparkSelect}
                  className="max-w-4xl mx-auto"
                />
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