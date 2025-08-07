/**
 * @fileoverview QTI Question Renderer Component
 * 
 * This component renders QTI-compliant questions with proper interaction types,
 * response processing, and feedback display.
 */

import React, { useState, useEffect } from 'react'
import { type QTIQuestion, type QTIInteraction, type QTIChoice } from '@/lib/services/qti-story-loader-service'

interface QTIQuestionRendererProps {
  question: QTIQuestion
  onResponse: (questionId: string, response: any) => void
  disabled?: boolean
  showFeedback?: boolean
  previousResponse?: any
  className?: string
}

export function QTIQuestionRenderer({
  question,
  onResponse,
  disabled = false,
  showFeedback = false,
  previousResponse,
  className = ''
}: QTIQuestionRendererProps) {
  
  const [currentResponse, setCurrentResponse] = useState<any>(previousResponse || null)
  const [hasResponded, setHasResponded] = useState(false)
  const [feedbackVisible, setFeedbackVisible] = useState(false)

  useEffect(() => {
    if (previousResponse !== undefined) {
      setCurrentResponse(previousResponse)
      setHasResponded(true)
      setFeedbackVisible(showFeedback)
    }
  }, [previousResponse, showFeedback])

  const handleResponse = (response: any) => {
    if (disabled) return

    setCurrentResponse(response)
    setHasResponded(true)
    onResponse(question.id, response)

    // Show feedback after a brief delay
    if (question.feedback && question.feedback.length > 0) {
      setTimeout(() => setFeedbackVisible(true), 500)
    }
  }

  const renderInteraction = (interaction: QTIInteraction) => {
    switch (interaction.type) {
      case 'choiceInteraction':
        return (
          <ChoiceInteraction
            interaction={interaction}
            onResponse={handleResponse}
            currentResponse={currentResponse}
            disabled={disabled || hasResponded}
          />
        )
      
      case 'textEntryInteraction':
        return (
          <TextEntryInteraction
            interaction={interaction}
            onResponse={handleResponse}
            currentResponse={currentResponse}
            disabled={disabled || hasResponded}
          />
        )
      
      case 'orderInteraction':
        return (
          <OrderInteraction
            interaction={interaction}
            onResponse={handleResponse}
            currentResponse={currentResponse}
            disabled={disabled || hasResponded}
          />
        )
      
      default:
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              ⚠️ Interaction type "{interaction.type}" not yet supported
            </p>
          </div>
        )
    }
  }

  const getFeedbackToShow = () => {
    if (!feedbackVisible || !question.feedback) return null

    // Determine which feedback to show based on response
    if (hasResponded && currentResponse !== null) {
      // Check if response is correct (simplified logic)
      const isCorrect = question.correctResponse?.includes(String(currentResponse))
      
      if (isCorrect) {
        return question.feedback.find(f => f.type === 'correct') || 
               question.feedback.find(f => f.type === 'general')
      } else {
        return question.feedback.find(f => f.type === 'incorrect') ||
               question.feedback.find(f => f.type === 'general')
      }
    }

    return question.feedback.find(f => f.type === 'general')
  }

  const feedbackToShow = getFeedbackToShow()

  return (
    <div className={`qti-question bg-white rounded-lg border p-6 ${className}`}>
      {/* Question prompt */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {question.prompt}
        </h3>
        
        {/* Question content (if different from prompt) */}
        {question.content && question.content !== question.prompt && (
          <div 
            className="text-gray-700 mb-4"
            dangerouslySetInnerHTML={{ __html: question.content }}
          />
        )}
      </div>

      {/* Interaction area */}
      <div className="mb-4">
        {question.interactions.map((interaction, index) => (
          <div key={`${interaction.responseIdentifier}-${index}`} className="mb-4">
            {renderInteraction(interaction)}
          </div>
        ))}
      </div>

      {/* Response status */}
      {hasResponded && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <span className="text-lg">✓</span>
            <span className="font-medium">Response recorded</span>
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedbackToShow && (
        <div className={`
          mt-4 p-4 rounded-lg border
          ${feedbackToShow.type === 'correct' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : feedbackToShow.type === 'incorrect'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
          }
        `}>
          <div className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">
              {feedbackToShow.type === 'correct' ? '✅' : 
               feedbackToShow.type === 'incorrect' ? '❌' : 'ℹ️'}
            </span>
            <div>
              <div className="font-medium mb-1">
                {feedbackToShow.type === 'correct' ? 'Correct!' :
                 feedbackToShow.type === 'incorrect' ? 'Not quite right' :
                 'Feedback'}
              </div>
              <div dangerouslySetInnerHTML={{ __html: feedbackToShow.content }} />
            </div>
          </div>
        </div>
      )}

      {/* Question metadata (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 p-2 bg-gray-50 rounded text-xs">
          <summary className="cursor-pointer font-mono">Debug Info</summary>
          <pre className="mt-2 overflow-auto">
            {JSON.stringify({
              id: question.id,
              type: question.type,
              responseIdentifier: question.responseIdentifier,
              correctResponse: question.correctResponse,
              currentResponse,
              hasResponded
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

/**
 * Choice Interaction Component (Multiple Choice, Single Select)
 */
interface ChoiceInteractionProps {
  interaction: QTIInteraction
  onResponse: (response: any) => void
  currentResponse?: any
  disabled?: boolean
}

function ChoiceInteraction({ 
  interaction, 
  onResponse, 
  currentResponse, 
  disabled = false 
}: ChoiceInteractionProps) {
  
  const isMultipleChoice = (interaction.maxChoices || 1) > 1
  const choices = interaction.choices || []

  const handleChoiceClick = (choiceId: string) => {
    if (disabled) return

    if (isMultipleChoice) {
      // Handle multiple selection
      const currentSelections = Array.isArray(currentResponse) ? currentResponse : []
      const newSelections = currentSelections.includes(choiceId)
        ? currentSelections.filter((id: string) => id !== choiceId)
        : [...currentSelections, choiceId]
      
      onResponse(newSelections)
    } else {
      // Handle single selection
      onResponse(choiceId)
    }
  }

  const isSelected = (choiceId: string) => {
    if (isMultipleChoice) {
      return Array.isArray(currentResponse) && currentResponse.includes(choiceId)
    }
    return currentResponse === choiceId
  }

  return (
    <div className="space-y-3">
      {choices.map((choice, index) => (
        <button
          key={choice.identifier}
          onClick={() => handleChoiceClick(choice.identifier)}
          disabled={disabled}
          className={`
            w-full text-left p-4 rounded-lg border-2 transition-all duration-200
            ${isSelected(choice.identifier)
              ? 'border-blue-500 bg-blue-50 text-blue-900'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }
            ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          `}
        >
          <div className="flex items-center gap-3">
            {/* Selection indicator */}
            <div className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center
              ${isSelected(choice.identifier)
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
              }
            `}>
              {isSelected(choice.identifier) && (
                <div className="w-2 h-2 rounded-full bg-white" />
              )}
            </div>
            
            {/* Choice label */}
            <span className="font-medium text-gray-600">
              {String.fromCharCode(65 + index)}.
            </span>
            
            {/* Choice content */}
            <div 
              className="flex-grow"
              dangerouslySetInnerHTML={{ __html: choice.content }}
            />
          </div>
        </button>
      ))}
      
      {/* Instructions */}
      <div className="text-sm text-gray-500 mt-2">
        {isMultipleChoice 
          ? `Select ${interaction.minChoices || 1} to ${interaction.maxChoices} options`
          : 'Select one option'
        }
      </div>
    </div>
  )
}

/**
 * Text Entry Interaction Component
 */
interface TextEntryInteractionProps {
  interaction: QTIInteraction
  onResponse: (response: any) => void
  currentResponse?: any
  disabled?: boolean
}

function TextEntryInteraction({
  interaction,
  onResponse,
  currentResponse,
  disabled = false
}: TextEntryInteractionProps) {
  
  const [inputValue, setInputValue] = useState(currentResponse || '')
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!inputValue.trim() || disabled || hasSubmitted) return
    
    onResponse(inputValue.trim())
    setHasSubmitted(true)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled || hasSubmitted}
          placeholder="Type your answer here..."
          className={`
            flex-grow p-3 border-2 rounded-lg
            ${hasSubmitted 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 focus:border-blue-500'
            }
            ${disabled ? 'cursor-not-allowed opacity-60' : ''}
          `}
          maxLength={interaction.expectedLength}
        />
        
        {!hasSubmitted && (
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || disabled}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        )}
      </div>
      
      {/* Character count */}
      {interaction.expectedLength && (
        <div className="text-sm text-gray-500">
          {inputValue.length} / {interaction.expectedLength} characters
        </div>
      )}
    </div>
  )
}

/**
 * Order Interaction Component (Drag and Drop ordering)
 */
interface OrderInteractionProps {
  interaction: QTIInteraction
  onResponse: (response: any) => void
  currentResponse?: any
  disabled?: boolean
}

function OrderInteraction({
  interaction,
  onResponse,
  currentResponse,
  disabled = false
}: OrderInteractionProps) {
  
  const choices = interaction.choices || []
  const [orderedChoices, setOrderedChoices] = useState<QTIChoice[]>(
    currentResponse || [...choices]
  )
  const [draggedItem, setDraggedItem] = useState<QTIChoice | null>(null)

  const handleDragStart = (choice: QTIChoice) => {
    if (disabled) return
    setDraggedItem(choice)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetChoice: QTIChoice) => {
    if (!draggedItem || disabled) return

    const newOrder = [...orderedChoices]
    const draggedIndex = newOrder.findIndex(c => c.identifier === draggedItem.identifier)
    const targetIndex = newOrder.findIndex(c => c.identifier === targetChoice.identifier)

    // Remove dragged item and insert at target position
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedItem)

    setOrderedChoices(newOrder)
    onResponse(newOrder.map(c => c.identifier))
    setDraggedItem(null)
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 mb-3">
        Drag and drop to reorder the items:
      </div>
      
      {orderedChoices.map((choice, index) => (
        <div
          key={choice.identifier}
          draggable={!disabled}
          onDragStart={() => handleDragStart(choice)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(choice)}
          className={`
            flex items-center gap-3 p-3 border-2 rounded-lg cursor-move
            ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-gray-400'}
            ${draggedItem?.identifier === choice.identifier ? 'opacity-50' : ''}
          `}
        >
          <div className="text-gray-400">
            ⋮⋮
          </div>
          
          <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-bold">
            {index + 1}
          </div>
          
          <div 
            className="flex-grow"
            dangerouslySetInnerHTML={{ __html: choice.content }}
          />
        </div>
      ))}
    </div>
  )
}
