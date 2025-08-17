'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { TelemetryService } from '@/lib/services/telemetry-service'

export interface ChapterQuizQuestion {
  id: string
  text: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface ChapterQuizProps {
  questions: ChapterQuizQuestion[]
  onComplete: (answers: number[]) => void
  storyId?: string
  gradeLevel?: string
}

export function ChapterQuiz({ questions, onComplete, storyId, gradeLevel }: ChapterQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selected, setSelected] = useState<number | undefined>(undefined)
  const [quizStartTime, setQuizStartTime] = useState<number>(Date.now())
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())

  // PHASE 8.1: Track quiz start
  useEffect(() => {
    TelemetryService.trackUserEvent({
      category: 'chapter_quiz',
      action: 'quiz_started',
      storyId,
      gradeLevel,
      properties: {
        totalQuestions: questions.length,
        questionIds: questions.map(q => q.id).join(',')
      }
    });
    setQuizStartTime(Date.now());
    setQuestionStartTime(Date.now());
  }, [questions, storyId, gradeLevel]);

  const current = questions[currentIndex]
  const hasAnswered = answers[currentIndex] !== undefined
  const hasSelected = selected !== undefined

  const submitCurrent = () => {
    if (selected === undefined) return

    const questionTime = Date.now() - questionStartTime;
    const isCorrect = selected === current.correctAnswer;
    
    // PHASE 8.1: Track individual question answer
    TelemetryService.trackLearningEvent({
      category: 'chapter_quiz',
      action: 'question_answered',
      questionId: current.id,
      storyId,
      gradeLevel,
      isCorrect,
      attemptNumber: 1,
      duration: questionTime,
      properties: {
        questionIndex: currentIndex,
        selectedOption: selected,
        correctOption: current.correctAnswer,
        totalQuestions: questions.length
      }
    });

    const nextAnswers = [...answers]
    nextAnswers[currentIndex] = selected
    setAnswers(nextAnswers)
    setSelected(undefined)
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setQuestionStartTime(Date.now()); // Reset timer for next question
    } else {
      const totalQuizTime = Date.now() - quizStartTime;
      const correctAnswers = nextAnswers.reduce((count, answer, index) => 
        count + (answer === questions[index].correctAnswer ? 1 : 0), 0);
      
      // PHASE 8.1: Track quiz completion
      TelemetryService.trackLearningEvent({
        category: 'chapter_quiz',
        action: 'quiz_completed',
        storyId,
        gradeLevel,
        duration: totalQuizTime,
        properties: {
          totalQuestions: questions.length,
          correctAnswers,
          accuracy: correctAnswers / questions.length,
          averageTimePerQuestion: totalQuizTime / questions.length,
          completionRate: 1.0
        }
      });

      onComplete(nextAnswers)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2 text-gray-900">Chapter Quiz</h2>
        <p className="text-sm text-gray-600">Answer 4 questions about the whole chapter.</p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-4 text-gray-900">{current.text}</h3>
        <div className="space-y-3">
          {current.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelected(idx);
                
                // PHASE 8.1: Track option selection
                TelemetryService.trackUserEvent({
                  category: 'chapter_quiz',
                  action: 'option_selected',
                  questionId: current.id,
                  storyId,
                  gradeLevel,
                  properties: {
                    questionIndex: currentIndex,
                    optionIndex: idx,
                    optionText: option.substring(0, 50) + (option.length > 50 ? '...' : ''),
                    timeToSelect: Date.now() - questionStartTime
                  }
                });
              }}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selected === idx ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-start">
                <span className={`mr-3 font-medium ${selected === idx ? 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center' : 'text-gray-900'}`}>
                  {String.fromCharCode(65 + idx)}{selected === idx ? '' : '.'}
                </span>
                <span className="text-gray-900">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Button onClick={submitCurrent} disabled={!hasSelected} className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white">
        {currentIndex < questions.length - 1 ? 'Next' : 'Submit Quiz'}
      </Button>
    </div>
  )
}


