'use client'

import { Button } from '@/components/ui/button'

interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number
}

interface GuidingQuestionsProps {
  questions: Question[]
  currentQuestionIndex: number
  onAnswer: (answerIndex: number) => void
  answers: number[]
}

export function GuidingQuestions({ 
  questions, 
  currentQuestionIndex, 
  onAnswer,
  answers 
}: GuidingQuestionsProps) {
  const currentQuestion = questions[currentQuestionIndex]
  const hasAnswered = answers[currentQuestionIndex] !== undefined

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Guiding Questions</h2>
        <p className="text-sm text-gray-600">
          Answer questions as you read to unlock deeper understanding
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Question */}
      <div className="mb-6">
        <h3 className="font-medium mb-4">{currentQuestion.text}</h3>
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => !hasAnswered && onAnswer(index)}
              disabled={hasAnswered}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                hasAnswered && answers[currentQuestionIndex] === index
                  ? answers[currentQuestionIndex] === currentQuestion.correctAnswer
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : hasAnswered && index === currentQuestion.correctAnswer
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              } ${hasAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start">
                <span className="mr-3 font-medium">{String.fromCharCode(65 + index)}.</span>
                <span>{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {hasAnswered && (
        <div className={`p-4 rounded-lg mb-6 ${
          answers[currentQuestionIndex] === currentQuestion.correctAnswer
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          <p className="font-medium">
            {answers[currentQuestionIndex] === currentQuestion.correctAnswer
              ? '✅ Excellent! That\'s correct.'
              : '❌ Not quite right. The correct answer is highlighted above.'}
          </p>
        </div>
      )}

      {/* Tips Section */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Reading Tip</h4>
        <p className="text-sm text-blue-800">
          Look for vocabulary words highlighted in yellow. Hover over them to see their definitions!
        </p>
      </div>
    </div>
  )
} 