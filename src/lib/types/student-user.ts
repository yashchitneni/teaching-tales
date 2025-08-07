// Student-focused user interface for the simplified student-only architecture
export interface StudentUser {
  sourcedId: string;
  username: string;
  givenName: string;
  familyName: string;
  role: 'student';
  orgIds: string[];
  enabledUser: boolean;
  email?: string;
  grades?: string[];
  
  // Student-specific metadata only (no parent relationships)
  metadata?: {
    age?: number;
    readingLevel?: 'beginner' | 'intermediate' | 'advanced';
    interests?: string[];
    [key: string]: unknown;
  };
  
  // Response fields
  status?: 'active' | 'tobedeleted';
  dateLastModified?: string;
  middleName?: string;
  sms?: string;
  phone?: string;
  identifier?: string;
  orgs?: Array<{ href: string; sourcedId: string; type: string }>;
}

// Helper type for student creation
export interface CreateStudentRequest {
  username: string;
  givenName: string;
  familyName: string;
  orgIds: string[];
  email?: string;
  grades?: string[];
  metadata?: {
    age?: number;
    readingLevel?: 'beginner' | 'intermediate' | 'advanced';
    interests?: string[];
  };
}
