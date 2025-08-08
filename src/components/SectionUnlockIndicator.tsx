/**
 * @fileoverview Section Unlock Indicator Component
 * 
 * This component shows the unlock status of story sections and provides
 * visual feedback about progress requirements.
 */

import React from 'react'
import { type QTISection } from '@/lib/services/qti-story-loader-service'

interface SectionUnlockIndicatorProps {
  section: QTISection
  sectionIndex: number
  totalSections: number
  currentProgress?: {
    completedSections: number
    currentAccuracy: number
    timeSpent: number
  }
  unlockRequirements?: {
    minimumAccuracy?: number
    requiredPreviousCompletion?: boolean
    minimumTimeSpent?: number
  }
  onSectionClick?: (sectionId: string) => void
  className?: string
}

export function SectionUnlockIndicator({
  section,
  sectionIndex,
  totalSections,
  currentProgress,
  unlockRequirements,
  onSectionClick,
  className = ''
}: SectionUnlockIndicatorProps) {
  
  const getUnlockStatus = () => {
    if (section.isCompleted) {
      return {
        status: 'completed' as const,
        icon: '✅',
        color: 'text-green-600 bg-green-50 border-green-200',
        message: 'Section completed'
      }
    }
    
    if (section.isUnlocked) {
      return {
        status: 'unlocked' as const,
        icon: '🔓',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        message: section.isInProgress ? 'In progress' : 'Available to read'
      }
    }
    
    return {
      status: 'locked' as const,
      icon: '🔒',
      color: 'text-gray-400 bg-gray-50 border-gray-200',
      message: getUnlockRequirementMessage()
    }
  }

  const getUnlockRequirementMessage = (): string => {
    if (!unlockRequirements) {
      return 'Complete previous sections to unlock'
    }

    const requirements = []
    
    if (unlockRequirements.requiredPreviousCompletion && sectionIndex > 0) {
      requirements.push('Complete previous section')
    }
    
    if (unlockRequirements.minimumAccuracy) {
      const currentAcc = currentProgress?.currentAccuracy || 0
      if (currentAcc < unlockRequirements.minimumAccuracy) {
        requirements.push(`Achieve ${unlockRequirements.minimumAccuracy}% accuracy`)
      }
    }
    
    if (unlockRequirements.minimumTimeSpent) {
      const currentTime = currentProgress?.timeSpent || 0
      const requiredMinutes = Math.ceil(unlockRequirements.minimumTimeSpent / 60000)
      if (currentTime < unlockRequirements.minimumTimeSpent) {
        requirements.push(`Spend at least ${requiredMinutes} minutes reading`)
      }
    }

    return requirements.length > 0 
      ? requirements.join(' and ')
      : 'Complete previous sections to unlock'
  }

  const getProgressWidth = (): string => {
    if (section.isCompleted) return '100%'
    if (section.isInProgress) return '50%'
    if (section.isUnlocked) return '10%'
    return '0%'
  }

  const unlockInfo = getUnlockStatus()
  
  const handleClick = () => {
    if (section.isUnlocked && onSectionClick) {
      onSectionClick(section.id)
    }
  }

  return (
    <div 
      className={`
        relative border rounded-lg p-4 transition-all duration-200 hover:shadow-md
        ${unlockInfo.color}
        ${section.isUnlocked ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
        ${className}
      `}
      onClick={handleClick}
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 h-1 bg-current opacity-20 rounded-t-lg transition-all duration-300"
           style={{ width: getProgressWidth() }} />
      
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="flex-shrink-0 text-2xl">
          {unlockInfo.icon}
        </div>
        
        {/* Section info */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">
              Section {sectionIndex + 1}: {section.title}
            </h3>
            <span className="text-xs opacity-75">
              ({sectionIndex + 1}/{totalSections})
            </span>
          </div>
          
          <p className="text-xs opacity-80 mb-2">
            {unlockInfo.message}
          </p>
          
          {/* Content preview (if unlocked) */}
          {section.isUnlocked && section.content && (
            <p className="text-xs opacity-70 line-clamp-2">
              {section.content.substring(0, 100)}...
            </p>
          )}
          
          {/* Unlock requirements (if locked) */}
          {!section.isUnlocked && unlockRequirements && (
            <div className="mt-2 p-2 bg-current bg-opacity-10 rounded text-xs">
              <div className="font-medium mb-1">To unlock:</div>
              <div>{unlockInfo.message}</div>
              
              {/* Progress indicators */}
              {currentProgress && (
                <div className="mt-2 space-y-1">
                  {unlockRequirements.minimumAccuracy && (
                    <div className="flex justify-between">
                      <span>Accuracy:</span>
                      <span className={
                        (currentProgress.currentAccuracy || 0) >= unlockRequirements.minimumAccuracy
                          ? 'text-green-600 font-medium'
                          : ''
                      }>
                        {(currentProgress.currentAccuracy || 0).toFixed(1)}% / {unlockRequirements.minimumAccuracy}%
                      </span>
                    </div>
                  )}
                  
                  {unlockRequirements.minimumTimeSpent && (
                    <div className="flex justify-between">
                      <span>Time spent:</span>
                      <span className={
                        (currentProgress.timeSpent || 0) >= unlockRequirements.minimumTimeSpent
                          ? 'text-green-600 font-medium'
                          : ''
                      }>
                        {Math.ceil((currentProgress.timeSpent || 0) / 60000)}min / {Math.ceil(unlockRequirements.minimumTimeSpent / 60000)}min
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Assessment info */}
          {section.assessmentId && section.isUnlocked && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="opacity-70">📝</span>
              <span className="opacity-80">
                {section.isCompleted ? 'Assessment completed' : 'Assessment available'}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Section number badge */}
      <div className="absolute -top-2 -right-2 w-6 h-6 bg-current bg-opacity-20 rounded-full flex items-center justify-center text-xs font-bold">
        {sectionIndex + 1}
      </div>
    </div>
  )
}

/**
 * Section Progress Overview Component
 * Shows overall progress across all sections
 */
interface SectionProgressOverviewProps {
  sections: QTISection[]
  currentSectionIndex: number
  totalProgress: {
    completedSections: number
    totalSections: number
    overallAccuracy: number
    totalTimeSpent: number
  }
  className?: string
}

export function SectionProgressOverview({
  sections,
  currentSectionIndex,
  totalProgress,
  className = ''
}: SectionProgressOverviewProps) {
  
  const progressPercentage = (totalProgress.completedSections / totalProgress.totalSections) * 100
  
  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Reading Progress</h3>
        <span className="text-sm text-gray-600">
          {totalProgress.completedSections}/{totalProgress.totalSections} sections
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-bold text-blue-600">
            {progressPercentage.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-600">Complete</div>
        </div>
        
        <div>
          <div className="text-lg font-bold text-green-600">
            {totalProgress.overallAccuracy.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-600">Accuracy</div>
        </div>
        
        <div>
          <div className="text-lg font-bold text-purple-600">
            {Math.ceil(totalProgress.totalTimeSpent / 60000)}m
          </div>
          <div className="text-xs text-gray-600">Time spent</div>
        </div>
      </div>
      
      {/* Current section indicator */}
      {currentSectionIndex < sections.length && (
        <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
          <div className="font-medium text-blue-900">Currently reading:</div>
          <div className="text-blue-700">
            Section {currentSectionIndex + 1}: {sections[currentSectionIndex]?.title}
          </div>
        </div>
      )}
    </div>
  )
}
