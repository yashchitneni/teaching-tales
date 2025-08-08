/**
 * @fileoverview OneRoster Integration Service
 * 
 * This service handles the complete OneRoster integration workflow for Teaching Tales,
 * including class creation, line item management, student enrollment, and grade synchronization.
 */

import { 
  createClass, 
  createLineItem, 
  enrollStudent, 
  updateResult,
  fetchClasses,
  fetchUsers,
  type ClassCreationData,
  type LineItemCreationData,
  type EnrollmentCreationData,
  type ResultData,
  type ClassResponse,
  type LineItemResponse,
  type EnrollmentResponse,
  type ResultResponse
} from '../api/oneroster-client';
import { OneRosterValidator } from '../api/oneroster-validator';
import type { StoryAssessment } from './assessment-service';
import type { StoredStory } from './story-storage-service';

// Integration interfaces
export interface StoryClassCreationData {
  storyId: string;
  storyTitle: string;
  universe: string;
  character: string;
  spark: string;
  gradeLevel: string;
  studentId: string;
  assessments: StoryAssessment[];
  metadata?: Record<string, any>;
}

export interface OneRosterIntegrationResult {
  success: boolean;
  classId?: string;
  lineItemIds?: string[];
  enrollmentId?: string;
  error?: string;
  rollbackData?: RollbackData;
  metadata: {
    operationsCompleted: string[];
    operationsFailed: string[];
    totalOperations: number;
    executionTime: number;
  };
}

export interface RollbackData {
  classId?: string;
  lineItemIds?: string[];
  enrollmentId?: string;
  createdResources: Array<{
    type: 'class' | 'lineItem' | 'enrollment' | 'result';
    id: string;
    operation: string;
  }>;
}

export interface GradeSubmissionData {
  studentId: string;
  lineItemId: string;
  assessmentId: string;
  score: number;
  maxScore: number;
  accuracy: number;
  timeSpent?: number;
  attempts?: number;
  comment?: string;
}

/**
 * OneRoster Integration Service
 * 
 * Manages the complete OneRoster workflow for Teaching Tales stories
 */
export class OneRosterIntegrationService {
  
