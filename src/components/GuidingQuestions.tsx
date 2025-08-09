'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

interface QuestionStatusState {
  questionsReady: boolean;
  status: 'pending' | 'generating' | 'creating_assessments' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  previouslyReady?: boolean;
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
  /** Stimulus ID for async question status polling */
  stimulusId?: string
}

export function GuidingQuestions({ 
  questions, 
  currentQuestionIndex, 
  onAnswer,
  answers,
  selectedAnswer,
  onSelectAnswer,
  isLastSection = false,
  stimulusId
}: GuidingQuestionsProps) {
  const [questionStatus, setQuestionStatus] = useState<QuestionStatusState>({
    questionsReady: questions.length > 0,
    status: questions.length > 0 ? 'completed' : 'pending'
  });
  
  // Enhanced state for status change detection and notifications
  const [showNotification, setShowNotification] = useState(false);
  const [lastKnownStatus, setLastKnownStatus] = useState<string>('');
  
  // Add ARIA live region for status announcements
  const [announcements, setAnnouncements] = useState<string>('');

  // Add toast notifications for status changes
  const { addToast } = useToast();

  // Add retry logic
  const handleRetryQuestions = async () => {
    setQuestionStatus(prev => ({ ...prev, status: 'pending' }));
    
    try {
      // Trigger a fresh question generation request
      const response = await fetch('/api/story-question-status/' + stimulusId + '?retry=true', {
        method: 'POST'
      });
      
      if (response.ok) {
        const status = await response.json();
        setQuestionStatus(status);
      }
    } catch (error) {
      console.error('Failed to retry question generation:', error);
    }
  };

  const handleStatusChange = (newStatus: string, oldStatus: string) => {
    if (newStatus === 'completed' && oldStatus !== 'completed') {
      addToast({
        type: 'success',
        title: '🎉 Your Questions Are Ready!',
        description: 'Scroll down to test your comprehension',
        duration: 8000,
        action: {
          label: 'Jump to Questions',
          onClick: () => {
            const questionsElement = document.querySelector('.guiding-questions');
            questionsElement?.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    } 
    
    else if (newStatus === 'failed') {
      addToast({
        type: 'warning',
        title: 'Questions Temporarily Unavailable',
        description: 'You can still enjoy reading! We\'ll try to add questions later.',
        duration: 10000,
        action: {
          label: 'Try Again',
          onClick: handleRetryQuestions
        }
      });
    }
    
    else if (newStatus === 'generating' && oldStatus === 'pending') {
      addToast({
        type: 'info',
        title: '🤖 AI at Work',
        description: 'Creating personalized questions for your reading level',
        duration: 4000
      });
    }
  };

  // Enhanced status change detection with notifications
  useEffect(() => {
    if (questionStatus.status !== lastKnownStatus && lastKnownStatus !== '') {
      if (questionStatus.status === 'completed' && lastKnownStatus !== 'completed') {
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000); // Auto-hide after 5s
      }
      
      // Hook for future notification system (Phase 6.3)
      handleStatusChange(questionStatus.status, lastKnownStatus);
      setLastKnownStatus(questionStatus.status);
    }
  }, [questionStatus.status, lastKnownStatus]);

  // Screen reader announcements for status changes
  useEffect(() => {
    let announcement = '';
    
    switch (questionStatus.status) {
      case 'pending':
        announcement = 'Questions are being prepared for this chapter.';
        break;
      case 'generating':
        announcement = 'AI is generating comprehension questions. Please continue reading.';
        break;
      case 'creating_assessments':
        announcement = 'Questions are almost ready. Creating interactive assessments.';
        break;
      case 'completed':
        announcement = 'Comprehension questions are now available.';
        break;
      case 'failed':
        announcement = 'There was an issue creating questions. You can still read the story.';
        break;
    }
    
    if (announcement && announcement !== announcements) {
      setAnnouncements(announcement);
    }
  }, [questionStatus.status, announcements]);

  // Add keyboard shortcuts for common actions
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle keys when questions are ready and component is focused
      if (!questionStatus.questionsReady || !questions.length) return;
      
      const currentQuestion = questions[Math.min(Math.max(currentQuestionIndex, 0), questions.length - 1)];
      const hasAnswered = answers[Math.min(Math.max(currentQuestionIndex, 0), questions.length - 1)] !== undefined;
      const hasSelected = selectedAnswer !== undefined;
      
      switch (event.key) {
        case '1':
        case '2':
        case '3':
        case '4':
          event.preventDefault();
          const index = parseInt(event.key) - 1;
          if (index < currentQuestion.options.length && !hasAnswered && onSelectAnswer) {
            onSelectAnswer(index);
          }
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (hasSelected && !hasAnswered) {
            onAnswer(selectedAnswer);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [questionStatus.questionsReady, questions.length, currentQuestionIndex, answers, selectedAnswer, onSelectAnswer, onAnswer]);

  // Focus management for questions becoming ready
  const questionsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // When questions become ready, announce and optionally focus
    if (questionStatus.questionsReady && !questionStatus.previouslyReady) {
      setQuestionStatus(prev => ({ ...prev, previouslyReady: true }));
      
      // Announce to screen readers
      setAnnouncements('Questions are now ready. You can navigate to them or continue reading.');
      
      // Optional: Focus questions section for keyboard users
      // (Only if user preference or accessibility setting indicates)
      const focusQuestions = localStorage.getItem('auto-focus-questions') === 'true';
      if (focusQuestions && questionsContainerRef.current) {
        setTimeout(() => {
          questionsContainerRef.current?.focus();
        }, 1000); // Brief delay to let user finish reading
      }
    }
  }, [questionStatus.questionsReady]);

  // Improved loading animation with estimated time
  const getEstimatedTime = (progress: number = 0) => {
    if (progress === 0) return "30-45 seconds";
    const remainingProgress = 1 - progress;
    const estimatedSeconds = Math.ceil(remainingProgress * 45);
    return `${estimatedSeconds} seconds`;
  };

  const getStatusMessage = (status: string): string => {
    switch (status) {
      case 'pending': return '🎯 Analyzing your story content';
      case 'generating': return '🤖 AI is writing your questions';
      case 'creating_assessments': return '📝 Preparing interactive quizzes';
      case 'completed': return '✅ Questions ready!';
      case 'failed': return '⚠️ Having trouble - trying again';
      default: return '🔄 Processing your request';
    }
  };

  // Poll for question status if questions aren't ready and we have a stimulus ID
  useEffect(() => {
    if (questionStatus.questionsReady || questionStatus.status === 'failed' || !stimulusId) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/story-question-status/${stimulusId}`);
        if (response.ok) {
          const status = await response.json();
          setQuestionStatus(status);
          
          // If questions are ready, refresh the page to load them
          // In production, you might want to fetch questions directly instead
          if (status.questionsReady && !questions.length) {
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('Failed to check question status:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [stimulusId, questionStatus.questionsReady, questions.length]);

  // Handle different question states
  if (!questionStatus.questionsReady && stimulusId) {
    return (
      <div 
        className="p-4 sm:p-6 transition-all duration-500 ease-in-out"
        role="status"
        aria-label="Questions are being prepared"
      >
        {/* Live region for status updates */}
        <div 
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
        >
          {announcements}
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-6 relative overflow-hidden">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/30 to-purple-100/30 opacity-50 animate-pulse" />
          
          <div className="relative z-10 text-center">
            {/* Accessible spinner */}
            <div 
              className="relative mb-3 sm:mb-4"
              aria-hidden="true"
            >
              <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-2 sm:border-3 border-blue-600 border-t-transparent mx-auto" />
              <div className="absolute inset-0 rounded-full border-2 sm:border-3 border-blue-200 animate-ping mx-auto" />
            </div>
            
            <h3 
              className="text-base sm:text-lg font-semibold text-blue-900 mb-2"
              id="questions-status-title"
            >
              ✨ Crafting Your Questions
            </h3>
            
            <p 
              className="text-sm sm:text-base text-blue-700 mb-4 leading-relaxed"
              aria-describedby="questions-status-title"
            >
              Our AI is creating personalized questions.
              <br className="hidden sm:block" />
              <span className="text-xs sm:text-sm">
                Keep reading - about {getEstimatedTime(questionStatus.progress)} remaining
              </span>
            </p>
            
            {/* Accessible progress bar */}
            {questionStatus.progress !== undefined && (
              <div 
                className="space-y-2"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(questionStatus.progress * 100)}
                aria-label="Question generation progress"
              >
                <div className="w-full bg-blue-200 rounded-full h-2 sm:h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${Math.round(questionStatus.progress * 100)}%` }}
                  />
                </div>
                <p className="text-xs sm:text-sm text-blue-600 font-medium">
                  {Math.round(questionStatus.progress * 100)}% Complete
                </p>
              </div>
            )}
            
            {/* Status message with proper semantics */}
            <div className="mt-4 p-3 bg-white/50 rounded-lg">
              <p 
                className="text-sm text-blue-800 capitalize font-medium"
                role="status"
                aria-live="polite"
              >
                {getStatusMessage(questionStatus.status)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Mobile reading tips */}
        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">💡 While You Wait</h4>
          <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
            <li>• Tap blue words for definitions</li>
            <li>• Think about the main character</li>
            <li className="hidden sm:block">• Consider what might happen next</li>
          </ul>
        </div>
      </div>
    );
  }

  if (questionStatus.status === 'failed') {
    return (
      <EnhancedErrorState />
    );
  }

  // Enhanced error state component
  const EnhancedErrorState = () => {
    const [showErrorDetails, setShowErrorDetails] = useState(false);

    return (
      <div className="p-6">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛠️</span>
            </div>
            
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Questions Temporarily Unavailable
            </h3>
            
            <p className="text-yellow-700 mb-6">
              Our AI encountered a hiccup while creating your questions. 
              Don't worry - you can still enjoy the full story experience!
            </p>
            
            {/* Recovery actions */}
            <div className="space-y-3">
              <button 
                onClick={handleRetryQuestions}
                className="w-full bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors font-medium"
              >
                🔄 Try Again
              </button>
              
              <button 
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                className="w-full text-yellow-700 hover:text-yellow-800 transition-colors text-sm"
              >
                {showErrorDetails ? 'Hide Details' : 'Show Technical Details'}
              </button>
            </div>
            
            {/* Expandable error details for debugging */}
            {showErrorDetails && (
              <div className="mt-4 p-3 bg-white/60 rounded-lg text-left">
                <p className="text-xs text-gray-600 font-mono">
                  Error: {questionStatus.error || 'Unknown error occurred'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Story ID: {stimulusId} | Time: {new Date().toLocaleString()}
                </p>
              </div>
            )}
            
            {/* Alternative activities */}
            <div className="mt-6 p-4 bg-white/70 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">💭 Try These Instead</h4>
              <ul className="text-sm text-gray-700 space-y-1 text-left">
                <li>• Summarize what you've read so far</li>
                <li>• Predict what will happen next</li>
                <li>• Find your favorite vocabulary word</li>
                <li>• Discuss the story with a friend or parent</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Guard against empty list or out-of-bounds index
  if (!questions || questions.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Questions Available
            </h3>
            <p className="text-gray-600">
              This story doesn't have comprehension questions yet.
            </p>
          </div>
        </div>
      </div>
    )
  }
  const safeIndex = Math.min(Math.max(currentQuestionIndex, 0), questions.length - 1)
  const currentQuestion = questions[safeIndex]
  const hasAnswered = answers[safeIndex] !== undefined
  const hasSelected = selectedAnswer !== undefined

  return (
    <div 
      ref={questionsContainerRef}
      className="p-6 guiding-questions"
      tabIndex={-1}
      aria-label="Comprehension questions section"
    >
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
        <h3 id="question-text" className="font-medium mb-4 text-gray-900">{currentQuestion.text}</h3>
        <div className="space-y-3" role="radiogroup" aria-labelledby="question-text">
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
              role="radio"
              aria-checked={hasSelected && selectedAnswer === index}
              aria-describedby={hasAnswered ? `answer-${index}-feedback` : undefined}
              tabIndex={0}
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
        
        {/* Keyboard Navigation Hints */}
        {!hasAnswered && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">⌨️ Keyboard Shortcuts</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Press 1-4 to select answers</li>
              <li>• Press Enter or Space to submit</li>
              <li>• Use Tab to navigate</li>
            </ul>
          </div>
        )}
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