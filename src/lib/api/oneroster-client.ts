// Updated to use server-side proxy routes for security
// See docs/AUTHENTICATION_ARCHITECTURE.md for details

// All requests now go through Next.js API routes
const ONEROSTER_BASE_URL = '/api/ims/oneroster/rostering/v1p2';

// Base response interfaces
interface Organization {
  sourcedId: string;
  status?: string;
  dateLastModified?: string;
  name: string;
  type: string;
  identifier?: string;
}

interface AcademicSession {
  sourcedId: string;
  status: string;
  dateLastModified: string;
  title: string;
  startDate: string;
  endDate: string;
  type: string;
  schoolYear: string;
}

interface Course {
  sourcedId: string;
  status: string;
  dateLastModified: string;
  title: string;
  courseCode: string;
  grades: string[];
  subjects: string[];
  org: {
    href: string;
    sourcedId: string;
    type: string;
  };
}

interface User {
  sourcedId: string;
  status: string;
  dateLastModified: string;
  username: string;
  enabledUser: boolean;
  givenName: string;
  familyName: string;
  middleName?: string;
  role: string;
  identifier: string;
  email: string;
  grades?: string[];
  orgs: Array<{
    href: string;
    sourcedId: string;
    type: string;
  }>;
}

interface Class {
  sourcedId: string;
  status: string;
  dateLastModified: string;
  title: string;
  classCode: string;
  classType: string;
  grades: string[];
  subjects: string[];
  course: {
    href: string;
    sourcedId: string;
    type: string;
  };
  school: {
    href: string;
    sourcedId: string;
    type: string;
  };
  terms: Array<{
    href: string;
    sourcedId: string;
    type: string;
  }>;
}

interface Enrollment {
  sourcedId: string;
  status: string;
  dateLastModified: string;
  role: string;
  primary?: boolean;
  beginDate: string;
  endDate: string;
  user: {
    href: string;
    sourcedId: string;
    type: string;
  };
  class: {
    href: string;
    sourcedId: string;
    type: string;
  };
  school: {
    href: string;
    sourcedId: string;
    type: string;
  };
}

// Response wrapper interfaces
interface OrganizationsResponse {
  orgs: Organization[];
}

interface AcademicSessionsResponse {
  academicSessions: AcademicSession[];
}

interface CoursesResponse {
  courses: Course[];
}

interface UsersResponse {
  users: User[];
}

interface ClassesResponse {
  classes: Class[];
}

interface EnrollmentsResponse {
  enrollments: Enrollment[];
}

// Single resource response interfaces
interface OrganizationResponse {
  org: Organization;
}

interface UserResponse {
  user: User;
}

interface CourseResponse {
  course: Course;
}

interface ClassResponse {
  class: Class;
}

interface AcademicSessionResponse {
  academicSession: AcademicSession;
}

interface EnrollmentResponse {
  enrollment: Enrollment;
}

// Common fetch options - no token needed, cookies are sent automatically
const getFetchOptions = (): RequestInit => {
  return {
    credentials: 'include',  // Include HttpOnly cookies
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  };
};

// Error handling
class OneRosterError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'OneRosterError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new OneRosterError(
      `OneRoster API error: ${response.statusText}`,
      response.status
    );
  }
  return response.json();
}

// Collection endpoints
export async function fetchOrganizations(): Promise<OrganizationsResponse> {
  const response = await fetch(`${ONEROSTER_BASE_URL}/orgs`, getFetchOptions());
  return handleResponse<OrganizationsResponse>(response);
}

export async function fetchAcademicSessions(): Promise<AcademicSessionsResponse> {
  const response = await fetch(`${ONEROSTER_BASE_URL}/academicSessions`, getFetchOptions());
  return handleResponse<AcademicSessionsResponse>(response);
}

export async function fetchCourses(): Promise<CoursesResponse> {
  const response = await fetch(`${ONEROSTER_BASE_URL}/courses`, getFetchOptions());
  return handleResponse<CoursesResponse>(response);
}

export async function fetchUsers(filters?: { role?: string }): Promise<UsersResponse> {
  let url = `${ONEROSTER_BASE_URL}/users`;
  
  if (filters?.role) {
    const params = new URLSearchParams();
    params.append('filter', `role='${filters.role}'`);
    url += `?${params.toString()}`;
  }
  
  const response = await fetch(url, getFetchOptions());
  return handleResponse<UsersResponse>(response);
}

