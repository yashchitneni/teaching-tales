/**
 * @fileoverview OneRoster Data Validation
 * 
 * This module provides comprehensive validation for OneRoster API payloads
 * to ensure compliance with OneRoster v1.2 specification and TimeBack API requirements.
 */

import { 
  ClassCreationData, 
  LineItemCreationData, 
  EnrollmentCreationData, 
  ResultData 
} from './oneroster-client';

// Validation result interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  suggestion?: string;
}

// OneRoster validation constants
const ONEROSTER_CONSTANTS = {
  // Maximum lengths as per OneRoster spec
  MAX_TITLE_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 1024,
  MAX_CLASS_CODE_LENGTH: 64,
  MAX_COMMENT_LENGTH: 1024,
  
  // Valid enum values
  CLASS_TYPES: ['homeroom', 'scheduled', 'other'] as const,
  ENROLLMENT_ROLES: ['student', 'teacher', 'aide', 'parent', 'guardian'] as const,
  STATUSES: ['active', 'tobedeleted'] as const,
  
  // Regex patterns
  SOURCED_ID_PATTERN: /^[a-zA-Z0-9\-_]{1,255}$/,
  ISO_DATE_PATTERN: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Score ranges
  MIN_SCORE: 0,
  MAX_SCORE: 1000000 // Reasonable upper limit
};

/**
 * OneRoster Data Validator
 */
export class OneRosterValidator {
  
