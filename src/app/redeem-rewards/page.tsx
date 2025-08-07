'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { Button } from '@/components/ui/button'
import { CoinCounter } from '@/components/CoinCounter'
import { StepIndicator } from '@/components/StepIndicator'

export default function RedeemRewardsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [coins, setCoins] = useState(100)
  const [robloxUsername, setRobloxUsername] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Mock user's available coins (in real app, this would come from the user's profile)
  const availableCoins = 867
  const minCoins = 100
  const maxCoins = availableCoins
  const stepSize = 50

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!robloxUsername.trim()) {
      alert('Please enter your Roblox username')
      return
    }
    
    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      alert(`Request submitted! You will receive ${coins} Robux to username "${robloxUsername}". Processing typically takes up to 2 days.`)
      setIsSubmitting(false)
      // In real app, this would update the user's coin balance
    }, 1000)
  }

  const handleAlreadyRedeemed = () => {
    alert('If you\'ve already redeemed Robux and are experiencing issues, please contact us at rewards@learnwith.ai')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavWithTabs />
      
      <div className="Protected flex-1">
        <div className="mx-auto sm:mt-8">
          <div className="gap-5 flex w-full max-md:flex-col max-md:items-stretch max-md:gap-0">
            <div className="flex flex-col w-full justify-center items-stretch max-md:w-full max-md:ml-0 md:ml-3 xl:ml-5 max-md:mr-0 md:mr-3 xl:mr-5">
              <div className="size-full flex flex-col items-center mt-4 sm:mt-0">
                <section className="flex flex-col items-center p-6 bg-white rounded-xl border border-gray-200 border-solid max-w-[608px] max-md:px-5">
                  {/* Main Heading */}
                  <h3 className="text-3xl font-bold tracking-tight text-center text-black max-md:max-w-full">
                    Redeem Coins for Robux.
                  </h3>
                  
                  {/* Subtitle */}
                  <p className="self-stretch mt-2 text-base tracking-normal text-center text-neutral-800 text-opacity-70 max-md:max-w-full">
                    You can redeem the coins you've earned by answering quiz questions correctly for Robux.
                  </p>

                  <div className="w-full px-6">
                    {/* Step 1: Swap Coins */}
                    <StepIndicator stepNumber={1}>
                      Swap your coins for Robux
                      <span className="text-xs italic block">
                        Each coin gets you 1 Robux with a minimum of 100 coins.
                      </span>
                    </StepIndicator>

                    {/* Coin Counter */}
                    <CoinCounter
                      value={coins}
                      min={minCoins}
                      max={maxCoins}
                      step={stepSize}
                      onChange={setCoins}
                    />

                    {/* Step 2: Username Input */}
                    <StepIndicator stepNumber={2}>
                      Enter your Roblox user name to receive your Robux.
                    </StepIndicator>

                    <form onSubmit={handleSubmit} className="w-full mt-3 text-base leading-6">
                      <label htmlFor="robloxIdInput" className="sr-only">
                        Enter your user name
                      </label>
                      <input
                        className="w-full py-2 pr-1.5 pl-3.5 text-neutral-800 bg-white rounded-lg border border-gray-300 border-solid max-md:max-w-full"
                        type="text"
                        required
                        id="robloxIdInput"
                        placeholder="Enter your user name"
                        aria-label="Enter your user name"
                        value={robloxUsername}
                        onChange={(e) => setRobloxUsername(e.target.value)}
                      />

                      {/* Step 3: Friend Request */}
                      <StepIndicator stepNumber={3}>
                        Add our account to your friend list. You can find us as{' '}
                        <span className="font-bold italic">TeachTalesRobo</span>. We'll be the ones sending you a friend request if you forget this part!
                      </StepIndicator>

                      {/* Submit Button */}
                      <div className="flex justify-center w-full mt-10">
                        <button
                          type="submit"
                          disabled={isSubmitting || !robloxUsername.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
                          style={{paddingLeft: '80px', paddingRight: '80px'}}
                        >
                          {isSubmitting ? 'Processing...' : 'Submit'}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Processing Time Notice */}
                  <p className="mt-2 text-sm italic tracking-normal text-center text-neutral-800 text-opacity-50">
                    Processing your request typically takes up to 2 days
                  </p>

                  {/* Contact Information */}
                  <section className="italic pt-4 text-neutral-800 text-opacity-70">
                    Problems with your Robux redemption? No worries! Contact us at{' '}
                    <a href="mailto:rewards@learnwith.ai" className="text-blue-600 underline">
                      rewards@learnwith.ai
                    </a>{' '}
                    or message us directly on Roblox—our username is{' '}
                    <span className="font-bold">TeachTalesRobo</span>. Make sure you mention your Roblox username so we can help you right away!
                  </section>

                  {/* Already Redeemed Button */}
                  <div className="flex justify-center w-full mt-8">
                    <button
                      onClick={handleAlreadyRedeemed}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
                    >
                      I already redeemed Robux
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}