export async function fetchClasses(): Promise<ClassesResponse> {
  const response = await fetch(`${ONEROSTER_BASE_URL}/classes`, getFetchOptions());
  return handleResponse<ClassesResponse>(response);
}

export async function fetchEnrollments(): Promise<EnrollmentsResponse> {
  const response = await fetch(`${ONEROSTER_BASE_URL}/enrollments`, getFetchOptions());
  return handleResponse<EnrollmentsResponse>(response);
}

// Single resource endpoints
export async function fetchOrganization(id: string): Promise<OrganizationResponse> {
  const response = await fetch(`${ONEROSTER_BASE_URL}/orgs/${id}`, getFetchOptions());
  return handleResponse<OrganizationResponse>(response);
}

export async function fetchUser(id: string): Promise<UserResponse> {
  const response = await fetch(`${ONEROSTER_BASE_URL}/users/${id}`, getFetchOptions());
  return handleResponse<UserResponse>(response);
}

export async function fetchCourse(id: string): Promise<CourseResponse> {
  const response = await fetch(`${ONEROSTER_BASE_URL}/courses/${id}`, getFetchOptions());
  return handleResponse<CourseResponse>(response);
}

export async function fetchClass(id: string): Promise<ClassResponse> {
  const response = await fetch(`${ONEROSTER_BASE_URL}/classes/${id}`, getFetchOptions());
  return handleResponse<ClassResponse>(response);
}

export async function fetchAcademicSession(id: string): Promise<AcademicSessionResponse> {
  const response = await fetch(`${ONEROSTER_BASE_URL}/academicSessions/${id}`, getFetchOptions());
  return handleResponse<AcademicSessionResponse>(response);
}

// Relational endpoints
export async function fetchClassesForSchool(schoolId: string): Promise<ClassesResponse> {
  const response = await fetch(`${ONEROSTER_BASE_URL}/schools/${schoolId}/classes`, getFetchOptions());
  return handleResponse<ClassesResponse>(response);
}

export async function fetchStudentsForClass(classId: string): Promise<UsersResponse> {
  const response = await fetch(`${ONEROSTER_BASE_URL}/classes/${classId}/students`, getFetchOptions());
  return handleResponse<UsersResponse>(response);
}

export async function fetchTeachersForClass(classId: string): Promise<UsersResponse> {
  const response = await fetch(`${ONEROSTER_BASE_URL}/classes/${classId}/teachers`, getFetchOptions());
  return handleResponse<UsersResponse>(response);
}

export async function fetchClassesForUser(userId: string): Promise<ClassesResponse> {
  const response = await fetch(`${ONEROSTER_BASE_URL}/users/${userId}/classes`, getFetchOptions());
  return handleResponse<ClassesResponse>(response);
}

// ===== WRITE OPERATIONS =====
// The following functions provide write capabilities for OneRoster resources

// Class creation interfaces
interface ClassCreationData {
  title: string;
  courseId: string;
  schoolId: string;
  termIds: string[];
  classCode?: string;
  classType?: 'homeroom' | 'scheduled' | 'other';
  grades?: string[];
  subjects?: string[];
  metadata?: Record<string, any>;
}

interface LineItemCreationData {
  title: string;
  description?: string;
  assignDate: string; // ISO date string
  dueDate: string; // ISO date string
  classId: string;
  categoryId?: string;
  gradingPeriodId?: string;
  resultValueMin?: number;
  resultValueMax: number;
  metadata?: Record<string, any>;
}

interface EnrollmentCreationData {
  userId: string;
  classId: string;
  schoolId: string;
  role: 'student' | 'teacher' | 'aide' | 'parent' | 'guardian';
  primary?: boolean;
  beginDate: string; // ISO date string
  endDate?: string; // ISO date string
  metadata?: Record<string, any>;
}

interface ResultData {
  lineItemId: string;
  studentId: string;
  scoreGiven: number;
  scoreMaximum: number;
  comment?: string;
  timestamp: string; // ISO date string
  metadata?: Record<string, any>;
}

// LineItem interface
interface LineItem {
  sourcedId: string;
  status: string;
  dateLastModified: string;
  title: string;
  description?: string;
  assignDate: string;
  dueDate: string;
  class: {
    href: string;
    sourcedId: string;
    type: string;
  };
  category?: {
    href: string;
    sourcedId: string;
    type: string;
  };
  gradingPeriod?: {
    href: string;
    sourcedId: string;
    type: string;
  };
  resultValueMin: number;
  resultValueMax: number;
  metadata?: Record<string, any>;
}

