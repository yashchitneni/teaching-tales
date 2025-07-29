'use client'

import { Button } from '@/components/ui/button'
import { useState } from 'react'

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
}

export function AssessmentResults({
  questions,
  answers,
  accuracy,
  wordsPerMinute,
  onContinue
}: AssessmentResultsProps) {
  const [satisfaction, setSatisfaction] = useState<number | null>(null)

  const emojis = ['😞', '😕', '😐', '😊', '😄']

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Story Assessment</h2>
        <p className="text-sm text-gray-600">
          Great job completing the chapter!
        </p>
      </div>

      {/* Satisfaction Rating */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">How did you enjoy this story?</h3>
        <div className="flex justify-center gap-3">
          {emojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => setSatisfaction(index)}
              className={`text-3xl p-2 rounded-lg transition-all ${
                satisfaction === index
                  ? 'bg-blue-100 ring-2 ring-blue-500'
                  : 'hover:bg-gray-100'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Quiz Accuracy */}
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-2">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="36"
                stroke="#E5E7EB"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="36"
                stroke="#3B82F6"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(accuracy / 100) * 226} 226`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{accuracy}%</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">Quiz Accuracy</p>
        </div>

        {/* Words Per Minute */}
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-2">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="36"
                stroke="#E5E7EB"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="36"
                stroke="#10B981"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${Math.min(wordsPerMinute / 200, 1) * 226} 226`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{wordsPerMinute}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">Words/Minute</p>
        </div>
      </div>

      {/* Question Results */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Question Results</h3>
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
                    <p className="text-sm font-medium mb-1">{question.text}</p>
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
      <Button
        onClick={onContinue}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        disabled={satisfaction === null}
      >
        Continue to Next Chapter
      </Button>

      {/* Achievement Notification */}
      {accuracy >= 80 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">
            🏆 Great job! You earned 50 coins for high accuracy!
          </p>
        </div>
      )}
    </div>
  )
} 