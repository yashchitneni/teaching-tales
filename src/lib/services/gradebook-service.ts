/**
 * @fileoverview Gradebook Service
 * 
 * This service handles the submission and management of grades to OneRoster
 * gradebook systems, providing automatic grade synchronization and result tracking.
 */

import { 
  updateResult, 
  ResultData, 
  ResultResponse 
} from '../api/oneroster-client';
import { StoredResponse } from './response-storage-service';

// Gradebook service interfaces
export interface GradeSubmissionData {
  lineItemId: string;
  studentId: string;
  assessmentId: string;
  totalScore: number;
  maxPossibleScore: number;
  accuracy: number;
  completedItems: number;
  totalItems: number;
  timeSpent?: number;
  attempts?: number;
  comment?: string;
  metadata?: Record<string, any>;
}

export interface GradeSubmissionResult {
  success: boolean;
  resultId?: string;
  lineItemId: string;
  studentId: string;
  submittedScore: number;
  submittedAt: string;
  error?: string;
}

export interface GradeCalculationOptions {
  /** Penalty for multiple attempts (0-1, where 0.1 = 10% penalty) */
  attemptPenalty?: number;
  /** Maximum penalty that can be applied */
  maxPenalty?: number;
  /** Minimum score that can be awarded (prevents negative scores) */
  minScore?: number;
  /** Whether to round scores to whole numbers */
  roundScores?: boolean;
  /** Custom scoring algorithm */
  customScoring?: (responses: StoredResponse[]) => number;
}

/**
 * Gradebook Service
 * 
 * Handles grade calculation and submission to OneRoster gradebook systems
 */
export class GradebookService {
  
