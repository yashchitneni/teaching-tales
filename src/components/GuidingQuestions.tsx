'use client'

import { Button } from '@/components/ui/button'

interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface GuidingQuestionsProps {
  questions: Question[]
  currentQuestionIndex: number
  onAnswer: (answerIndex: number) => void
  answers: number[]
  selectedAnswer?: number
  onSelectAnswer?: (answerIndex: number) => void
  /** When true, this is the final section of the chapter and the last question should show "View Results" */
  isLastSection?: boolean
}

export function GuidingQuestions({ 
  questions, 
  currentQuestionIndex, 
  onAnswer,
  answers,
  selectedAnswer,
  onSelectAnswer,
  isLastSection = false
}: GuidingQuestionsProps) {
  // Guard against empty list or out-of-bounds index
  if (!questions || questions.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-2 text-gray-900">Guiding Questions</h2>
        <p className="text-sm text-gray-600">No questions available for this section.</p>
      </div>
    )
  }
  const safeIndex = Math.min(Math.max(currentQuestionIndex, 0), questions.length - 1)
  const currentQuestion = questions[safeIndex]
  const hasAnswered = answers[safeIndex] !== undefined
  const hasSelected = selectedAnswer !== undefined

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2 text-gray-900">Guiding Questions</h2>
        <p className="text-sm text-gray-600">
          Answer questions as you read to unlock deeper understanding
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Question {safeIndex + 1} of {questions.length}</span>
          <span>{Math.round(((safeIndex + 1) / questions.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((safeIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Question */}
      <div className="mb-6">
        <h3 className="font-medium mb-4 text-gray-900">{currentQuestion.text}</h3>
        <div className="space-y-3">
          {currentQuestion.options?.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                if (!hasAnswered && onSelectAnswer) {
                  onSelectAnswer(index)
                }
              }}
              disabled={hasAnswered}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                hasAnswered && answers[safeIndex] === index
                  ? answers[safeIndex] === currentQuestion.correctAnswer
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : hasAnswered && index === currentQuestion.correctAnswer
                  ? 'border-green-500 bg-green-50'
                  : hasSelected && selectedAnswer === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              } ${hasAnswered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start">
                <span className={`mr-3 font-medium ${
                  hasSelected && selectedAnswer === index && !hasAnswered 
                    ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center' 
                    : 'text-gray-900'
                }`}>
                  {String.fromCharCode(65 + index)}{hasSelected && selectedAnswer === index && !hasAnswered ? '' : '.'}
                </span>
                <span className="text-gray-900">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Answer & Continue Button - Shows when an option is selected but not answered */}
      {hasSelected && !hasAnswered && (
        <Button
          onClick={() => onAnswer(selectedAnswer)}
          className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Answer & Continue Reading
        </Button>
      )}

      {/* Feedback */}
      {hasAnswered && (
        <>
          <div className={`p-4 rounded-lg mb-4 ${
            answers[safeIndex] === currentQuestion.correctAnswer
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`font-medium mb-2 ${
              answers[safeIndex] === currentQuestion.correctAnswer
                ? 'text-green-800'
                : 'text-red-800'
            }`}>
              {answers[safeIndex] === currentQuestion.correctAnswer
                ? '✅ Excellent! That\'s correct.'
                : `❌ Not quite right. The correct answer is ${String.fromCharCode(65 + currentQuestion.correctAnswer)}.`}
            </p>
            {/* Show the educational explanation */}
            {currentQuestion.explanation && (
              <div className="text-sm text-gray-700 leading-relaxed">
                {answers[safeIndex] === currentQuestion.correctAnswer ? (
                  <p>{currentQuestion.explanation}</p>
                ) : (
                  <>
                    <p className="font-medium text-gray-800 mb-1">Here's why:</p>
                    <p>{currentQuestion.explanation}</p>
                    {/* Additional learning tip for incorrect answers */}
                    <p className="mt-2 italic text-gray-600">
                      💡 Tip: Re-read that section of the story to better understand this detail.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Continue Reading Button */}
          <Button
            onClick={() => onAnswer(-1)} // Special value to signal "next question" or "continue"
            className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {currentQuestionIndex < questions.length - 1
              ? 'Continue Reading'
              : isLastSection
              ? 'View Results'
              : 'Continue Reading'}
          </Button>
        </>
      )}

      {/* Tips Section */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">💡 Reading Tip</h4>
        <p className="text-sm text-blue-800">
          Look for vocabulary words highlighted in blue. Hover over them to see their definitions!
        </p>
      </div>
    </div>
  )
} 