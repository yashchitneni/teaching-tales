'use client'

import { Button } from '@/components/ui/button'

interface RewardsModalProps {
  onClose: () => void
}

export function RewardsModal({ onClose }: RewardsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 relative p-8">
        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-4">Earn Amazing Rewards!</h2>

        {/* Subtext */}
        <p className="text-center text-gray-600 mb-6">
          Get high accuracy in your quizzes to unlock loot boxes that may contain 
          Video Generation Tokens, Universe or Character Creation Tokens, Special 
          Character and Event Cards, and Coins!
        </p>

        {/* Reward Cards Display */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6 relative">
          <div className="flex items-center justify-center space-x-4 flex-wrap">
            {/* Universe Token */}
            <div className="bg-blue-100 rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">🌍</div>
              <p className="text-xs font-medium">+1 Universe<br/>Token Earned!</p>
            </div>

            {/* Character Card */}
            <div className="bg-yellow-100 rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">👸</div>
              <p className="text-xs font-medium">Taylor Swift 👑</p>
            </div>

            {/* Loot Box */}
            <div className="bg-brown-100 rounded-lg p-4">
              <div className="text-3xl">📦</div>
            </div>

            {/* Event Card */}
            <div className="bg-purple-100 rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">👽</div>
              <p className="text-xs font-medium">Alien Invasion 👑</p>
            </div>

            {/* Coins */}
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">🪙</div>
              <p className="text-xs font-medium">+3</p>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-gray-600 mb-6">
          Use these cards to create your own amazing books, and create videos for them!
        </p>

        {/* Pagination Dot */}
        <div className="flex justify-center mb-4">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>

        {/* Get Started Button */}
        <div className="flex justify-end">
          <Button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  )
} 