// Result interface
interface Result {
  sourcedId: string;
  status: string;
  dateLastModified: string;
  lineItem: {
    href: string;
    sourcedId: string;
    type: string;
  };
  student: {
    href: string;
    sourcedId: string;
    type: string;
  };
  scoreGiven: number;
  scoreMaximum: number;
  comment?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Response interfaces for write operations
interface LineItemResponse {
  lineItem: LineItem;
}

interface ResultResponse {
  result: Result;
}

/**
 * Create a new OneRoster class
 */
export async function createClass(classData: ClassCreationData): Promise<ClassResponse> {
  console.log('🏫 Creating OneRoster class:', classData.title);

  // Validate required fields
  if (!classData.title || !classData.courseId || !classData.schoolId || !classData.termIds?.length) {
    throw new OneRosterError('Missing required fields: title, courseId, schoolId, and termIds are required');
  }

  // Build the OneRoster class payload
  const classPayload = {
    sourcedId: `class-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'active',
    dateLastModified: new Date().toISOString(),
    title: classData.title,
    classCode: classData.classCode || `CLASS-${Date.now()}`,
    classType: classData.classType || 'scheduled',
    grades: classData.grades || [],
    subjects: classData.subjects || [],
    course: {
      href: `${ONEROSTER_BASE_URL}/courses/${classData.courseId}`,
      sourcedId: classData.courseId,
      type: 'course'
    },
    school: {
      href: `${ONEROSTER_BASE_URL}/orgs/${classData.schoolId}`,
      sourcedId: classData.schoolId,
      type: 'school'
    },
    terms: classData.termIds.map(termId => ({
      href: `${ONEROSTER_BASE_URL}/academicSessions/${termId}`,
      sourcedId: termId,
      type: 'academicSession'
    })),
    metadata: classData.metadata || {}
  };

  try {
    const response = await fetch(`${ONEROSTER_BASE_URL}/classes`, {
      method: 'POST',
      ...getFetchOptions(),
      body: JSON.stringify({ class: classPayload })
    });

    const result = await handleResponse<ClassResponse>(response);
    console.log('✅ OneRoster class created successfully:', result.class.sourcedId);
    return result;

  } catch (error) {
    console.error('❌ Failed to create OneRoster class:', error);
    throw new OneRosterError(`Failed to create class: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a new OneRoster line item (assignment/assessment)
 */
export async function createLineItem(lineItemData: LineItemCreationData): Promise<LineItemResponse> {
  console.log('📝 Creating OneRoster line item:', lineItemData.title);

  // Validate required fields
  if (!lineItemData.title || !lineItemData.classId || !lineItemData.assignDate || 
      !lineItemData.dueDate || lineItemData.resultValueMax === undefined) {
    throw new OneRosterError('Missing required fields: title, classId, assignDate, dueDate, and resultValueMax are required');
  }

  // Build the OneRoster line item payload
  const lineItemPayload = {
    sourcedId: `lineitem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'active',
    dateLastModified: new Date().toISOString(),
    title: lineItemData.title,
    description: lineItemData.description || '',
    assignDate: lineItemData.assignDate,
    dueDate: lineItemData.dueDate,
    class: {
      href: `${ONEROSTER_BASE_URL}/classes/${lineItemData.classId}`,
      sourcedId: lineItemData.classId,
      type: 'class'
    },
    resultValueMin: lineItemData.resultValueMin || 0,
    resultValueMax: lineItemData.resultValueMax,
    metadata: lineItemData.metadata || {}
  };

  // Add optional references
  if (lineItemData.categoryId) {
    (lineItemPayload as any).category = {
      href: `${ONEROSTER_BASE_URL}/categories/${lineItemData.categoryId}`,
      sourcedId: lineItemData.categoryId,
      type: 'category'
    };
  }

  if (lineItemData.gradingPeriodId) {
    (lineItemPayload as any).gradingPeriod = {
      href: `${ONEROSTER_BASE_URL}/academicSessions/${lineItemData.gradingPeriodId}`,
      sourcedId: lineItemData.gradingPeriodId,
      type: 'academicSession'
    };
  }

  try {
    const response = await fetch(`${ONEROSTER_BASE_URL}/lineItems`, {
      method: 'POST',
      ...getFetchOptions(),
      body: JSON.stringify({ lineItem: lineItemPayload })
    });

    const result = await handleResponse<LineItemResponse>(response);
    console.log('✅ OneRoster line item created successfully:', result.lineItem.sourcedId);
    return result;

  } catch (error) {
    console.error('❌ Failed to create OneRoster line item:', error);
    throw new OneRosterError(`Failed to create line item: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enroll a student in a OneRoster class
 */
export async function enrollStudent(enrollmentData: EnrollmentCreationData): Promise<EnrollmentResponse> {
  console.log('👨‍🎓 Enrolling student in OneRoster class:', {
    userId: enrollmentData.userId,
    classId: enrollmentData.classId,
    role: enrollmentData.role
  });

  // Validate required fields
  if (!enrollmentData.userId || !enrollmentData.classId || !enrollmentData.schoolId || 
      !enrollmentData.role || !enrollmentData.beginDate) {
    throw new OneRosterError('Missing required fields: userId, classId, schoolId, role, and beginDate are required');
  }

  // Build the OneRoster enrollment payload
  const enrollmentPayload = {
    sourcedId: `enrollment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'active',
    dateLastModified: new Date().toISOString(),
    role: enrollmentData.role,
    primary: enrollmentData.primary || true,
    beginDate: enrollmentData.beginDate,
    endDate: enrollmentData.endDate,
    user: {
      href: `${ONEROSTER_BASE_URL}/users/${enrollmentData.userId}`,
      sourcedId: enrollmentData.userId,
      type: 'user'
    },
    class: {
      href: `${ONEROSTER_BASE_URL}/classes/${enrollmentData.classId}`,
      sourcedId: enrollmentData.classId,
      type: 'class'
    },
    school: {
      href: `${ONEROSTER_BASE_URL}/orgs/${enrollmentData.schoolId}`,
      sourcedId: enrollmentData.schoolId,
      type: 'org'
    },
    metadata: enrollmentData.metadata || {}
  };

  try {
    const response = await fetch(`${ONEROSTER_BASE_URL}/enrollments`, {
      method: 'POST',
      ...getFetchOptions(),
      body: JSON.stringify({ enrollment: enrollmentPayload })
    });

    const result = await handleResponse<EnrollmentResponse>(response);
    console.log('✅ Student enrolled successfully:', result.enrollment.sourcedId);
    return result;

  } catch (error) {
    console.error('❌ Failed to enroll student:', error);
    throw new OneRosterError(`Failed to enroll student: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update or create a result (grade) for a student
 */
export async function updateResult(resultData: ResultData): Promise<ResultResponse> {
  console.log('📊 Updating OneRoster result:', {
    lineItemId: resultData.lineItemId,
    studentId: resultData.studentId,
    score: `${resultData.scoreGiven}/${resultData.scoreMaximum}`
  });

  // Validate required fields
  if (!resultData.lineItemId || !resultData.studentId || resultData.scoreGiven === undefined || 
      resultData.scoreMaximum === undefined || !resultData.timestamp) {
    throw new OneRosterError('Missing required fields: lineItemId, studentId, scoreGiven, scoreMaximum, and timestamp are required');
  }

  // Build the OneRoster result payload
  const resultPayload = {
    sourcedId: `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'active',
    dateLastModified: new Date().toISOString(),
    lineItem: {
      href: `${ONEROSTER_BASE_URL}/lineItems/${resultData.lineItemId}`,
      sourcedId: resultData.lineItemId,
      type: 'lineItem'
    },
    student: {
      href: `${ONEROSTER_BASE_URL}/users/${resultData.studentId}`,
      sourcedId: resultData.studentId,
      type: 'user'
    },
    scoreGiven: resultData.scoreGiven,
    scoreMaximum: resultData.scoreMaximum,
    comment: resultData.comment || '',
    timestamp: resultData.timestamp,
    metadata: resultData.metadata || {}
  };

  try {
    const response = await fetch(`${ONEROSTER_BASE_URL}/results`, {
      method: 'POST',
      ...getFetchOptions(),
      body: JSON.stringify({ result: resultPayload })
    });

    const result = await handleResponse<ResultResponse>(response);
    console.log('✅ OneRoster result updated successfully:', result.result.sourcedId);
    return result;

  } catch (error) {
    console.error('❌ Failed to update OneRoster result:', error);
    throw new OneRosterError(`Failed to update result: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Export types
export type {
  Organization,
  AcademicSession,
  Course,
  User,
  Class,
  Enrollment,
  OrganizationsResponse,
  AcademicSessionsResponse,
  CoursesResponse,
  UsersResponse,
  ClassesResponse,
  EnrollmentsResponse,
  // Write operation types
  ClassCreationData,
  LineItemCreationData,
  EnrollmentCreationData,
  ResultData,
  LineItem,
  Result,
  LineItemResponse,
  ResultResponse,
};
