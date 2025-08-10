'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'
import { GuidingQuestions } from '@/components/GuidingQuestions'
import { AssessmentResults } from '@/components/AssessmentResults'
// QTI Integration imports
import { SectionUnlockIndicator, SectionProgressOverview } from '@/components/SectionUnlockIndicator'
import { QTIQuestionRenderer } from '@/components/QTIQuestionRenderer'
import { ConnectionStatusBadge } from '@/components/ConnectionStatusIndicator'
import { QTIStoryLoaderService, type QTIStory, type QTISection, type QTIQuestion } from '@/lib/services/qti-story-loader-service'
import { ResponseStorageService } from '@/lib/services/response-storage-service'
import { QTIResponseProcessor, defaultResponseProcessor } from '@/lib/qti/processors/response-processor'
import { UnlockEngine, type UnlockContext } from '@/lib/qti/engines/unlock-engine'
import { EnhancedResponseHandler, type ResponseProcessingResult } from '@/lib/services/enhanced-response-handler'
import { useAuth } from '@/contexts/AuthContext'
// Story Storage and Chapter Features imports
import { StoryStorageService, type StoredStory } from '@/lib/services/story-storage-service'
import { ChapterQuiz } from '@/components/ChapterQuiz'
import { NextChapterChoice } from '@/components/NextChapterChoice'


// Legacy interfaces for backward compatibility
interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number
  explanation?: string
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
  imageUrl?: string
}

