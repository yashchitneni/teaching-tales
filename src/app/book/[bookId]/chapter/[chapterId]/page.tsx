'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'
import { GuidingQuestions } from '@/components/GuidingQuestions'
import { AssessmentResults } from '@/components/AssessmentResults'
import { ChapterChoices } from '@/components/ChapterChoices'
import { Button } from '@/components/ui/button'

// Mock data for development
const mockChapter = {
  id: '1',
  bookId: '1',
  title: 'The Mysterious Forest',
  content: `Once upon a time, in a <span class="vocabulary" data-word="enchanted" data-definition="magical or under a spell">enchanted</span> forest, Pikachu discovered something extraordinary. The morning sun filtered through the tall trees, casting dancing shadows on the forest floor.

As Pikachu walked deeper into the woods, the air grew <span class="vocabulary" data-word="mysteriously" data-definition="in a way that is difficult to understand or explain">mysteriously</span> quiet. Even the usual chirping of Pidgey had stopped. Something unusual was happening in this part of the forest.

Suddenly, Pikachu noticed a strange glow coming from behind an ancient oak tree. The light pulsed with a rhythm that seemed almost alive. Curiosity sparked in Pikachu's eyes as it cautiously approached the source of the light.

Behind the tree, Pikachu found a <span class="vocabulary" data-word="peculiar" data-definition="strange or unusual">peculiar</span> crystal, floating just above the ground. It shimmered with colors that Pikachu had never seen before - not quite blue, not quite purple, but something in between.

"Pika pika?" Pikachu wondered aloud, reaching out a tiny paw toward the crystal. The moment its paw made contact, a warm sensation spread through its body. The crystal began to glow even brighter, and suddenly, Pikachu could understand the whispers of the forest.

The trees were trying to tell a story - a story about an ancient power hidden deep within the forest, waiting for the right Pokemon to discover it. Pikachu realized this was just the beginning of an incredible adventure.`,
  questions: [
    {
      id: '1',
      text: 'What did Pikachu discover in the forest?',
      options: ['A new friend', 'A mysterious crystal', 'A hidden path', 'A treasure chest'],
      correctAnswer: 1
    },
    {
      id: '2',
      text: 'How did the forest feel when Pikachu walked deeper?',
      options: ['Loud and busy', 'Bright and sunny', 'Quiet and mysterious', 'Cold and windy'],
      correctAnswer: 2
    },
    {
      id: '3',
      text: 'What happened when Pikachu touched the crystal?',
      options: [
        'It broke into pieces',
        'It disappeared',
        'Pikachu could understand the forest whispers',
        'Nothing happened'
      ],
      correctAnswer: 2
    }
  ],
  wordCount: 287,
  readingTime: 2
}

export default function ReadingPage() {
  const params = useParams()
  const router = useRouter()
  const [showAssessment, setShowAssessment] = useState(false)
  const [showChoices, setShowChoices] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [startTime] = useState(Date.now())
  const [readingComplete, setReadingComplete] = useState(false)

  const bookId = params.bookId as string
  const chapterId = params.chapterId as string

  // Function to convert vocabulary markdown to HTML with hover tooltips
  const processVocabularyWords = (content: string) => {
    // Convert **word** (meaning: definition) to HTML spans with hover tooltips
    return content.replace(/\*\*([^*]+)\*\* \(meaning: ([^)]+)\)/g, 
      '<span class="vocabulary" data-word="$1" data-definition="$2">$1</span>'
    )
  }

  // Load story data from localStorage
  const getChapterData = () => {
    try {
      const stories = JSON.parse(localStorage.getItem('teaching-tales-stories') || '[]')
      const story = stories.find((s: any) => s.id === bookId)
      
      if (!story || !story.sections) {
        console.warn('Story not found or has no sections, using mock data')
        return mockChapter
      }

      const sectionIndex = parseInt(chapterId) - 1
      const section = story.sections[sectionIndex]
      
      if (!section) {
        console.warn(`Section ${chapterId} not found, using mock data`)
        return mockChapter
      }

      // Transform AI-generated structure to match expected format
      return {
        id: chapterId,
        bookId: bookId,
        title: sectionIndex === 0 ? story.title : `${story.title} - Part ${chapterId}`,
        content: processVocabularyWords(section.content),
        questions: section.questions.map((q: any) => ({
          id: q.id,
          text: q.question,
          options: q.options,
          correctAnswer: q.correct
        })),
        wordCount: story.wordCount || 0,
        readingTime: story.readingTime || '2 minutes'
      }
    } catch (error) {
      console.error('Error loading story data:', error)
      return mockChapter
    }
  }

  const chapter = getChapterData()

  const handleQuestionAnswer = (answerIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = answerIndex
    setAnswers(newAnswers)

    if (currentQuestionIndex < chapter.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // All questions answered, show assessment
      setShowAssessment(true)
    }
  }

  const handleContinueReading = () => {
    setReadingComplete(true)
    setShowChoices(true)
  }

  const calculateAccuracy = () => {
    const correct = answers.filter((answer, index) => 
      answer === chapter.questions[index].correctAnswer
    ).length
    return Math.round((correct / chapter.questions.length) * 100)
  }

  const calculateWPM = () => {
    const timeElapsed = (Date.now() - startTime) / 1000 / 60 // in minutes
    return Math.round(chapter.wordCount / timeElapsed)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavWithTabs />
      <FeedbackButton />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Story Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            {/* Chapter Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2 text-gray-900">{chapter.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Chapter {chapterId}</span>
                <span>•</span>
                <span>{chapter.wordCount} words</span>
                <span>•</span>
                <span>{chapter.readingTime} min read</span>
              </div>
            </div>

            {/* Story Content */}
            <div 
              className="prose prose-lg max-w-none text-gray-900"
              dangerouslySetInnerHTML={{ __html: chapter.content }}
            />

            {/* Chapter End Section */}
            {readingComplete && (
              <div className="mt-12 mb-8">
                <div className="border-t-2 border-gray-200 pt-8">
                  <p className="text-lg text-gray-700 mb-6">
                    Pikachu stood before the glowing crystal, feeling the ancient power coursing through its body. 
                    The forest had revealed its secret, but this was only the beginning. What would Pikachu do next?
                  </p>
                  
                  {showChoices && (
                    <ChapterChoices 
                      onChoiceSelect={(choice: string) => {
                        console.log('Selected choice:', choice)
                        // Navigate to next chapter generation
                        router.push(`/create-book/loading?continueFrom=${chapterId}&choice=${choice}`)
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Continue Reading Button */}
            {!readingComplete && !showChoices && (
              <div className="mt-12 mb-8 text-center">
                <Button
                  onClick={handleContinueReading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  Continue to Chapter End
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Questions or Assessment */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          {!showAssessment ? (
            <GuidingQuestions
              questions={chapter.questions}
              currentQuestionIndex={currentQuestionIndex}
              onAnswer={handleQuestionAnswer}
              answers={answers}
            />
          ) : (
            <AssessmentResults
              questions={chapter.questions}
              answers={answers}
              accuracy={calculateAccuracy()}
              wordsPerMinute={calculateWPM()}
              onContinue={() => {
                const nextChapter = parseInt(chapterId) + 1
                const maxChapters = 5 // Our stories have 5 sections
                
                if (nextChapter <= maxChapters) {
                  // Navigate to next chapter
                  router.push(`/book/${bookId}/chapter/${nextChapter}`)
                } else {
                  // Story complete - navigate to dashboard or library
                  router.push('/dashboard')
                }
              }}
            />
          )}
        </div>
      </div>

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