'use client'

import { useState, useEffect } from 'react'
import { imageGenerationService, type ImageGenerationProgress } from '@/lib/services/image-generation-service'

interface ImageGenerationStatusProps {
  jobId: string
  onComplete?: (imageUrl: string) => void
  onError?: (error: string) => void
  onCancel?: () => void
  className?: string
}

export function ImageGenerationStatus({
  jobId,
  onComplete,
  onError,
  onCancel,
  className = ''
}: ImageGenerationStatusProps) {
  const [progress, setProgress] = useState<ImageGenerationProgress | null>(null)
  const [isPolling, setIsPolling] = useState(true)

  useEffect(() => {
    if (!jobId || !isPolling) return

    const pollStatus = async () => {
      try {
        const status = await imageGenerationService.getJobStatus(jobId)
        setProgress(status)

        if (status.status === 'completed') {
          setIsPolling(false)
          onComplete?.(status.imageUrl || '')
        } else if (status.status === 'failed') {
          setIsPolling(false)
          onError?.(status.message || 'Image generation failed')
        }
      } catch (error) {
        setIsPolling(false)
        onError?.(error instanceof Error ? error.message : 'Unknown error')
      }
    }

    // Poll immediately, then every 2 seconds
    pollStatus()
    const interval = setInterval(pollStatus, 2000)

    return () => clearInterval(interval)
  }, [jobId, isPolling, onComplete, onError])

  const handleCancel = async () => {
    try {
      await imageGenerationService.cancelJob(jobId)
      setIsPolling(false)
      onCancel?.()
    } catch (error) {
      console.error('Failed to cancel job:', error)
    }
  }

  if (!progress) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Initializing...</span>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">
          {progress.status === 'processing' ? 'Generating Image...' : 
           progress.status === 'completed' ? 'Image Ready!' :
           progress.status === 'failed' ? 'Generation Failed' : 'Preparing...'}
        </h3>
        
        {progress.status === 'processing' && (
          <button
            onClick={handleCancel}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {progress.status === 'processing' && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{progress.progress || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.progress || 0}%` }}
            ></div>
          </div>
          {progress.estimatedTimeRemaining && (
            <div className="text-xs text-gray-500 mt-1">
              ~{progress.estimatedTimeRemaining}s remaining
            </div>
          )}
        </div>
      )}

      {/* Status Message */}
      {progress.message && (
        <div className={`text-sm p-2 rounded ${
          progress.status === 'failed' 
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {progress.message}
        </div>
      )}

      {/* Success State */}
      {progress.status === 'completed' && (
        <div className="flex items-center text-sm text-green-700 bg-green-50 p-2 rounded border border-green-200">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Image generated successfully!
        </div>
      )}
    </div>
  )
}