export default function StoryReadingPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  
  // Legacy state (for backward compatibility)
  const [story, setStory] = useState<Story | null>(null)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [revealedSections, setRevealedSections] = useState<number[]>([0])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [answersBySection, setAnswersBySection] = useState<number[][]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | undefined>(undefined)
  const [showAssessment, setShowAssessment] = useState(false)
  const [startTime] = useState(Date.now())
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({})

  // QTI Integration state
  const [qtiStory, setQtiStory] = useState<QTIStory | null>(null)
  const [loadingQTI, setLoadingQTI] = useState(true)
  const [qtiError, setQtiError] = useState<string | null>(null)
  const [currentQTISection, setCurrentQTISection] = useState<QTISection | null>(null)
  const [sectionUnlockStates, setSectionUnlockStates] = useState<Record<string, boolean>>({})
  const [responseProcessingEnabled, setResponseProcessingEnabled] = useState(true)
  
  // Enhanced response handling state
  const [processingResponse, setProcessingResponse] = useState<string | null>(null)
  const [responseResults, setResponseResults] = useState<Record<string, ResponseProcessingResult>>({})
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine)
  const [pendingSync, setPendingSync] = useState(false)

  // Story Flow and Chapter Features state
  type Phase = 'reading' | 'choose-next' | 'chapter-quiz' | 'chapter-results'
  const [phase, setPhase] = useState<Phase>('reading')
  const [storyMeta, setStoryMeta] = useState<StoredStory | null>(null)
  const [chapterQuizQuestions, setChapterQuizQuestions] = useState<Question[]>([])
  const [chapterQuizAnswers, setChapterQuizAnswers] = useState<number[]>([])
  const [nextOptions, setNextOptions] = useState<{ id: string; label: string; description?: string }[]>([])
  const [isGeneratingNext, setIsGeneratingNext] = useState(false)
  const [nextStoryId, setNextStoryId] = useState<string | null>(null)

  const bookId = params.bookId as string



  // Function to convert vocabulary markdown to HTML with hover tooltips
  const processVocabularyWords = (content: string) => {
    // Convert **word** (meaning: definition) or **word** (definition) to HTML spans with hover tooltips
    return content.replace(/\*\*([^*]+)\*\* \((?:meaning: )?([^)]+)\)/g, 
      '<span class="vocabulary" data-word="$1" data-definition="$2">$1</span>'
    )
  }

  // Load story data from QTI API (or fallback) based on auth state
  useEffect(() => {
    if (user) {
      loadStoryFromAPI()
      return
    }
    // If auth has resolved and there's no user, attempt a safe anonymous load
    if (!authLoading) {
      loadStoryWithoutAuth()
    }
  }, [bookId, router, user, authLoading])



  // Update section unlock states when QTI story is loaded or responses change
  useEffect(() => {
    const studentId = user?.sourcedId || user?.id || user?.cognitoId;
    if (qtiStory && studentId) {
      updateSectionUnlockStates()
    }
  }, [qtiStory, user])

  // Periodically check for unlock conditions (e.g., after answering questions)
  useEffect(() => {
    const studentId = user?.sourcedId || user?.id || user?.cognitoId;
    if (qtiStory && studentId) {
      const interval = setInterval(() => {
        updateSectionUnlockStates()
      }, 30000) // Check every 30 seconds

      return () => clearInterval(interval)
    }
  }, [qtiStory, user])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setOfflineMode(false)
      
      // Trigger sync of offline responses
      syncOfflineResponses()
    }

    const handleOffline = () => {
      setOfflineMode(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Sync offline responses when connection is restored
  const syncOfflineResponses = async () => {
    if (pendingSync) return

    setPendingSync(true)
    
    try {
      const result = await EnhancedResponseHandler.syncOfflineResponses()
      
      if (result.failed > 0) {
        console.warn(`⚠️ Failed to sync ${result.failed} responses:`, result.errors)
      }

    } catch (error) {
      console.error('❌ Offline sync failed:', error)
    } finally {
      setPendingSync(false)
    }
  }

  const loadStoryFromAPI = async () => {
    try {
      // Use the same fallback pattern as story generation
      const studentId = user?.sourcedId || user?.id || user?.cognitoId;
      
      if (!studentId) {
        console.error('❌ No authenticated user found')
        router.push('/login')
        return
      }


      setLoadingQTI(true)
      setQtiError(null)
      
      // Load story using new QTI service
      const result = await QTIStoryLoaderService.loadStory(bookId, studentId, {
        useCache: true,
        includeResponses: true,
        parseXML: true
      })
      
      if (result.success && result.story) {

        
        setQtiStory(result.story)
        setCurrentQTISection(result.story.sections[0] || null)
        
        // Update section unlock states
        const unlockStates: Record<string, boolean> = {}
        result.story.sections.forEach(section => {
          unlockStates[section.id] = section.isUnlocked
        })
        setSectionUnlockStates(unlockStates)
        
        // Convert to legacy format for backward compatibility
        const qtiSections = result.story.sections || []
        const hasQTISections = qtiSections.length > 0 && qtiSections.some(s => (s.content || '').trim().length > 0)

        if (!hasQTISections) {
          console.warn('⚠️ QTI story returned 0 sections or empty content. Falling back to Storage Service for content render.')
          try {
            const storedStory = await StoryStorageService.getStory(bookId)
            if (storedStory && (storedStory.sections || []).length > 0) {
              const transformed: Story = {
                id: storedStory.id,
                title: storedStory.title,
                sections: storedStory.sections.map((section: any, index: number) => ({
                  id: section.id ?? index,
                  content: processVocabularyWords(section.content || ''),
                  questions: (section.questions || []).map((q: any) => ({
                    id: q.id,
                    text: q.text || q.question,
                    options: q.options || [],
                    correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : q.correct,
                    explanation: q.explanation || ''
                  }))
                })),
                wordCount: storedStory.wordCount || 0,
                readingTime: storedStory.readingTime || '5 minutes',
                imageUrl: storedStory.imageUrl
              }
              setStory(transformed)
              setStoryMeta(storedStory)
            } else {
              console.warn('⚠️ Storage Service fallback returned no sections; trying legacy localStorage fallback')
              await loadLegacyStoryFallback()
            }
          } catch (fallbackErr) {
            console.error('❌ Storage Service fallback failed:', fallbackErr)
            await loadLegacyStoryFallback()
          }
        } else {
            const legacyStory: Story = {
            id: result.story.id,
            title: result.story.title,
            sections: qtiSections.map((section, index) => ({
              id: (() => {
                // Normalize to a stable numeric index for legacy components
                const raw = section.id as any
                if (typeof raw === 'number') return raw
                if (typeof raw === 'string') {
                  const num = parseInt(raw.replace(/\D/g, ''))
                  return Number.isFinite(num) ? num : index
                }
                return index
              })(),
              content: processVocabularyWords(section.content),
              questions: result.story.assessments
                .filter(assessment => String(assessment.sectionId) === String(section.id))
                .flatMap(assessment => assessment.questions.map(q => ({
                  id: q.id,
                  text: q.prompt,
                  options: q.interactions[0]?.choices?.map(c => c.content) || [],
                  correctAnswer: parseInt(q.correctResponse?.[0] || '0'),
                  explanation: q.feedback?.find(f => f.type === 'correct')?.content || ''
                })))
            })),
            wordCount: result.story.wordCount,
            readingTime: result.story.readingTime,
            imageUrl: result.story.imageUrl
          }
          setStory(legacyStory)
        }
        
        // Also try to load story metadata from story storage service for new features
        try {
          const storedStory = await StoryStorageService.getStory(bookId)
          if (storedStory) {
            setStoryMeta(storedStory)
          }
        } catch (metaError) {
        }
      } else {
        console.error('❌ Failed to load QTI story:', result.error)
        setQtiError(result.error || 'Unknown error')
        
        // Try story storage service as first fallback
        try {
          const storedStory = await StoryStorageService.getStory(bookId)
          if (storedStory) {
            // Convert StoredStory to legacy Story format
            const transformedStory: Story = {
              id: storedStory.id,
              title: storedStory.title,
              sections: storedStory.sections.map((section: any) => ({
                id: section.id,
                content: processVocabularyWords(section.content),
                questions: section.questions.map((q: any) => ({
                  id: q.id,
                  text: q.text,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                  explanation: q.explanation
                }))
              })),
              wordCount: storedStory.wordCount || 0,
              readingTime: storedStory.readingTime || '5 minutes',
              imageUrl: storedStory.imageUrl
            }
            setStory(transformedStory)
            setStoryMeta(storedStory)
            return
          } else {
          }
        } catch (storageError) {
        }
        
        // Still try legacy loading as final fallback
        await loadLegacyStoryFallback()
      }
    } catch (error) {
      console.error('❌ Error loading QTI story:', error)
      setQtiError(error instanceof Error ? error.message : 'Unknown error')
      
      // Try story storage service as fallback
      try {
        const storedStory = await StoryStorageService.getStory(bookId)
        if (storedStory) {
          // Convert StoredStory to legacy Story format
          const transformedStory: Story = {
            id: storedStory.id,
            title: storedStory.title,
            sections: storedStory.sections.map((section: any) => ({
              id: section.id,
              content: processVocabularyWords(section.content),
              questions: section.questions.map((q: any) => ({
                id: q.id,
                text: q.text,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation
              }))
            })),
            wordCount: storedStory.wordCount || 0,
            readingTime: storedStory.readingTime || '5 minutes',
            imageUrl: storedStory.imageUrl
          }
          setStory(transformedStory)
          setStoryMeta(storedStory)
        } else {
          await loadLegacyStoryFallback()
        }
      } catch (storageError) {
        await loadLegacyStoryFallback()
      }
    } finally {
      setLoadingQTI(false)
    }
  }

  // Anonymous/basic loader to render content when auth isn't available
  const loadStoryWithoutAuth = async () => {
    try {
      setLoadingQTI(true)
      setQtiError(null)

      // First try the StoryStorageService (uses QTI API via proxy)
      const storedStory = await StoryStorageService.getStory(bookId)
      if (storedStory && storedStory.sections) {
        const transformedStory: Story = {
          id: storedStory.id,
          title: storedStory.title,
          sections: storedStory.sections.map((section: any) => ({
            id: section.id,
            content: processVocabularyWords(section.content),
            questions: (section.questions || []).map((q: any) => ({
              id: q.id,
              text: q.text,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation
            }))
          })),
          wordCount: storedStory.wordCount || 0,
          readingTime: storedStory.readingTime || '5 minutes',
          imageUrl: storedStory.imageUrl
        }
        setStory(transformedStory)
        setStoryMeta(storedStory)
        return
      }

      await loadLegacyStoryFallback()
    } catch (error) {
      console.error('❌ Anonymous story load failed:', error)
      await loadLegacyStoryFallback()
    } finally {
      setLoadingQTI(false)
    }
  }

  const loadLegacyStoryFallback = async () => {
    
    try {
      const stories = JSON.parse(localStorage.getItem('teaching-tales-stories') || '[]')
      const foundStory = stories.find((s: any) => s.id === bookId)
      
      if (foundStory && foundStory.sections) {
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
              correctAnswer: q.correct,
              explanation: q.explanation
            }))
          })),
          wordCount: foundStory.wordCount || 0,
          readingTime: foundStory.readingTime || '5 minutes',
          imageUrl: foundStory.imageUrl
        }
        setStory(transformedStory)
        
        // Also try to set story meta from story storage service for new features
        try {
          const storedStory = await StoryStorageService.getStory(bookId)
          if (storedStory) {
            setStoryMeta(storedStory)
          }
        } catch (metaError) {
        }
      } else {
        console.error('❌ Story not found in any source')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('❌ Legacy fallback failed:', error)
      router.push('/dashboard')
    }
  }

  // Enhanced QTI question answering with full backend integration
  const handleQTIQuestionAnswer = async (questionId: string, response: any) => {
    const studentId = user?.sourcedId || user?.id || user?.cognitoId;
    if (!qtiStory || !currentQTISection || !studentId) {
      console.warn('❌ Missing required data for QTI response processing')
      return
    }

    try {
      
      setProcessingResponse(questionId)

      // Find the question and assessment
      const assessment = qtiStory.assessments.find(a => 
        a.questions.some(q => q.id === questionId)
      )
      const question = assessment?.questions.find(q => q.id === questionId)

      if (!assessment || !question) {
        console.error('❌ Question or assessment not found:', questionId)
        setProcessingResponse(null)
        return
      }

      // Calculate time spent on this question
      const timeSpent = Date.now() - startTime
      const attempts = (responseResults[questionId]?.processedResponse.attempts || 0) + 1

      // Process with enhanced handler
      const result = await EnhancedResponseHandler.processResponse(
        question,
        assessment,
        currentQTISection,
        qtiStory,
        studentId,
        response,
        timeSpent,
        attempts
      )

      // Store result for UI updates
      setResponseResults(prev => ({
        ...prev,
        [questionId]: result
      }))

      console.debug('QTI response processed', {
        success: result.success,
        score: `${result.processedResponse.score}/${result.processedResponse.maxScore}`,
        correct: result.processedResponse.isCorrect,
        offline: result.offline,
        gradebookSubmitted: result.gradebookSubmission?.success
      })

      // Handle section unlocks
      if (result.sectionUnlocked?.unlockedSections.length) {
        
        // Update section unlock states
        const newUnlockStates = { ...sectionUnlockStates }
        result.sectionUnlocked.unlockedSections.forEach(sectionId => {
          newUnlockStates[sectionId] = true
        })
        setSectionUnlockStates(newUnlockStates)

        // Update QTI story sections
        if (qtiStory) {
          const updatedStory = { ...qtiStory }
          updatedStory.sections = updatedStory.sections.map(section => {
            if (result.sectionUnlocked!.unlockedSections.includes(section.id)) {
              return { ...section, isUnlocked: true }
            }
            return section
          })
          setQtiStory(updatedStory)
        }

        // Show unlock message (you could use a toast notification here)
        if (result.sectionUnlocked.message) {
        }
      }

      // Update legacy state for backward compatibility
      const answerIndex = parseInt(response) || 0
      const newAnswers = [...answers]
      newAnswers[currentQuestionIndex] = answerIndex
      setAnswers(newAnswers)

      // Trigger section unlock check
      await updateSectionUnlockStates()

    } catch (error) {
      console.error('❌ Error in enhanced QTI response processing:', error)
      
      // Store error result
      setResponseResults(prev => ({
        ...prev,
        [questionId]: {
          success: false,
          processedResponse: {
            score: 0,
            maxScore: 1,
            isCorrect: false,
            timestamp: Date.now(),
            timeSpent: Date.now() - startTime,
            attempts: 1,
            feedback: {
              type: 'error',
              message: 'Response processing failed. Please try again.'
            }
          },
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }))
    } finally {
      setProcessingResponse(null)
    }
  }

  // Check and update section unlock states based on current progress
  const updateSectionUnlockStates = async () => {
    const studentId = user?.sourcedId || user?.id || user?.cognitoId;
    if (!qtiStory || !studentId) {
      return
    }

    try {

      // Get current student responses (all), then filter to this story's assessments
      const allResponses = await ResponseStorageService.getResponses({
        studentId: studentId
      })
      const validAssessmentIds = new Set(qtiStory.assessments.map(a => a.id))
      const responses = allResponses.filter(r => validAssessmentIds.has(r.assessmentId))

      // Build section states for unlock engine
      const sectionStates = qtiStory.sections.map(section => {
        const sectionResponses = responses.filter(r => 
          r.metadata?.sectionId === section.id
        )
        
        const totalScore = sectionResponses.reduce((sum, r) => sum + r.score, 0)
        const maxScore = sectionResponses.reduce((sum, r) => sum + r.maxScore, 0)
        const accuracy = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
        const timeSpent = sectionResponses.reduce((sum, r) => sum + (r.timeSpent || 0), 0)

        return UnlockEngine.updateSectionState({
          id: section.id,
          title: section.title,
          isUnlocked: section.isUnlocked,
          isCompleted: section.isCompleted,
          isInProgress: section.isInProgress,
          completedItems: sectionResponses.map(r => r.itemId),
          totalItems: qtiStory.assessments
            .filter(a => String(a.sectionId) === String(section.id))
            .flatMap(a => a.questions.map(q => q.id)),
          score: totalScore,
          maxScore,
          accuracy,
          timeSpent,
          attempts: Math.max(...sectionResponses.map(r => r.attempts || 1), 0),
          unlockConditions: UnlockEngine.createLinearUnlockConditions(qtiStory.sections.map(s => s.id))
            .filter(condition => condition.target === section.id)
        }, responses)
      })

      // Create unlock context
      const unlockContext: UnlockContext = {
        studentId: studentId,
        assessmentId: qtiStory.id,
        currentSection: currentQTISection?.id || '',
        targetSection: qtiStory.sections[qtiStory.sections.length - 1]?.id || '',
        responses,
        sectionStates,
        startTime: startTime,
        currentTime: Date.now()
      }

      // Check unlock conditions
      const unlockResult = UnlockEngine.checkUnlockConditions(unlockContext)

      if (unlockResult.success && unlockResult.unlockedSections.length > 0) {

        // Update QTI story sections
        const updatedStory = { ...qtiStory }
        updatedStory.sections = updatedStory.sections.map(section => {
          if (unlockResult.unlockedSections.includes(section.id)) {
            return { ...section, isUnlocked: true }
          }
          return section
        })
        setQtiStory(updatedStory)

        // Update unlock states
        const newUnlockStates = { ...sectionUnlockStates }
        unlockResult.unlockedSections.forEach(sectionId => {
          newUnlockStates[sectionId] = true
        })
        setSectionUnlockStates(newUnlockStates)

        // Update revealed sections for legacy compatibility
        const newRevealedSections = [...revealedSections]
        unlockResult.unlockedSections.forEach(sectionId => {
          const sectionIndex = qtiStory.sections.findIndex(s => s.id === sectionId)
          if (sectionIndex >= 0 && !newRevealedSections.includes(sectionIndex)) {
            newRevealedSections.push(sectionIndex)
          }
        })
        setRevealedSections(newRevealedSections.sort((a, b) => a - b))

        // Show unlock message to user
        if (unlockResult.message) {
          // You could show this in a toast notification
        }
      }

    } catch (error) {
      console.error('❌ Error updating section unlock states:', error)
    }
  }

  // Navigate to a specific section (if unlocked)
  const navigateToSection = (sectionId: string) => {
    if (!qtiStory) return

    const section = qtiStory.sections.find(s => s.id === sectionId)
    const sectionIndex = qtiStory.sections.findIndex(s => s.id === sectionId)
    
    if (!section || !section.isUnlocked) {
      console.warn('❌ Cannot navigate to locked section:', sectionId)
      return
    }

    
    setCurrentQTISection(section)
    setCurrentSectionIndex(sectionIndex)
    
    // Scroll to section
    const sectionRef = sectionRefs.current[sectionIndex]
    if (sectionRef) {
      sectionRef.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Calculate overall progress for display
  const calculateOverallProgress = () => {
    if (!qtiStory) {
      return {
        completedSections: 0,
        totalSections: 0,
        overallAccuracy: 0,
        totalTimeSpent: 0
      }
    }

    const completedSections = qtiStory.sections.filter(s => s.isCompleted).length
    const totalSections = qtiStory.sections.length
    
    // These would be calculated from stored responses in a real implementation
    const overallAccuracy = 85 // Placeholder
    const totalTimeSpent = Date.now() - startTime

    return {
      completedSections,
      totalSections,
      overallAccuracy,
      totalTimeSpent
    }
  }

  // Scroll to the active section whenever section or question changes
  useEffect(() => {
    const el = sectionRefs.current[currentSectionIndex]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [currentSectionIndex, currentQuestionIndex])

  const handleQuestionAnswer = async (answerIndex: number) => {
    // Special case: -1 means "continue" button was clicked after answering
    if (answerIndex === -1) {
      // Clear selected answer for next question
      setSelectedAnswer(undefined)
      // Move to next question or advance section/end
      if (currentQuestionIndex < getCurrentSectionQuestions().length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      } else {
        // End of current section
        setAnswersBySection(prev => {
          const updated = [...prev]
          updated[currentSectionIndex] = answers
          return updated
        })

        if (story && currentSectionIndex < story.sections.length - 1) {
          // Reveal next section, reset for next section
          const nextSectionIndex = currentSectionIndex + 1
          setCurrentSectionIndex(nextSectionIndex)
          setRevealedSections(prev => Array.from(new Set([...prev, nextSectionIndex])))
          setCurrentQuestionIndex(0)
          setAnswers([])
          setShowAssessment(false)
          // Scroll will be handled by useEffect when currentSectionIndex updates
        } else {
          // Last section completed – move to next choice phase
          setShowAssessment(true)
          prepareNextChapterFlow()
        }
      }
      return
    }

    // Regular answer submission - save the answer locally first
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = answerIndex
    setAnswers(newAnswers)

    // Persist via QTI pipeline if available
    try {
      const studentId = user?.sourcedId || user?.id || user?.cognitoId;
      if (qtiStory && currentQTISection && studentId) {
        const currentQs = getCurrentSectionQuestions()
        const legacyQ = currentQs[currentQuestionIndex]
        if (legacyQ) {
          // Find the matching assessment and QTI question by ID
          const assessment = qtiStory.assessments.find(a => 
            String(a.sectionId) === String(currentQTISection.id) && a.questions.some(q => q.id === legacyQ.id)
          ) || qtiStory.assessments.find(a => String(a.sectionId) === String(currentQTISection.id))

          const qtiQuestion = assessment?.questions.find(q => q.id === legacyQ.id)
          if (assessment && qtiQuestion) {
            setProcessingResponse(qtiQuestion.id)
            const choiceIdentifier = qtiQuestion.interactions?.[0]?.choices?.[answerIndex]?.identifier ?? String(answerIndex)
            const timeSpent = Date.now() - startTime
            const attempts = (responseResults[qtiQuestion.id]?.processedResponse.attempts || 0) + 1
            const result = await EnhancedResponseHandler.processResponse(
              qtiQuestion,
              assessment,
              currentQTISection,
              qtiStory,
              studentId,
              choiceIdentifier,
              timeSpent,
              attempts
            )

            setResponseResults(prev => ({
              ...prev,
              [qtiQuestion.id]: result
            }))

            // Recalculate unlocks
            await updateSectionUnlockStates()
          }
        }
      }
    } catch (e) {
      console.error('❌ QTI persistence failed:', e)
    } finally {
      setProcessingResponse(null)
    }
  }

  // Prepare next chapter options and chapter-wide quiz
  const prepareNextChapterFlow = () => {
    setPhase('choose-next')
    if (!story) return

    // Build three simple, thematic options for the next chapter spark
    const character = storyMeta?.character || 'the hero'
    const options = [
      { id: 'friend', label: `A surprising new friend helps ${character}` },
      { id: 'mystery', label: `A mystery from earlier returns to challenge ${character}` },
      { id: 'travel', label: `${character} discovers a path to a new place` }
    ]
    setNextOptions(options)

    // Build 4 chapter-level questions by sampling across sections (first 4 available)
    const allQs = getAllQuestions()
    const picked = allQs.slice(0, 4)
    setChapterQuizQuestions(picked)
  }

  const startGeneratingNextChapter = async (choiceId: string) => {
    if (!story || !storyMeta) {
      setPhase('chapter-quiz')
      return
    }
    setIsGeneratingNext(true)
    try {
      const previousChapter = story.sections.map(s => s.content).join('\n\n')
      const selectedLabel = nextOptions.find(o => o.id === choiceId)?.label || choiceId
      const res = await fetch('/api/generate-continuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          universe: storyMeta.universe,
          character: storyMeta.character,
          spark: storyMeta.spark,
          gradeLevel: storyMeta.gradeLevel,
          studentId: storyMeta.studentId,
          previousChapter,
          selectedPath: selectedLabel,
          storyTitle: story.title
        })
      })
      const json = await res.json()
      if (json?.success && json?.stimulusId) setNextStoryId(json.stimulusId)
    } catch (e) {
      console.error('Failed to generate next chapter in background:', e)
    } finally {
      setIsGeneratingNext(false)
    }
  }

  const handleSelectAnswer = (answerIndex: number) => {
    // Just select the answer, don't submit yet
    setSelectedAnswer(answerIndex)
  }

  const getCurrentSectionQuestions = () => {
    if (!story || !story.sections[currentSectionIndex]) return []
    return story.sections[currentSectionIndex].questions
  }

  const getAllQuestions = () => {
    if (!story) return [] as Question[]
    return story.sections.flatMap(section => section.questions)
  }

  const getAllAnswers = () => {
    // Ensure we include the current section answers if not already recorded
    const collected: number[][] = [...answersBySection]
    collected[currentSectionIndex] = showAssessment ? answersBySection[currentSectionIndex] : answers
    // Some earlier sections might be undefined if not set; normalize
    const normalized = (story?.sections || []).map((_, idx) => collected[idx] || [])
    return normalized.flat()
  }

  const calculateTotalAccuracy = () => {
    const questions = getAllQuestions()
    const userAnswers = getAllAnswers()
    if (questions.length === 0) return 0
    const correct = userAnswers.reduce((count, answer, index) => {
      return count + (answer === questions[index]?.correctAnswer ? 1 : 0)
    }, 0)
    return Math.round((correct / questions.length) * 100)
  }

  const calculateTotalWPM = () => {
    const timeElapsed = (Date.now() - startTime) / 1000 / 60 // minutes
    const totalWords = story?.sections.reduce((total, section) => total + (section.content.split(' ').length || 0), 0) || 0
    return Math.round(totalWords / Math.max(timeElapsed, 0.1))
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
      // Story complete - move to next choice phase instead of navigating away
      setShowAssessment(true)
      prepareNextChapterFlow()
    }
  }

  if (!story || loadingQTI) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>{loadingQTI ? 'Loading QTI story...' : 'Loading your story...'}</p>
          {qtiError && (
            <p className="text-red-600 mt-2 text-sm">
              ⚠️ {qtiError} (falling back to legacy mode)
            </p>
          )}
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
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{story.title}</h1>
                <ConnectionStatusBadge className="ml-4" />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span>{story.wordCount} words</span>
                <span>•</span>
                <span>{story.readingTime}</span>
                <span>•</span>
                <span>Section {currentSectionIndex + 1} of {story.sections.length}</span>
                {offlineMode && (
                  <>
                    <span>•</span>
                    <span className="text-orange-600 font-medium">📱 Offline Mode</span>
                  </>
                )}
              </div>
              
              {/* Story Illustration */}
              {story.imageUrl && (
                <div className="mb-6">
                  <img 
                    src={story.imageUrl} 
                    alt={`Illustration for ${story.title}`}
                    className="w-full max-w-2xl h-64 object-cover rounded-lg shadow-lg"
                    onError={(e) => {
                      console.warn('Failed to load story image:', story.imageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Story Sections - Progressive Reveal */}
            <div className="space-y-8">
              {story.sections.map((section, index) => {
                const revealed = revealedSections.includes(index)
                return (
                  <div
                    key={section.id}
                    ref={(el) => { sectionRefs.current[index] = el }}
                    className="block"
                  >
                    {/* Section Content */}
                    <div
                      className={`prose prose-lg max-w-none text-gray-900 mb-6 ${revealed ? '' : 'filter blur-sm select-none pointer-events-none opacity-70'}`}
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                    {/* Section Divider (except for last section) */}
                    {index < story.sections.length - 1 && (
                      <div className="border-t border-gray-200 my-8"></div>
                    )}
                  </div>
                )
              })}
            </div>



            {/* Story Complete Message */}
            {showAssessment && (
              <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
                <h3 className="text-lg font-semibold text-green-800 mb-2">🎉 Story Complete!</h3>
                <p className="text-green-700">You've finished reading the entire story. Great job!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - QTI Section Management & Questions */}
        <div className="w-96 bg-white border-l border-gray-200 sticky top-0 self-start max-h-screen overflow-y-auto">
          
          {/* QTI Section Progress (if QTI story is loaded) */}
          {qtiStory && (
            <div className="p-4 border-b border-gray-200">
              <SectionProgressOverview
                sections={qtiStory.sections}
                currentSectionIndex={currentSectionIndex}
                totalProgress={calculateOverallProgress()}
                className="mb-4"
              />
              
              {/* Section unlock indicators */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Story Sections</h4>
                {qtiStory.sections.slice(0, 3).map((section, index) => (
                  <SectionUnlockIndicator
                    key={section.id}
                    section={section}
                    sectionIndex={index}
                    totalSections={qtiStory.sections.length}
                    currentProgress={{
                      completedSections: qtiStory.sections.filter(s => s.isCompleted).length,
                      currentAccuracy: 85, // Placeholder - would be calculated from responses
                      timeSpent: Date.now() - startTime
                    }}
                    unlockRequirements={{
                      requiredPreviousCompletion: true,
                      minimumAccuracy: 60
                    }}
                    onSectionClick={navigateToSection}
                    className="text-xs"
                  />
                ))}
                
                {qtiStory.sections.length > 3 && (
                  <div className="text-xs text-gray-500 text-center py-2">
                    ... and {qtiStory.sections.length - 3} more sections
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Removed duplicate unstyled QTI question list to avoid duplication. GuidedQuestions remains as the styled UI. */}

          {/* Legacy Questions Panel */}
          {!showAssessment ? (
            <GuidingQuestions
              questions={getCurrentSectionQuestions()}
              currentQuestionIndex={currentQuestionIndex}
              onAnswer={handleQuestionAnswer}
              answers={answers}
              selectedAnswer={selectedAnswer}
              onSelectAnswer={handleSelectAnswer}
              isLastSection={story.sections && currentSectionIndex === story.sections.length - 1}
            />
          ) : phase === 'choose-next' ? (
            <NextChapterChoice
              options={nextOptions}
              onSelect={(id) => { startGeneratingNextChapter(id); setPhase('chapter-quiz') }}
            />
          ) : phase === 'chapter-quiz' ? (
            <ChapterQuiz
              questions={chapterQuizQuestions.map((q) => ({ id: q.id, text: q.text, options: q.options, correctAnswer: q.correctAnswer, explanation: q.explanation }))}
              onComplete={(ans) => { setChapterQuizAnswers(ans); setPhase('chapter-results') }}
            />
          ) : (
            <div className="p-6">
              <AssessmentResults
                questions={getAllQuestions()}
                answers={getAllAnswers()}
                accuracy={calculateTotalAccuracy()}
                wordsPerMinute={calculateTotalWPM()}
                onContinue={() => {}}
                hideContinue
              />
              {/* Chapter-wide quiz results summary */}
              <div className="mt-6 p-4 rounded-lg border border-gray-200 bg-white">
                <h4 className="font-semibold text-gray-900 mb-2">Chapter Quiz Completed</h4>
                <p className="text-sm text-gray-600">You answered {chapterQuizAnswers.length} questions.</p>
                {isGeneratingNext ? (
                  <p className="mt-3 text-sm text-blue-700">Preparing your next chapter...</p>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                      onClick={() => {
                        if (nextStoryId) {
                          router.push(`/book/${nextStoryId}`)
                        } else {
                          router.push('http://localhost:3001/my-stories')
                        }
                      }}
                    >
                      Continue to Next Chapter
                    </button>
                    <button
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-2 px-4 rounded border border-gray-200"
                      onClick={() => router.push('http://localhost:3001/my-stories')}
                    >
                      Back to My Stories
                    </button>
                  </div>
                )}
              </div>
            </div>
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