  /**
   * Submit assessment results to OneRoster gradebook
   */
  static async submitToGradebook(
    gradeData: GradeSubmissionData,
    options: GradeCalculationOptions = {}
  ): Promise<GradeSubmissionResult> {
    try {
      console.log('📊 Submitting grade to OneRoster gradebook:', {
        lineItemId: gradeData.lineItemId,
        studentId: gradeData.studentId,
        score: `${gradeData.totalScore}/${gradeData.maxPossibleScore}`,
        accuracy: `${gradeData.accuracy}%`
      });

      // Apply scoring options and calculate final score
      const finalScore = this.calculateFinalScore(gradeData, options);
      
      // Prepare OneRoster result data
      const resultData: ResultData = {
        lineItemId: gradeData.lineItemId,
        studentId: gradeData.studentId,
        scoreGiven: finalScore,
        scoreMaximum: gradeData.maxPossibleScore,
        comment: this.generateGradeComment(gradeData, finalScore),
        timestamp: new Date().toISOString(),
        metadata: {
          // Assessment metadata
          assessmentId: gradeData.assessmentId,
          accuracy: gradeData.accuracy,
          completedItems: gradeData.completedItems,
          totalItems: gradeData.totalItems,
          
          // Performance metadata
          timeSpent: gradeData.timeSpent,
          attempts: gradeData.attempts,
          
          // Calculation metadata
          originalScore: gradeData.totalScore,
          finalScore: finalScore,
          scoringOptions: options,
          
          // System metadata
          submissionSource: 'Teaching Tales',
          submissionVersion: '1.0',
          
          // Custom metadata
          ...gradeData.metadata
        }
      };

      console.log('📤 Sending result to OneRoster API...');

      // Submit to OneRoster
      const oneRosterResult = await updateResult(resultData);

      console.log('✅ Grade submitted successfully to OneRoster');

      return {
        success: true,
        resultId: oneRosterResult.result.sourcedId,
        lineItemId: gradeData.lineItemId,
        studentId: gradeData.studentId,
        submittedScore: finalScore,
        submittedAt: resultData.timestamp
      };

    } catch (error) {
      console.error('❌ Failed to submit grade to OneRoster:', error);
      
      return {
        success: false,
        lineItemId: gradeData.lineItemId,
        studentId: gradeData.studentId,
        submittedScore: 0,
        submittedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Calculate final score with applied options
   */
  private static calculateFinalScore(
    gradeData: GradeSubmissionData,
    options: GradeCalculationOptions
  ): number {
    let finalScore = gradeData.totalScore;

    // Apply custom scoring if provided
    if (options.customScoring) {
      // Note: This would require responses to be passed in, 
      // for now we'll use the calculated total score
      console.log('🧮 Using custom scoring algorithm');
    }

    // Apply attempt penalty
    if (options.attemptPenalty && gradeData.attempts && gradeData.attempts > 1) {
      const penalty = Math.min(
        options.attemptPenalty * (gradeData.attempts - 1),
        options.maxPenalty || 0.5 // Default max penalty of 50%
      );
      finalScore = finalScore * (1 - penalty);
      console.log(`📉 Applied attempt penalty: ${(penalty * 100).toFixed(1)}%`);
    }

    // Apply minimum score
    if (options.minScore !== undefined) {
      finalScore = Math.max(finalScore, options.minScore);
    }

    // Round scores if requested
    if (options.roundScores) {
      finalScore = Math.round(finalScore);
    } else {
      // Round to 2 decimal places by default
      finalScore = Math.round(finalScore * 100) / 100;
    }

    // Ensure score doesn't exceed maximum
    finalScore = Math.min(finalScore, gradeData.maxPossibleScore);

    return finalScore;
  }

  /**
   * Generate a descriptive comment for the grade
   */
  private static generateGradeComment(
    gradeData: GradeSubmissionData,
    finalScore: number
  ): string {
    const accuracy = gradeData.accuracy;
    const completionRate = gradeData.totalItems > 0 
      ? (gradeData.completedItems / gradeData.totalItems) * 100 
      : 100;

    let comment = `Teaching Tales Assessment - ${accuracy.toFixed(1)}% accuracy`;

    // Add completion info
    if (completionRate < 100) {
      comment += `, ${completionRate.toFixed(1)}% completed`;
    }

    // Add performance indicators
    if (accuracy >= 90) {
      comment += ' - Excellent work!';
    } else if (accuracy >= 80) {
      comment += ' - Good job!';
    } else if (accuracy >= 70) {
      comment += ' - Keep practicing!';
    } else if (accuracy >= 60) {
      comment += ' - Needs improvement';
    } else {
      comment += ' - Requires additional support';
    }

    // Add time information if available
    if (gradeData.timeSpent && gradeData.timeSpent > 0) {
      const minutes = Math.round(gradeData.timeSpent / 60000); // Convert ms to minutes
      comment += ` (${minutes} min)`;
    }

    // Add attempt information if multiple attempts
    if (gradeData.attempts && gradeData.attempts > 1) {
      comment += ` [Attempt ${gradeData.attempts}]`;
    }

    // Add custom comment if provided
    if (gradeData.comment) {
      comment += ` - ${gradeData.comment}`;
    }

    return comment;
  }

  /**
   * Submit multiple grades in batch
   */
  static async submitBatchGrades(
    grades: GradeSubmissionData[],
    options: GradeCalculationOptions = {}
  ): Promise<{
    successful: GradeSubmissionResult[];
    failed: GradeSubmissionResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {
    console.log(`📊 Submitting batch of ${grades.length} grades...`);

    const successful: GradeSubmissionResult[] = [];
    const failed: GradeSubmissionResult[] = [];

    // Process grades with a small delay to avoid overwhelming the API
    for (let i = 0; i < grades.length; i++) {
      const grade = grades[i];
      
      try {
        const result = await this.submitToGradebook(grade, options);
        
        if (result.success) {
          successful.push(result);
        } else {
          failed.push(result);
        }

      } catch (error) {
        console.error(`❌ Failed to submit grade for student ${grade.studentId}:`, error);
        failed.push({
          success: false,
          lineItemId: grade.lineItemId,
          studentId: grade.studentId,
          submittedScore: 0,
          submittedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Add delay between submissions (except for the last one)
      if (i < grades.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const summary = {
      total: grades.length,
      successful: successful.length,
      failed: failed.length
    };

    console.log(`✅ Batch submission completed:`, summary);

    return {
      successful,
      failed,
      summary
    };
  }

  /**
   * Calculate grade data from stored responses
   */
  static calculateGradeFromResponses(
    responses: StoredResponse[],
    assessmentId: string,
    studentId: string,
    additionalData: {
      totalItems?: number;
      timeSpent?: number;
      attempts?: number;
      comment?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Omit<GradeSubmissionData, 'lineItemId'> {
    const totalScore = responses.reduce((sum, r) => sum + r.score, 0);
    const maxPossibleScore = responses.reduce((sum, r) => sum + r.maxScore, 0);
    const accuracy = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    // Calculate time spent from responses if not provided
    let calculatedTimeSpent = additionalData.timeSpent;
    if (!calculatedTimeSpent) {
      const responsesWithTime = responses.filter(r => r.timeSpent && r.timeSpent > 0);
      if (responsesWithTime.length > 0) {
        calculatedTimeSpent = responsesWithTime.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
      }
    }

    // Calculate attempts from responses if not provided
    let calculatedAttempts = additionalData.attempts;
    if (!calculatedAttempts) {
      calculatedAttempts = Math.max(...responses.map(r => r.attempts || 1), 1);
    }

    return {
      studentId,
      assessmentId,
      totalScore: Math.round(totalScore * 100) / 100,
      maxPossibleScore,
      accuracy: Math.round(accuracy * 100) / 100,
      completedItems: responses.length,
      totalItems: additionalData.totalItems || responses.length,
      timeSpent: calculatedTimeSpent,
      attempts: calculatedAttempts,
      comment: additionalData.comment,
      metadata: additionalData.metadata
    };
  }

  /**
   * Get grade statistics for reporting
   */
  static calculateGradeStatistics(results: GradeSubmissionResult[]): {
    totalSubmissions: number;
    successfulSubmissions: number;
    failedSubmissions: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    successRate: number;
  } {
    const successful = results.filter(r => r.success);
    const scores = successful.map(r => r.submittedScore);

    return {
      totalSubmissions: results.length,
      successfulSubmissions: successful.length,
      failedSubmissions: results.filter(r => !r.success).length,
      averageScore: scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      successRate: results.length > 0 ? (successful.length / results.length) * 100 : 0
    };
  }

  /**
   * Generate grade report for export
   */
  static generateGradeReport(
    results: GradeSubmissionResult[],
    options: {
      includeMetadata?: boolean;
      format?: 'json' | 'csv';
    } = {}
  ): string | object {
    const statistics = this.calculateGradeStatistics(results);
    
    const report = {
      generatedAt: new Date().toISOString(),
      statistics,
      results: results.map(result => ({
        studentId: result.studentId,
        lineItemId: result.lineItemId,
        score: result.submittedScore,
        success: result.success,
        submittedAt: result.submittedAt,
        error: result.error,
        ...(options.includeMetadata && { resultId: result.resultId })
      }))
    };

    if (options.format === 'csv') {
      // Convert to CSV format
      const headers = ['Student ID', 'Line Item ID', 'Score', 'Success', 'Submitted At', 'Error'];
      const rows = results.map(r => [
        r.studentId,
        r.lineItemId,
        r.submittedScore.toString(),
        r.success.toString(),
        r.submittedAt,
        r.error || ''
      ]);

      return [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
    }

    return report;
  }
}

// Export default instance for convenience
export const gradebookService = GradebookService;