  /**
   * Create complete OneRoster integration for a story
   */
  static async createStoryIntegration(
    data: StoryClassCreationData
  ): Promise<OneRosterIntegrationResult> {
    const startTime = Date.now();
    const operationsCompleted: string[] = [];
    const operationsFailed: string[] = [];
    const createdResources: RollbackData['createdResources'] = [];

    try {

      // Step 1: Get student and school information
      const studentInfo = await this.getStudentInfo(data.studentId);
      let studentInfoData = studentInfo.data;
      let canEnroll = true;

      if (!studentInfo.success) {
        console.warn('⚠️ Student not found in OneRoster system, proceeding without enrollment');
        operationsFailed.push('student_info_not_found');
        // Fallback defaults for class creation
        studentInfoData = {
          studentId: data.studentId,
          schoolId: 'teaching-tales-school',
          gradeLevel: data.gradeLevel || 'elementary',
          enrolledClasses: []
        };
        canEnroll = false;
      } else {
        operationsCompleted.push('student_info_fetched');
      }

      // Step 2: Create OneRoster class
      const classResult = await this.createStoryClass(data, studentInfoData);
      if (!classResult.success) {
        operationsFailed.push('class_creation');
        throw new Error(`Failed to create class: ${classResult.error}`);
      }
      
      operationsCompleted.push('class_created');
      createdResources.push({
        type: 'class',
        id: classResult.classId!,
        operation: 'create'
      });

      // Step 3: Create line items for each assessment
      const lineItemResults = await this.createAssessmentLineItems(
        classResult.classId!,
        data.assessments,
        data
      );
      
      const successfulLineItems = lineItemResults.filter(result => result.success);
      const failedLineItems = lineItemResults.filter(result => !result.success);
      
      if (successfulLineItems.length === 0) {
        operationsFailed.push('line_items_creation');
        throw new Error('Failed to create any line items');
      }
      
      if (failedLineItems.length > 0) {
        console.warn(`⚠️ ${failedLineItems.length} line items failed to create`);
        operationsFailed.push(`${failedLineItems.length}_line_items_failed`);
      }

      operationsCompleted.push(`${successfulLineItems.length}_line_items_created`);
      successfulLineItems.forEach(result => {
        createdResources.push({
          type: 'lineItem',
          id: result.lineItemId!,
          operation: 'create'
        });
      });

      // Step 4: Enroll student in class
      let enrollmentId: string | undefined;
      if (canEnroll) {
        const enrollmentResult = await this.enrollStudentInClass(
          classResult.classId!,
          data.studentId,
          studentInfoData!.schoolId
        );
        
        if (!enrollmentResult.success) {
          operationsFailed.push('student_enrollment');
          console.warn(`⚠️ Failed to enroll student: ${enrollmentResult.error}`);
        } else {
          operationsCompleted.push('student_enrolled');
          createdResources.push({
            type: 'enrollment',
            id: enrollmentResult.enrollmentId!,
            operation: 'create'
          });
          enrollmentId = enrollmentResult.enrollmentId;
        }
      } else {
        operationsFailed.push('student_enrollment_skipped');
      }

      const executionTime = Date.now() - startTime;
      
      console.debug('OneRosterIntegrationService.createStoryIntegration', {
        classId: classResult.classId,
        lineItemCount: successfulLineItems.length,
        enrollmentId,
        executionTime: `${executionTime}ms`
      });

      return {
        success: true,
        classId: classResult.classId,
        lineItemIds: successfulLineItems.map(result => result.lineItemId!),
        enrollmentId,
        rollbackData: {
          classId: classResult.classId,
          lineItemIds: successfulLineItems.map(result => result.lineItemId!),
          enrollmentId,
          createdResources
        },
        metadata: {
          operationsCompleted,
          operationsFailed,
          totalOperations: 4, // student_info, class, line_items, enrollment
          executionTime
        }
      };

    } catch (error) {
      console.error('❌ OneRoster integration failed:', error);
      
      // Attempt rollback of created resources
      if (createdResources.length > 0) {
        await this.rollbackCreatedResources(createdResources);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        rollbackData: {
          createdResources
        },
        metadata: {
          operationsCompleted,
          operationsFailed,
          totalOperations: 4,
          executionTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Get student information including school context
   */
  private static async getStudentInfo(studentId: string): Promise<{
    success: boolean;
    data?: {
      studentId: string;
      schoolId: string;
      gradeLevel: string;
      enrolledClasses: string[];
    };
    error?: string;
  }> {
    try {
      // In a real implementation, this would fetch from the OneRoster API
      // For now, we'll use mock data based on typical TimeBack structure
      
      // Try to fetch user info from OneRoster API
      const usersResponse = await fetchUsers();
      const student = usersResponse.users.find(user => user.sourcedId === studentId);
      
      if (!student) {
        return {
          success: false,
          error: 'Student not found in OneRoster system'
        };
      }

      // Extract school ID from student's org associations
      const schoolId = student.orgs?.[0]?.sourcedId || 'default-school';
      
      return {
        success: true,
        data: {
          studentId,
          schoolId,
          gradeLevel: student.grades?.[0] || 'unknown',
          enrolledClasses: [] // Would be populated from actual API
        }
      };

    } catch (error) {
      console.error('❌ Error fetching student info:', error);
      
      // Fallback to default values for development
      return {
        success: true,
        data: {
          studentId,
          schoolId: 'teaching-tales-school',
          gradeLevel: 'elementary',
          enrolledClasses: []
        }
      };
    }
  }

  /**
   * Create OneRoster class for the story
   */
  private static async createStoryClass(
    data: StoryClassCreationData,
    studentInfo: any
  ): Promise<{ success: boolean; classId?: string; error?: string }> {
    try {
      const currentDate = new Date().toISOString();
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

      const classData: ClassCreationData = {
        title: `${data.storyTitle} - Reading & Comprehension`,
        courseId: 'teaching-tales-reading-course', // This would be a predefined course ID
        schoolId: studentInfo.schoolId,
        termIds: ['current-term'], // This would be fetched from the current academic session
        classCode: `TT-${data.storyId.slice(-8).toUpperCase()}`,
        classType: 'scheduled',
        grades: [data.gradeLevel],
        subjects: ['Reading', 'Language Arts'],
        metadata: {
          storyId: data.storyId,
          universe: data.universe,
          character: data.character,
          spark: data.spark,
          createdBy: 'Teaching Tales',
          assessmentCount: data.assessments.length,
          ...data.metadata
        }
      };

      // Validate class data
      const validation = OneRosterValidator.validateClassCreation(classData);
      if (!validation.isValid) {
        const errorMessages = validation.errors.map(error => error.message).join('; ');
        throw new Error(`Class validation failed: ${errorMessages}`);
      }

      if (validation.warnings.length > 0) {
        console.warn('⚠️ Class creation warnings:', validation.warnings);
      }

      const classResponse = await createClass(classData);
      
      return {
        success: true,
        classId: classResponse.class.sourcedId
      };

    } catch (error) {
      console.error('❌ Failed to create OneRoster class:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create line items for story assessments
   */
  private static async createAssessmentLineItems(
    classId: string,
    assessments: StoryAssessment[],
    storyData: StoryClassCreationData
  ): Promise<Array<{ success: boolean; lineItemId?: string; assessmentId: string; error?: string }>> {
    const results = [];

    for (let i = 0; i < assessments.length; i++) {
      const assessment = assessments[i];
      
      try {
        const assignDate = new Date().toISOString();
        const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now

        const lineItemData: LineItemCreationData = {
          title: `${storyData.storyTitle} - Section ${i + 1} Comprehension`,
          description: `Reading comprehension assessment for section ${i + 1} of ${storyData.storyTitle}`,
          assignDate,
          dueDate,
          classId,
          resultValueMin: 0,
          resultValueMax: assessment.maxScore || 10,
          metadata: {
            storyId: storyData.storyId,
            assessmentId: assessment.id,
            sectionNumber: i + 1,
            universe: storyData.universe,
            character: storyData.character,
            questionCount: assessment.questions?.length || 0,
            assessmentType: 'reading-comprehension',
            createdBy: 'Teaching Tales'
          }
        };

        // Validate line item data
        const validation = OneRosterValidator.validateLineItemCreation(lineItemData);
        if (!validation.isValid) {
          const errorMessages = validation.errors.map(error => error.message).join('; ');
          throw new Error(`Line item validation failed: ${errorMessages}`);
        }

        const lineItemResponse = await createLineItem(lineItemData);
        
        results.push({
          success: true,
          lineItemId: lineItemResponse.lineItem.sourcedId,
          assessmentId: assessment.id
        });

        // Add small delay between requests to avoid overwhelming the API
        if (i < assessments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }

      } catch (error) {
        console.error(`❌ Failed to create line item for assessment ${assessment.id}:`, error);
        results.push({
          success: false,
          assessmentId: assessment.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Enroll student in the created class
   */
  private static async enrollStudentInClass(
    classId: string,
    studentId: string,
    schoolId: string
  ): Promise<{ success: boolean; enrollmentId?: string; error?: string }> {
    try {
      const enrollmentData: EnrollmentCreationData = {
        userId: studentId,
        classId,
        schoolId,
        role: 'student',
        primary: true,
        beginDate: new Date().toISOString(),
        // endDate would be set based on the course/term duration
        metadata: {
          enrolledBy: 'Teaching Tales',
          enrollmentType: 'story-based-learning',
          autoEnrolled: true
        }
      };

      // Validate enrollment data
      const validation = OneRosterValidator.validateEnrollmentCreation(enrollmentData);
      if (!validation.isValid) {
        const errorMessages = validation.errors.map(error => error.message).join('; ');
        throw new Error(`Enrollment validation failed: ${errorMessages}`);
      }

      const enrollmentResponse = await enrollStudent(enrollmentData);
      
      return {
        success: true,
        enrollmentId: enrollmentResponse.enrollment.sourcedId
      };

    } catch (error) {
      console.error('❌ Failed to enroll student in class:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Submit grades for completed assessments
   */
  static async submitGrades(
    grades: GradeSubmissionData[]
  ): Promise<{
    successful: Array<{ lineItemId: string; studentId: string; resultId: string }>;
    failed: Array<{ lineItemId: string; studentId: string; error: string }>;
  }> {
    const successful = [];
    const failed = [];


    for (const grade of grades) {
      try {
        const resultData: ResultData = {
          lineItemId: grade.lineItemId,
          studentId: grade.studentId,
          scoreGiven: grade.score,
          scoreMaximum: grade.maxScore,
          comment: grade.comment || `${grade.accuracy.toFixed(1)}% accuracy on Teaching Tales assessment`,
          timestamp: new Date().toISOString(),
          metadata: {
            assessmentId: grade.assessmentId,
            accuracy: grade.accuracy,
            timeSpent: grade.timeSpent,
            attempts: grade.attempts,
            submittedBy: 'Teaching Tales'
          }
        };

        // Validate result data
        const validation = OneRosterValidator.validateResultData(resultData);
        if (!validation.isValid) {
          const errorMessages = validation.errors.map(error => error.message).join('; ');
          throw new Error(`Result validation failed: ${errorMessages}`);
        }

        const resultResponse = await updateResult(resultData);
        
        successful.push({
          lineItemId: grade.lineItemId,
          studentId: grade.studentId,
          resultId: resultResponse.result.sourcedId
        });

      } catch (error) {
        console.error(`❌ Failed to submit grade for ${grade.lineItemId}:`, error);
        failed.push({
          lineItemId: grade.lineItemId,
          studentId: grade.studentId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Add delay between submissions
      await new Promise(resolve => setTimeout(resolve, 300));
    }


    return { successful, failed };
  }

  /**
   * Rollback created OneRoster resources (best effort)
   */
  private static async rollbackCreatedResources(
    resources: RollbackData['createdResources']
  ): Promise<void> {

    // Note: OneRoster API typically doesn't support DELETE operations
    // In a real implementation, you might:
    // 1. Mark resources as "tobedeleted" status
    // 2. Keep a rollback log for manual cleanup
    // 3. Use administrative APIs if available

    for (const resource of resources) {
      try {
        // Actual rollback implementation would go here
        
      } catch (error) {
        console.error(`❌ Failed to rollback ${resource.type} ${resource.id}:`, error);
      }
    }

  }

  /**
   * Get integration status for a story
   */
  static async getIntegrationStatus(storyId: string): Promise<{
    hasIntegration: boolean;
    classId?: string;
    lineItemIds?: string[];
    enrollmentId?: string;
    error?: string;
  }> {
    try {
      // This would query the stored metadata to check integration status
      // For now, we'll return a basic implementation
      
      return {
        hasIntegration: false,
        error: 'Integration status checking not yet implemented'
      };

    } catch (error) {
      return {
        hasIntegration: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export default instance for convenience
export const oneRosterIntegrationService = OneRosterIntegrationService;
