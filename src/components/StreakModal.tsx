'use client'

interface StreakModalProps {
  onClose: () => void
}

export function StreakModal({ onClose }: StreakModalProps) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const currentDay = 1 // Tuesday

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Fire Icon */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">🔥</div>
          <h2 className="text-2xl font-bold">Start your streak</h2>
        </div>

        {/* Week Tracker */}
        <div className="flex justify-center space-x-2 mb-6">
          {days.map((day, index) => (
            <div key={day} className="text-center">
              <div className="text-xs text-gray-600 mb-1">{day}</div>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index === currentDay
                    ? 'bg-yellow-400 text-white'
                    : 'border-2 border-gray-300'
                }`}
              >
                {index === currentDay && '✓'}
              </div>
            </div>
          ))}
        </div>

        {/* Message */}
        <p className="text-center text-gray-600">
          Read stories and earn coins to start your streak. The more you read, 
          the more rewards you'll unlock. Don't stop now — exciting adventures 
          and bonuses await!
        </p>
      </div>
    </div>
  )
} 