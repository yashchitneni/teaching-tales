'use client'

import { Button } from '@/components/ui/button'

interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number
}

interface AssessmentResultsProps {
  questions: Question[]
  answers: number[]
  accuracy: number
  wordsPerMinute: number
  onContinue: () => void
  continueLabel?: string
  hideContinue?: boolean
}

export function AssessmentResults({
  questions,
  answers,
  accuracy,
  wordsPerMinute,
  onContinue,
  continueLabel = 'Continue to Next Section',
  hideContinue = false
}: AssessmentResultsProps) {

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2 text-gray-900">Story Assessment</h2>
        <p className="text-sm text-gray-600">Great job completing the chapter!</p>
      </div>

      {/* Performance Metrics */}
      <div className="mb-6 grid grid-cols-1 gap-4">
        {/* Quiz Accuracy - gauge */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-center font-semibold text-gray-900 mb-2">Quiz Accuracy</h3>
          <div className="relative w-full h-32">
            <svg viewBox="0 0 200 120" className="w-full h-full">
              {/* Background semicircle */}
              <path d="M10 110 A 90 90 0 0 1 190 110" fill="none" stroke="#E5E7EB" strokeWidth="18" />
              {/* Red low zone (0-40%) */}
              <path d="M10 110 A 90 90 0 0 1 82 52" fill="none" stroke="#EF4444" strokeWidth="18" />
              {/* Grey mid zone (40-80%) */}
              <path d="M82 52 A 90 90 0 0 1 154 52" fill="none" stroke="#9CA3AF" strokeWidth="18" />
              {/* Green high zone (80-100%) */}
              <path d="M154 52 A 90 90 0 0 1 190 110" fill="none" stroke="#10B981" strokeWidth="18" />

              {/* Needle */}
              {(() => {
                const angle = (accuracy / 100) * 180 - 180 // -180 to 0 degrees
                const radians = (angle * Math.PI) / 180
                const cx = 100
                const cy = 110
                const r = 70
                const x = cx + r * Math.cos(radians)
                const y = cy + r * Math.sin(radians)
                return (
                  <g>
                    <line x1={cx} y1={cy} x2={x} y2={y} stroke="#374151" strokeWidth="4" strokeLinecap="round" />
                    <circle cx={cx} cy={cy} r="6" fill="#374151" />
                  </g>
                )
              })()}
              {/* Labels */}
              <text x="100" y="115" textAnchor="middle" fontSize="16" fontWeight="700" fill="#111827">{accuracy}%</text>
            </svg>
          </div>
          {(() => {
            const total = questions.length
            const correct = answers.reduce((c, a, i) => c + (a === questions[i]?.correctAnswer ? 1 : 0), 0)
            return (
              <p className="mt-2 text-center text-xs text-gray-600">{correct} of {total} correct</p>
            )
          })()}
        </div>

        {/* Words Per Minute - numeric stat */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-center font-semibold text-gray-900 mb-3">Words Per Minute</h3>
          {(() => {
            const wpm = Math.max(0, Math.round(wordsPerMinute))
            const tier = wpm >= 120 ? 'Fast' : wpm >= 80 ? 'Good' : 'Warming Up'
            const tierColor = wpm >= 120 ? 'bg-green-100 text-green-800 ring-green-200' : wpm >= 80 ? 'bg-amber-100 text-amber-800 ring-amber-200' : 'bg-gray-100 text-gray-800 ring-gray-200'
            return (
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-baseline">
                  <span className="text-5xl font-extrabold text-gray-900">{wpm}</span>
                  <span className="ml-2 text-sm font-semibold text-gray-500">WPM</span>
                </div>
                <span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${tierColor}`}>{tier}</span>
                <p className="mt-2 text-xs text-gray-600">Your current reading speed</p>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Question Results */}
      <div className="mb-6">
        <h3 className="font-medium mb-3 text-gray-900">Question Results</h3>
        <div className="space-y-3">
          {questions.map((question, index) => {
            const isCorrect = answers[index] === question.correctAnswer
            return (
              <div
                key={question.id}
                className={`p-3 rounded-lg border ${
                  isCorrect
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1 text-gray-900">{question.text}</p>
                    <p className="text-xs text-gray-600">
                      Your answer: {question.options[answers[index]]}
                    </p>
                    {!isCorrect && (
                      <p className="text-xs text-green-700 mt-1">
                        Correct: {question.options[question.correctAnswer]}
                      </p>
                    )}
                  </div>
                  <div className="ml-2">
                    {isCorrect ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Continue Button */}
      {!hideContinue && (
        <Button
          onClick={onContinue}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {continueLabel}
        </Button>
      )}

      {/* Achievement Notification */}
      {accuracy >= 80 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            🏆 Great job! You earned 50 coins for high accuracy!
          </p>
        </div>
      )}
    </div>
  )
} 