  /**
   * Validate class creation data
   */
  static validateClassCreation(data: ClassCreationData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required field validation
    if (!data.title || typeof data.title !== 'string') {
      errors.push({
        field: 'title',
        message: 'Title is required and must be a non-empty string',
        code: 'MISSING_TITLE',
        severity: 'critical'
      });
    } else if (data.title.length > ONEROSTER_CONSTANTS.MAX_TITLE_LENGTH) {
      errors.push({
        field: 'title',
        message: `Title exceeds maximum length of ${ONEROSTER_CONSTANTS.MAX_TITLE_LENGTH} characters`,
        code: 'TITLE_TOO_LONG',
        severity: 'error'
      });
    } else if (data.title.trim().length === 0) {
      errors.push({
        field: 'title',
        message: 'Title cannot be empty or contain only whitespace',
        code: 'EMPTY_TITLE',
        severity: 'error'
      });
    }

    if (!data.courseId || typeof data.courseId !== 'string') {
      errors.push({
        field: 'courseId',
        message: 'Course ID is required and must be a non-empty string',
        code: 'MISSING_COURSE_ID',
        severity: 'critical'
      });
    } else if (!ONEROSTER_CONSTANTS.SOURCED_ID_PATTERN.test(data.courseId)) {
      errors.push({
        field: 'courseId',
        message: 'Course ID must match OneRoster sourcedId pattern (alphanumeric, hyphens, underscores only)',
        code: 'INVALID_COURSE_ID_FORMAT',
        severity: 'error'
      });
    }

    if (!data.schoolId || typeof data.schoolId !== 'string') {
      errors.push({
        field: 'schoolId',
        message: 'School ID is required and must be a non-empty string',
        code: 'MISSING_SCHOOL_ID',
        severity: 'critical'
      });
    } else if (!ONEROSTER_CONSTANTS.SOURCED_ID_PATTERN.test(data.schoolId)) {
      errors.push({
        field: 'schoolId',
        message: 'School ID must match OneRoster sourcedId pattern',
        code: 'INVALID_SCHOOL_ID_FORMAT',
        severity: 'error'
      });
    }

    if (!data.termIds || !Array.isArray(data.termIds) || data.termIds.length === 0) {
      errors.push({
        field: 'termIds',
        message: 'At least one term ID is required',
        code: 'MISSING_TERM_IDS',
        severity: 'critical'
      });
    } else {
      data.termIds.forEach((termId, index) => {
        if (!termId || typeof termId !== 'string') {
          errors.push({
            field: `termIds[${index}]`,
            message: 'Term ID must be a non-empty string',
            code: 'INVALID_TERM_ID',
            severity: 'error'
          });
        } else if (!ONEROSTER_CONSTANTS.SOURCED_ID_PATTERN.test(termId)) {
          errors.push({
            field: `termIds[${index}]`,
            message: 'Term ID must match OneRoster sourcedId pattern',
            code: 'INVALID_TERM_ID_FORMAT',
            severity: 'error'
          });
        }
      });
    }

    // Optional field validation
    if (data.classCode && typeof data.classCode === 'string') {
      if (data.classCode.length > ONEROSTER_CONSTANTS.MAX_CLASS_CODE_LENGTH) {
        errors.push({
          field: 'classCode',
          message: `Class code exceeds maximum length of ${ONEROSTER_CONSTANTS.MAX_CLASS_CODE_LENGTH} characters`,
          code: 'CLASS_CODE_TOO_LONG',
          severity: 'error'
        });
      }
    }

    if (data.classType && !ONEROSTER_CONSTANTS.CLASS_TYPES.includes(data.classType as any)) {
      errors.push({
        field: 'classType',
        message: `Class type must be one of: ${ONEROSTER_CONSTANTS.CLASS_TYPES.join(', ')}`,
        code: 'INVALID_CLASS_TYPE',
        severity: 'error'
      });
    }

    if (data.grades && Array.isArray(data.grades)) {
      data.grades.forEach((grade, index) => {
        if (typeof grade !== 'string' || grade.trim().length === 0) {
          warnings.push({
            field: `grades[${index}]`,
            message: 'Grade should be a non-empty string',
            code: 'INVALID_GRADE_FORMAT',
            suggestion: 'Use standard grade level formats like "K", "1", "2", etc.'
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate line item creation data
   */
  static validateLineItemCreation(data: LineItemCreationData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required field validation
    if (!data.title || typeof data.title !== 'string') {
      errors.push({
        field: 'title',
        message: 'Title is required and must be a non-empty string',
        code: 'MISSING_TITLE',
        severity: 'critical'
      });
    } else if (data.title.length > ONEROSTER_CONSTANTS.MAX_TITLE_LENGTH) {
      errors.push({
        field: 'title',
        message: `Title exceeds maximum length of ${ONEROSTER_CONSTANTS.MAX_TITLE_LENGTH} characters`,
        code: 'TITLE_TOO_LONG',
        severity: 'error'
      });
    }

    if (!data.classId || typeof data.classId !== 'string') {
      errors.push({
        field: 'classId',
        message: 'Class ID is required and must be a non-empty string',
        code: 'MISSING_CLASS_ID',
        severity: 'critical'
      });
    } else if (!ONEROSTER_CONSTANTS.SOURCED_ID_PATTERN.test(data.classId)) {
      errors.push({
        field: 'classId',
        message: 'Class ID must match OneRoster sourcedId pattern',
        code: 'INVALID_CLASS_ID_FORMAT',
        severity: 'error'
      });
    }

    // Date validation
    if (!data.assignDate || typeof data.assignDate !== 'string') {
      errors.push({
        field: 'assignDate',
        message: 'Assign date is required and must be an ISO date string',
        code: 'MISSING_ASSIGN_DATE',
        severity: 'critical'
      });
    } else if (!ONEROSTER_CONSTANTS.ISO_DATE_PATTERN.test(data.assignDate)) {
      errors.push({
        field: 'assignDate',
        message: 'Assign date must be a valid ISO 8601 date string',
        code: 'INVALID_ASSIGN_DATE_FORMAT',
        severity: 'error'
      });
    }

    if (!data.dueDate || typeof data.dueDate !== 'string') {
      errors.push({
        field: 'dueDate',
        message: 'Due date is required and must be an ISO date string',
        code: 'MISSING_DUE_DATE',
        severity: 'critical'
      });
    } else if (!ONEROSTER_CONSTANTS.ISO_DATE_PATTERN.test(data.dueDate)) {
      errors.push({
        field: 'dueDate',
        message: 'Due date must be a valid ISO 8601 date string',
        code: 'INVALID_DUE_DATE_FORMAT',
        severity: 'error'
      });
    }

    // Date logic validation
    if (data.assignDate && data.dueDate && 
        ONEROSTER_CONSTANTS.ISO_DATE_PATTERN.test(data.assignDate) &&
        ONEROSTER_CONSTANTS.ISO_DATE_PATTERN.test(data.dueDate)) {
      const assignDate = new Date(data.assignDate);
      const dueDate = new Date(data.dueDate);
      
      if (dueDate <= assignDate) {
        errors.push({
          field: 'dueDate',
          message: 'Due date must be after assign date',
          code: 'INVALID_DATE_SEQUENCE',
          severity: 'error'
        });
      }
      
      // Warning for very long assignments (more than 6 months)
      const sixMonthsLater = new Date(assignDate);
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
      if (dueDate > sixMonthsLater) {
        warnings.push({
          field: 'dueDate',
          message: 'Assignment duration is longer than 6 months',
          code: 'LONG_ASSIGNMENT_DURATION',
          suggestion: 'Consider breaking long assignments into smaller parts'
        });
      }
    }

    // Score validation
    if (data.resultValueMax === undefined || data.resultValueMax === null) {
      errors.push({
        field: 'resultValueMax',
        message: 'Maximum result value is required',
        code: 'MISSING_MAX_SCORE',
        severity: 'critical'
      });
    } else if (typeof data.resultValueMax !== 'number' || data.resultValueMax <= 0) {
      errors.push({
        field: 'resultValueMax',
        message: 'Maximum result value must be a positive number',
        code: 'INVALID_MAX_SCORE',
        severity: 'error'
      });
    } else if (data.resultValueMax > ONEROSTER_CONSTANTS.MAX_SCORE) {
      warnings.push({
        field: 'resultValueMax',
        message: `Maximum score is unusually high (${data.resultValueMax})`,
        code: 'HIGH_MAX_SCORE',
        suggestion: 'Consider using a more reasonable maximum score'
      });
    }

    if (data.resultValueMin !== undefined && 
        (typeof data.resultValueMin !== 'number' || data.resultValueMin < 0)) {
      errors.push({
        field: 'resultValueMin',
        message: 'Minimum result value must be a non-negative number',
        code: 'INVALID_MIN_SCORE',
        severity: 'error'
      });
    }

    if (data.resultValueMin !== undefined && data.resultValueMax !== undefined &&
        data.resultValueMin >= data.resultValueMax) {
      errors.push({
        field: 'resultValueMin',
        message: 'Minimum result value must be less than maximum result value',
        code: 'INVALID_SCORE_RANGE',
        severity: 'error'
      });
    }

    // Optional field validation
    if (data.description && typeof data.description === 'string' &&
        data.description.length > ONEROSTER_CONSTANTS.MAX_DESCRIPTION_LENGTH) {
      errors.push({
        field: 'description',
        message: `Description exceeds maximum length of ${ONEROSTER_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters`,
        code: 'DESCRIPTION_TOO_LONG',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate enrollment creation data
   */
  static validateEnrollmentCreation(data: EnrollmentCreationData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required field validation
    if (!data.userId || typeof data.userId !== 'string') {
      errors.push({
        field: 'userId',
        message: 'User ID is required and must be a non-empty string',
        code: 'MISSING_USER_ID',
        severity: 'critical'
      });
    } else if (!ONEROSTER_CONSTANTS.SOURCED_ID_PATTERN.test(data.userId)) {
      errors.push({
        field: 'userId',
        message: 'User ID must match OneRoster sourcedId pattern',
        code: 'INVALID_USER_ID_FORMAT',
        severity: 'error'
      });
    }

    if (!data.classId || typeof data.classId !== 'string') {
      errors.push({
        field: 'classId',
        message: 'Class ID is required and must be a non-empty string',
        code: 'MISSING_CLASS_ID',
        severity: 'critical'
      });
    } else if (!ONEROSTER_CONSTANTS.SOURCED_ID_PATTERN.test(data.classId)) {
      errors.push({
        field: 'classId',
        message: 'Class ID must match OneRoster sourcedId pattern',
        code: 'INVALID_CLASS_ID_FORMAT',
        severity: 'error'
      });
    }

    if (!data.schoolId || typeof data.schoolId !== 'string') {
      errors.push({
        field: 'schoolId',
        message: 'School ID is required and must be a non-empty string',
        code: 'MISSING_SCHOOL_ID',
        severity: 'critical'
      });
    } else if (!ONEROSTER_CONSTANTS.SOURCED_ID_PATTERN.test(data.schoolId)) {
      errors.push({
        field: 'schoolId',
        message: 'School ID must match OneRoster sourcedId pattern',
        code: 'INVALID_SCHOOL_ID_FORMAT',
        severity: 'error'
      });
    }

    if (!data.role || !ONEROSTER_CONSTANTS.ENROLLMENT_ROLES.includes(data.role as any)) {
      errors.push({
        field: 'role',
        message: `Role must be one of: ${ONEROSTER_CONSTANTS.ENROLLMENT_ROLES.join(', ')}`,
        code: 'INVALID_ROLE',
        severity: 'critical'
      });
    }

    if (!data.beginDate || typeof data.beginDate !== 'string') {
      errors.push({
        field: 'beginDate',
        message: 'Begin date is required and must be an ISO date string',
        code: 'MISSING_BEGIN_DATE',
        severity: 'critical'
      });
    } else if (!ONEROSTER_CONSTANTS.ISO_DATE_PATTERN.test(data.beginDate)) {
      errors.push({
        field: 'beginDate',
        message: 'Begin date must be a valid ISO 8601 date string',
        code: 'INVALID_BEGIN_DATE_FORMAT',
        severity: 'error'
      });
    }

    // Optional field validation
    if (data.endDate && typeof data.endDate === 'string') {
      if (!ONEROSTER_CONSTANTS.ISO_DATE_PATTERN.test(data.endDate)) {
        errors.push({
          field: 'endDate',
          message: 'End date must be a valid ISO 8601 date string',
          code: 'INVALID_END_DATE_FORMAT',
          severity: 'error'
        });
      }
      
      // Date logic validation
      if (data.beginDate && ONEROSTER_CONSTANTS.ISO_DATE_PATTERN.test(data.beginDate)) {
        const beginDate = new Date(data.beginDate);
        const endDate = new Date(data.endDate);
        
        if (endDate <= beginDate) {
          errors.push({
            field: 'endDate',
            message: 'End date must be after begin date',
            code: 'INVALID_ENROLLMENT_DATE_SEQUENCE',
            severity: 'error'
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate result data
   */
  static validateResultData(data: ResultData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required field validation
    if (!data.lineItemId || typeof data.lineItemId !== 'string') {
      errors.push({
        field: 'lineItemId',
        message: 'Line item ID is required and must be a non-empty string',
        code: 'MISSING_LINE_ITEM_ID',
        severity: 'critical'
      });
    } else if (!ONEROSTER_CONSTANTS.SOURCED_ID_PATTERN.test(data.lineItemId)) {
      errors.push({
        field: 'lineItemId',
        message: 'Line item ID must match OneRoster sourcedId pattern',
        code: 'INVALID_LINE_ITEM_ID_FORMAT',
        severity: 'error'
      });
    }

    if (!data.studentId || typeof data.studentId !== 'string') {
      errors.push({
        field: 'studentId',
        message: 'Student ID is required and must be a non-empty string',
        code: 'MISSING_STUDENT_ID',
        severity: 'critical'
      });
    } else if (!ONEROSTER_CONSTANTS.SOURCED_ID_PATTERN.test(data.studentId)) {
      errors.push({
        field: 'studentId',
        message: 'Student ID must match OneRoster sourcedId pattern',
        code: 'INVALID_STUDENT_ID_FORMAT',
        severity: 'error'
      });
    }

    // Score validation
    if (data.scoreGiven === undefined || data.scoreGiven === null) {
      errors.push({
        field: 'scoreGiven',
        message: 'Score given is required',
        code: 'MISSING_SCORE_GIVEN',
        severity: 'critical'
      });
    } else if (typeof data.scoreGiven !== 'number' || data.scoreGiven < 0) {
      errors.push({
        field: 'scoreGiven',
        message: 'Score given must be a non-negative number',
        code: 'INVALID_SCORE_GIVEN',
        severity: 'error'
      });
    }

    if (data.scoreMaximum === undefined || data.scoreMaximum === null) {
      errors.push({
        field: 'scoreMaximum',
        message: 'Maximum score is required',
        code: 'MISSING_SCORE_MAXIMUM',
        severity: 'critical'
      });
    } else if (typeof data.scoreMaximum !== 'number' || data.scoreMaximum <= 0) {
      errors.push({
        field: 'scoreMaximum',
        message: 'Maximum score must be a positive number',
        code: 'INVALID_SCORE_MAXIMUM',
        severity: 'error'
      });
    }

    // Score relationship validation
    if (typeof data.scoreGiven === 'number' && typeof data.scoreMaximum === 'number') {
      if (data.scoreGiven > data.scoreMaximum) {
        errors.push({
          field: 'scoreGiven',
          message: 'Score given cannot exceed maximum score',
          code: 'SCORE_EXCEEDS_MAXIMUM',
          severity: 'error'
        });
      }

      // Warning for perfect scores (might indicate too easy assessment)
      if (data.scoreGiven === data.scoreMaximum && data.scoreMaximum > 0) {
        warnings.push({
          field: 'scoreGiven',
          message: 'Perfect score achieved',
          code: 'PERFECT_SCORE',
          suggestion: 'Verify assessment difficulty is appropriate'
        });
      }

      // Warning for zero scores (might indicate technical issues)
      if (data.scoreGiven === 0) {
        warnings.push({
          field: 'scoreGiven',
          message: 'Zero score recorded',
          code: 'ZERO_SCORE',
          suggestion: 'Verify this is intentional and not due to technical issues'
        });
      }
    }

    if (!data.timestamp || typeof data.timestamp !== 'string') {
      errors.push({
        field: 'timestamp',
        message: 'Timestamp is required and must be an ISO date string',
        code: 'MISSING_TIMESTAMP',
        severity: 'critical'
      });
    } else if (!ONEROSTER_CONSTANTS.ISO_DATE_PATTERN.test(data.timestamp)) {
      errors.push({
        field: 'timestamp',
        message: 'Timestamp must be a valid ISO 8601 date string',
        code: 'INVALID_TIMESTAMP_FORMAT',
        severity: 'error'
      });
    } else {
      // Check if timestamp is in the future
      const timestamp = new Date(data.timestamp);
      const now = new Date();
      if (timestamp > now) {
        warnings.push({
          field: 'timestamp',
          message: 'Timestamp is in the future',
          code: 'FUTURE_TIMESTAMP',
          suggestion: 'Verify timestamp accuracy'
        });
      }
    }

    // Optional field validation
    if (data.comment && typeof data.comment === 'string' &&
        data.comment.length > ONEROSTER_CONSTANTS.MAX_COMMENT_LENGTH) {
      errors.push({
        field: 'comment',
        message: `Comment exceeds maximum length of ${ONEROSTER_CONSTANTS.MAX_COMMENT_LENGTH} characters`,
        code: 'COMMENT_TOO_LONG',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate multiple data objects at once
   */
  static validateBatch(validations: Array<{
    type: 'class' | 'lineItem' | 'enrollment' | 'result';
    data: any;
    identifier?: string;
  }>): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];

    validations.forEach((validation, index) => {
      const identifier = validation.identifier || `item_${index}`;
      let result: ValidationResult;

      switch (validation.type) {
        case 'class':
          result = this.validateClassCreation(validation.data);
          break;
        case 'lineItem':
          result = this.validateLineItemCreation(validation.data);
          break;
        case 'enrollment':
          result = this.validateEnrollmentCreation(validation.data);
          break;
        case 'result':
          result = this.validateResultData(validation.data);
          break;
        default:
          result = {
            isValid: false,
            errors: [{
              field: 'type',
              message: `Unknown validation type: ${validation.type}`,
              code: 'UNKNOWN_VALIDATION_TYPE',
              severity: 'critical'
            }],
            warnings: []
          };
      }

      // Prefix field names with identifier for batch context
      result.errors.forEach(error => {
        allErrors.push({
          ...error,
          field: `${identifier}.${error.field}`
        });
      });

      result.warnings.forEach(warning => {
        allWarnings.push({
          ...warning,
          field: `${identifier}.${warning.field}`
        });
      });
    });

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }
}

// Export default instance for convenience
export const onerosterValidator = OneRosterValidator;
