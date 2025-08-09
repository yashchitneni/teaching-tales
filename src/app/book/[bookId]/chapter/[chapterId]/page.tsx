'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'
import { GuidingQuestions } from '@/components/GuidingQuestions'
import { AssessmentResults } from '@/components/AssessmentResults'
import { ChapterChoices } from '@/components/ChapterChoices'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

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
  readingTime: 2,
  stimulusId: null // Mock data doesn't use async questions
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

  // Add question status indicator to chapter header
  const [chapterQuestionStatus, setChapterQuestionStatus] = useState<{
    questionsReady: boolean;
    status: string;
  }>({ questionsReady: false, status: 'unknown' });

  const bookId = params.bookId as string
  const chapterId = params.chapterId as string

  const { addToast } = useToast();

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
        return { ...mockChapter, stimulusId: null }
      }

      const sectionIndex = parseInt(chapterId) - 1
      const section = story.sections[sectionIndex]
      
      if (!section) {
        console.warn(`Section ${chapterId} not found, using mock data`)
        return { ...mockChapter, stimulusId: null }
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
        readingTime: story.readingTime || '2 minutes',
        stimulusId: story.stimulusId || bookId // Use story stimulus ID for async polling
      }
    } catch (error) {
      console.error('Error loading story data:', error)
      return { ...mockChapter, stimulusId: null }
    }
  }

  const chapter = getChapterData()

  // Poll for chapter-level question status
  useEffect(() => {
    if (!chapter.stimulusId) return;
    
    const checkQuestionStatus = async () => {
      try {
        const response = await fetch(`/api/story-question-status/${chapter.stimulusId}`);
        if (response.ok) {
          const status = await response.json();
          setChapterQuestionStatus({
            questionsReady: status.questionsReady,
            status: status.status
          });
        }
      } catch (error) {
        console.error('Failed to check chapter question status:', error);
      }
    };

    checkQuestionStatus();
    
    // Poll every 5 seconds if questions aren't ready
    const interval = !chapterQuestionStatus.questionsReady ? 
      setInterval(checkQuestionStatus, 5000) : null;
      
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [chapter.stimulusId, chapterQuestionStatus.questionsReady]);

  // Add smooth scroll to questions when they become ready
  useEffect(() => {
    if (chapterQuestionStatus.questionsReady && !readingComplete) {
      // Subtle notification that questions are ready
      const questionsPanel = document.querySelector('.questions-panel');
      if (questionsPanel) {
        // Add gentle highlight animation
        questionsPanel.classList.add('questions-ready-highlight');
        setTimeout(() => {
          questionsPanel.classList.remove('questions-ready-highlight');
        }, 3000);
      }
    }
  }, [chapterQuestionStatus.questionsReady, readingComplete]);

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

  // Add reading progress notifications
  const handleReadingMilestone = () => {
    // Notify when user reaches chapter end and questions are ready
    if (chapterQuestionStatus.questionsReady) {
      addToast({
        type: 'success',
        title: '📖 Chapter Complete!',
        description: 'Ready to test your understanding?',
        duration: 6000,
        action: {
          label: 'Start Questions',
          onClick: () => {
            const questionsPanel = document.querySelector('.questions-panel');
            questionsPanel?.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    } else {
      addToast({
        type: 'info',
        title: '📖 Great Reading!',
        description: 'Questions are still being prepared - they\'ll appear soon',
        duration: 5000
      });
    }
  };

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

  // Question status badge component
  const QuestionStatusBadge = ({ 
    status, 
    questionsReady 
  }: { 
    status: string; 
    questionsReady: boolean; 
  }) => {
    if (questionsReady) {
      return (
        <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
          <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
          <span>Questions Ready</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
        <span>Preparing Questions</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavWithTabs />
      <FeedbackButton />

      {/* Mobile: Stack vertically, Desktop: Side by side */}
      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-64px)]">
        {/* Story Content Panel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-3xl mx-auto">
            {/* Enhanced chapter header with question status indicator */}
            <div className="mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2 text-gray-900">{chapter.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Chapter {chapterId}</span>
                    <span>•</span>
                    <span>{chapter.wordCount} words</span>
                    <span>•</span>
                    <span>{chapter.readingTime} min read</span>
                  </div>
                </div>
                
                {/* Question Status Indicator */}
                {chapter.stimulusId && (
                  <div className="ml-4">
                    <QuestionStatusBadge 
                      status={chapterQuestionStatus.status}
                      questionsReady={chapterQuestionStatus.questionsReady}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile-optimized story content */}
            <div 
              className="prose prose-sm sm:prose-lg max-w-none text-gray-900 mobile-reading-content"
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
                
                        // Navigate to next chapter generation
                        router.push(`/create-book/loading?continueFrom=${chapterId}&choice=${choice}`)
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Mobile continue button */}
            {!readingComplete && !showChoices && (
              <div className="mt-8 sm:mt-12 mb-8 text-center">
                <Button
                  onClick={() => {
                    handleContinueReading();
                    handleReadingMilestone();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base w-full sm:w-auto"
                >
                  Continue to Chapter End
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Questions Panel - Mobile: Below content, Desktop: Sidebar */}
        <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto questions-panel">
          {!showAssessment ? (
            <GuidingQuestions
              questions={chapter.questions}
              currentQuestionIndex={currentQuestionIndex}
              onAnswer={handleQuestionAnswer}
              answers={answers}
              stimulusId={chapter.stimulusId} // Now properly connected
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
                  router.push('http://localhost:3001/my-stories')
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
        
        /* Phase 6.7 - Enhanced animations and global styles */
        .questions-ready-highlight {
          border-color: #3B82F6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
          transition: all 0.5s ease;
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shine {
          animation: shine 2s infinite;
        }
        
        /* Mobile-specific styles */
        .mobile-reading-content {
          font-size: 16px;
          line-height: 1.6;
        }
        
        @media (max-width: 640px) {
          .mobile-reading-content {
            font-size: 15px;
          }
          
          .questions-panel {
            min-height: 50vh;
          }
          
          .questions-ready-highlight {
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
          }
        }
        
        /* Accessibility enhancements */
        @media (prefers-reduced-motion: reduce) {
          .animate-spin,
          .animate-bounce,
          .animate-pulse,
          .animate-shine {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}