'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'
import { ChapterQuiz } from '@/components/ChapterQuiz'
import { LibraryService } from '@/lib/services/library-service'
import { LibraryStory, LibraryStoryChapter } from '@/lib/types/library-types'

export default function ChapterReadingPage() {
  const router = useRouter()
  const params = useParams()
  const storyId = params.id as string
  const chapterNumber = parseInt(params.chapterNumber as string)

  const [story, setStory] = useState<LibraryStory | null>(null)
  const [chapter, setChapter] = useState<LibraryStoryChapter | null>(null)
  const [showQuiz, setShowQuiz] = useState(false)
  const [readingStartTime, setReadingStartTime] = useState<number>(Date.now())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mock user ID - in real app this would come from auth
  const userId = 'user-123'

  useEffect(() => {
    loadChapterData()
  }, [storyId, chapterNumber])

  const loadChapterData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load story
      const storyData = LibraryService.getStoryById(storyId)
      if (!storyData) {
        setError('Story not found')
        return
      }

      setStory(storyData)

      // Find chapter
      const chapterData = storyData.chapters.find(ch => ch.chapterNumber === chapterNumber)
      if (!chapterData) {
        setError('Chapter not found')
        return
      }

      setChapter(chapterData)
      setReadingStartTime(Date.now())

      // Track chapter started event
      LibraryService.trackEvent({
        eventType: 'chapter_started',
        userId,
        storyId,
        chapterId: chapterData.id,
        metadata: {
          chapterNumber,
          chapterTitle: chapterData.title,
          wordCount: chapterData.wordCount
        }
      })

    } catch (err) {
      console.error('Failed to load chapter:', err)
      setError('Failed to load chapter')
    } finally {
      setLoading(false)
    }
  }

  const handleFinishReading = () => {
    if (!chapter || !story) return

    const readingTime = Math.round((Date.now() - readingStartTime) / 1000 / 60) // minutes

    // Update reading progress
    const progress = LibraryService.getReadingProgress(userId, storyId)
    const completedChapters = progress?.completedChapters || []
    
    if (!completedChapters.includes(chapterNumber)) {
      completedChapters.push(chapterNumber)
    }

    const nextChapter = chapterNumber + 1
    const isStoryComplete = completedChapters.length === story.chapterCount

    LibraryService.updateReadingProgress({
      userId,
      storyId,
      currentChapter: isStoryComplete ? chapterNumber : nextChapter,
      completedChapters,
      totalReadingTime: (progress?.totalReadingTime || 0) + readingTime,
      isCompleted: isStoryComplete,
      completedAt: isStoryComplete ? new Date().toISOString() : undefined
    })

    // Track chapter completed
    LibraryService.trackEvent({
      eventType: 'chapter_completed',
      userId,
      storyId,
      chapterId: chapter.id,
      metadata: {
        chapterNumber,
        readingTimeMinutes: readingTime,
        wordCount: chapter.wordCount
      }
    })

    // Show quiz if chapter has questions
    if (chapter.questions.length > 0) {
      setShowQuiz(true)
    } else {
      handleChapterComplete()
    }
  }

  const handleQuizComplete = (answers: number[]) => {
    if (!chapter) return

    const correctAnswers = answers.reduce((count, answer, index) => {
      const question = chapter.questions[index]
      return count + (answer === question.correctAnswer ? 1 : 0)
    }, 0)

    // Update progress with quiz results
    const progress = LibraryService.getReadingProgress(userId, storyId)
    LibraryService.updateReadingProgress({
      userId,
      storyId,
      questionsAnswered: (progress?.questionsAnswered || 0) + chapter.questions.length,
      questionsCorrect: (progress?.questionsCorrect || 0) + correctAnswers
    })

    // Track quiz completion
    chapter.questions.forEach((question, index) => {
      LibraryService.trackEvent({
        eventType: 'question_answered',
        userId,
        storyId,
        chapterId: chapter.id,
        questionId: question.id,
        metadata: {
          questionNumber: question.questionNumber,
          isCorrect: answers[index] === question.correctAnswer,
          selectedAnswer: answers[index]
        }
      })
    })

    handleChapterComplete()
  }

  const handleChapterComplete = () => {
    if (!story) return

    const isLastChapter = chapterNumber === story.chapterCount
    
    if (isLastChapter) {
      // Story completed
      LibraryService.trackEvent({
        eventType: 'story_completed',
        userId,
        storyId,
        metadata: {
          totalChapters: story.chapterCount,
          totalWordCount: story.totalWordCount
        }
      })
      
      router.push(`/library/story/${storyId}?completed=true`)
    } else {
      // Go to next chapter
      router.push(`/library/story/${storyId}/chapter/${chapterNumber + 1}`)
    }
  }

  const handleBackToStory = () => {
    router.push(`/library/story/${storyId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavWithTabs />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error || !story || !chapter) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavWithTabs />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Chapter Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The requested chapter could not be found.'}</p>
            <button
              onClick={handleBackToStory}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Story
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showQuiz) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavWithTabs />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ChapterQuiz
            questions={chapter.questions.map(q => ({
              id: q.id,
              question: q.question,
              options: q.options || [],
              correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
              explanation: q.explanation
            }))}
            onComplete={handleQuizComplete}
            storyId={storyId}
            chapterId={chapter.id}
            gradeLevel={story.metadata.readingLevel}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavWithTabs />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBackToStory}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {story.metadata.title}
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{chapter.title}</h1>
              <p className="text-gray-600">
                Chapter {chapterNumber} of {story.chapterCount} • {chapter.wordCount} words • {chapter.estimatedReadingTime} min read
              </p>
            </div>
            
            <div className="text-right">
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {story.metadata.readingLevel}
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="prose prose-lg max-w-none">
            {chapter.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4 leading-relaxed text-gray-800">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Vocabulary Section */}
          {chapter.vocabulary && chapter.vocabulary.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vocabulary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chapter.vocabulary.map((vocab) => (
                  <div
                    key={vocab.id}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                    onClick={() => {
                      LibraryService.trackEvent({
                        eventType: 'vocabulary_viewed',
                        userId,
                        storyId,
                        chapterId: chapter.id,
                        vocabularyWordId: vocab.id,
                        metadata: {
                          word: vocab.word,
                          definition: vocab.definition
                        }
                      })
                    }}
                  >
                    <div className="font-semibold text-blue-900">{vocab.word}</div>
                    <div className="text-sm text-blue-700 mb-1">({vocab.partOfSpeech})</div>
                    <div className="text-blue-800">{vocab.definition}</div>
                    {vocab.contextSentence && (
                      <div className="text-sm text-blue-600 mt-2 italic">
                        "{vocab.contextSentence}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <div>
            {chapterNumber > 1 && (
              <button
                onClick={() => router.push(`/library/story/${storyId}/chapter/${chapterNumber - 1}`)}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous Chapter
              </button>
            )}
          </div>
          
          <button
            onClick={handleFinishReading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {chapter.questions.length > 0 ? 'Take Quiz' : 
             chapterNumber === story.chapterCount ? 'Finish Story' : 'Next Chapter'}
          </button>
        </div>
      </div>

      <FeedbackButton />
    </div>
  )
}
