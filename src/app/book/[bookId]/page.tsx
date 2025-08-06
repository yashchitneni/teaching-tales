'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'
import { GuidingQuestions } from '@/components/GuidingQuestions'
import { AssessmentResults } from '@/components/AssessmentResults'
import { Button } from '@/components/ui/button'

interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number
}

interface StorySection {
  id: number
  content: string
  questions: Question[]
}

interface Story {
  id: string
  title: string
  sections: StorySection[]
  wordCount: number
  readingTime: string
}

export default function StoryReadingPage() {
  const params = useParams()
  const router = useRouter()
  const [story, setStory] = useState<Story | null>(null)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [revealedSections, setRevealedSections] = useState<number[]>([0]) // Start with first section revealed
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [showAssessment, setShowAssessment] = useState(false)
  const [startTime] = useState(Date.now())

  const bookId = params.bookId as string

  // Function to convert vocabulary markdown to HTML with hover tooltips
  const processVocabularyWords = (content: string) => {
    // Convert **word** (meaning: definition) to HTML spans with hover tooltips
    return content.replace(/\*\*([^*]+)\*\* \(meaning: ([^)]+)\)/g, 
      '<span class="vocabulary" data-word="$1" data-definition="$2">$1</span>'
    )
  }

  // Load story data from localStorage
  useEffect(() => {
    try {
      const stories = JSON.parse(localStorage.getItem('teaching-tales-stories') || '[]')
      const foundStory = stories.find((s: any) => s.id === bookId)
      
      if (foundStory && foundStory.sections) {
        // Transform AI-generated structure to match expected format
        const transformedStory: Story = {
          id: foundStory.id,
          title: foundStory.title,
          sections: foundStory.sections.map((section: any) => ({
            id: section.id,
            content: processVocabularyWords(section.content),
            questions: section.questions.map((q: any) => ({
              id: q.id,
              text: q.question,
              options: q.options,
              correctAnswer: q.correct
            }))
          })),
          wordCount: foundStory.wordCount || 0,
          readingTime: foundStory.readingTime || '5 minutes'
        }
        setStory(transformedStory)
      } else {
        console.warn('Story not found:', bookId)
        // Redirect back to dashboard if story not found
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error loading story data:', error)
      router.push('/dashboard')
    }
  }, [bookId, router])

  const handleQuestionAnswer = (answerIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = answerIndex
    setAnswers(newAnswers)

    // Move to next question or show assessment
    if (currentQuestionIndex < getCurrentSectionQuestions().length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setShowAssessment(true)
    }
  }

  const getCurrentSectionQuestions = () => {
    if (!story || !story.sections[currentSectionIndex]) return []
    return story.sections[currentSectionIndex].questions
  }

  const calculateAccuracy = () => {
    const questions = getCurrentSectionQuestions()
    if (questions.length === 0) return 0
    
    const correct = answers.reduce((count, answer, index) => {
      return count + (answer === questions[index]?.correctAnswer ? 1 : 0)
    }, 0)
    
    return Math.round((correct / questions.length) * 100)
  }

  const calculateWPM = () => {
    const timeElapsed = (Date.now() - startTime) / 1000 / 60 // minutes
    const wordsInCurrentSections = story?.sections
      .slice(0, currentSectionIndex + 1)
      .reduce((total, section) => total + (section.content.split(' ').length || 0), 0) || 0
    
    return Math.round(wordsInCurrentSections / Math.max(timeElapsed, 0.1))
  }

  const handleContinueToNextSection = () => {
    if (!story) return

    // Reset question state for next section
    setCurrentQuestionIndex(0)
    setAnswers([])
    setShowAssessment(false)

    if (currentSectionIndex < story.sections.length - 1) {
      // Reveal next section
      const nextSectionIndex = currentSectionIndex + 1
      setCurrentSectionIndex(nextSectionIndex)
      setRevealedSections(prev => [...prev, nextSectionIndex])
    } else {
      // Story complete - navigate to dashboard
      router.push('/dashboard')
    }
  }

  if (!story) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your story...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <TopNavWithTabs />
      <FeedbackButton />
      
      <div className="flex h-screen bg-white">
        {/* Left Panel - Story Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            {/* Story Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 text-gray-900">{story.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{story.wordCount} words</span>
                <span>•</span>
                <span>{story.readingTime}</span>
                <span>•</span>
                <span>Section {currentSectionIndex + 1} of {story.sections.length}</span>
              </div>
            </div>

            {/* Story Sections - Progressive Reveal */}
            <div className="space-y-8">
              {story.sections.map((section, index) => (
                <div key={section.id} className={`${revealedSections.includes(index) ? 'block' : 'hidden'}`}>
                  {/* Section Content */}
                  <div 
                    className="prose prose-lg max-w-none text-gray-900 mb-6"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                  
                  {/* Section Divider (except for last section) */}
                  {index < story.sections.length - 1 && revealedSections.includes(index) && (
                    <div className="border-t border-gray-200 my-8"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Continue Button - Only show if current section is complete and not on assessment */}
            {!showAssessment && currentSectionIndex < story.sections.length - 1 && (
              <div className="mt-8 text-center">
                <Button
                  onClick={handleContinueToNextSection}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  Continue to Next Section
                </Button>
              </div>
            )}

            {/* Story Complete Message */}
            {showAssessment && currentSectionIndex === story.sections.length - 1 && (
              <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                <h3 className="text-lg font-semibold text-green-800 mb-2">🎉 Story Complete!</h3>
                <p className="text-green-700">You've finished reading the entire story. Great job!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Questions or Assessment */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          {!showAssessment ? (
            <GuidingQuestions
              questions={getCurrentSectionQuestions()}
              currentQuestionIndex={currentQuestionIndex}
              onAnswer={handleQuestionAnswer}
              answers={answers}
            />
          ) : (
            <AssessmentResults
              questions={getCurrentSectionQuestions()}
              answers={answers}
              accuracy={calculateAccuracy()}
              wordsPerMinute={calculateWPM()}
              onContinue={handleContinueToNextSection}
            />
          )}
        </div>
      </div>

      {/* Vocabulary CSS */}
      <style jsx global>{`
        .vocabulary {
          background-color: #DBEAFE;
          color: #1E40AF;
          padding: 2px 6px;
          border-radius: 4px;
          cursor: help;
          position: relative;
          font-weight: 600;
          border-bottom: 2px dotted #3B82F6;
          transition: all 0.2s ease;
        }
        
        .vocabulary:hover {
          background-color: #BFDBFE;
          transform: translateY(-1px);
        }
        
        .vocabulary:hover::after {
          content: attr(data-definition);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background-color: #1F2937;
          color: white;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 400;
          white-space: nowrap;
          z-index: 1000;
          margin-bottom: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-width: 300px;
          white-space: normal;
          text-align: center;
          line-height: 1.4;
        }
        
        .vocabulary:hover::before {
          content: '';
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: #1F2937;
          margin-bottom: 2px;
          z-index: 1001;
        }
      `}</style>
    </div>
  )
}