'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface NextChapterChoiceProps {
  options: { id: string; label: string; description?: string }[]
  onSelect: (id: string) => void
}

export function NextChapterChoice({ options, onSelect }: NextChapterChoiceProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2 text-gray-900">Choose the Next Spark</h2>
        <p className="text-sm text-gray-600">Pick how the next chapter should begin.</p>
      </div>

      <div className="space-y-3 mb-6">
        {options.map(opt => (
          <button
            key={opt.id}
            onClick={() => setSelectedId(opt.id)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedId === opt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <div className="flex items-start">
              <span className={`mr-3 font-medium ${selectedId === opt.id ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center' : 'text-gray-900'}`}>✓</span>
              <div>
                <p className="text-gray-900 font-medium">{opt.label}</p>
                {opt.description && <p className="text-sm text-gray-600">{opt.description}</p>}
              </div>
            </div>
          </button>
        ))}
      </div>

      <Button
        onClick={() => selectedId && onSelect(selectedId)}
        disabled={!selectedId}
        className="w-full mb-2 bg-blue-600 hover:bg-blue-700 text-white"
      >
        Continue
      </Button>
    </div>
  )
}


