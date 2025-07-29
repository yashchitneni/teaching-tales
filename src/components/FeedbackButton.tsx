'use client'

export function FeedbackButton() {
  return (
    <button 
      className="fixed right-0 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-3 py-6 rounded-l-lg hover:bg-blue-700 transition-colors shadow-lg z-50"
      style={{ writingMode: 'vertical-rl' }}
      onClick={() => {
        // Handle feedback click
        console.log('Feedback clicked')
      }}
    >
      Feedback
    </button>
  )
} 