'use client'

interface ChapterChoice {
  id: string
  title: string
  description: string
  icon: string
}

interface ChapterChoicesProps {
  onChoiceSelect: (choiceId: string) => void
}

const choices: ChapterChoice[] = [
  {
    id: 'share-power',
    title: 'Share the Crystal\'s Power',
    description: 'Pikachu decides to share the discovery with other Pokemon friends',
    icon: '🤝'
  },
  {
    id: 'seek-wisdom',
    title: 'Seek Ancient Wisdom',
    description: 'Journey to find the wise Alakazam who knows about the crystal',
    icon: '🔮'
  },
  {
    id: 'protect-secret',
    title: 'Protect the Secret',
    description: 'Keep the crystal hidden and explore its powers alone',
    icon: '🔒'
  }
]

export function ChapterChoices({ onChoiceSelect }: ChapterChoicesProps) {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6">What Happens Next?</h2>
      
      <div className="grid gap-4">
        {choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => onChoiceSelect(choice.id)}
            className="text-left p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl group-hover:scale-110 transition-transform">
                {choice.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1 group-hover:text-blue-600">
                  {choice.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {choice.description}
                </p>
              </div>
              <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-medium">💡 Tip:</span> Your choice will shape the next chapter of the story. 
          Choose the path that excites you most!
        </p>
      </div>
    </div>
  )
} 