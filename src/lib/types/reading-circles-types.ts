/**
 * Reading Circles Types
 * 
 * Defines the schema for asynchronous reading groups, assignments,
 * progress tracking, and XP aggregation.
 */

export type GroupRole = 'owner' | 'teacher' | 'student'
export type GroupStatus = 'active' | 'archived' | 'draft'
export type AssignmentStatus = 'draft' | 'active' | 'completed' | 'overdue'
export type MembershipStatus = 'active' | 'invited' | 'removed' | 'left'

export interface ReadingGroup {
  id: string
  name: string
  description: string
  status: GroupStatus
  createdBy: string
  createdAt: string
  updatedAt: string
  settings: GroupSettings
  memberCount: number
  activeAssignments: number
  totalXP: number
}

export interface GroupSettings {
  isPublic: boolean
  allowSelfJoin: boolean
  requireApproval: boolean
  maxMembers?: number
  defaultDueDate?: number // days from assignment
  notifications: {
    assignmentCreated: boolean
    assignmentDue: boolean
    memberJoined: boolean
    progressMilestones: boolean
  }
  privacy: {
    showMemberProgress: boolean
    showLeaderboard: boolean
    allowProgressExport: boolean
  }
}

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  role: GroupRole
  status: MembershipStatus
  joinedAt: string
  invitedBy?: string
  invitedAt?: string
  lastActiveAt?: string
  // Cached user info for performance
  displayName: string
  email?: string
  gradeLevel?: string
}

export interface GroupInvite {
  id: string
  groupId: string
  invitedBy: string
  invitedEmail: string
  role: GroupRole
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  createdAt: string
  expiresAt: string
  acceptedAt?: string
  token: string
}

export interface ReadingAssignment {
  id: string
  groupId: string
  createdBy: string
  title: string
  description?: string
  status: AssignmentStatus
  createdAt: string
  updatedAt: string
  dueDate?: string
  // Content references
  storyId?: string // Library story
  chapterIds?: string[] // Specific chapters
  customContent?: {
    title: string
    content: string
    questions?: any[]
  }
  // Assignment settings
  settings: {
    allowLateSubmission: boolean
    showProgressToGroup: boolean
    requireCompletion: boolean
    pointsValue: number
  }
  // Statistics
  memberCount: number
  completedCount: number
  averageScore?: number
  totalXPAwarded: number
}

export interface AssignmentProgress {
  id: string
  assignmentId: string
  userId: string
  status: 'not_started' | 'in_progress' | 'completed' | 'late'
  startedAt?: string
  completedAt?: string
  // Progress tracking
  chaptersCompleted: string[]
  totalChapters: number
  readingTimeMinutes: number
  // Assessment results
  questionsAnswered: number
  questionsCorrect: number
  score?: number // percentage
  xpEarned: number
  // Submission
  submittedAt?: string
  isLateSubmission: boolean
}

export interface GroupProgressSummary {
  groupId: string
  totalMembers: number
  activeMembers: number
  totalAssignments: number
  completedAssignments: number
  averageCompletionRate: number
  totalXPEarned: number
  averageXPPerMember: number
  topPerformers: {
    userId: string
    displayName: string
    xpEarned: number
    completionRate: number
  }[]
  recentActivity: GroupActivity[]
}

export interface GroupActivity {
  id: string
  groupId: string
  userId: string
  type: 'assignment_created' | 'assignment_completed' | 'member_joined' | 'story_completed' | 'milestone_reached'
  timestamp: string
  metadata: {
    displayName: string
    assignmentTitle?: string
    storyTitle?: string
    xpEarned?: number
    milestone?: string
  }
}

export interface GroupLeaderboard {
  groupId: string
  period: 'week' | 'month' | 'all_time'
  rankings: {
    rank: number
    userId: string
    displayName: string
    xpEarned: number
    assignmentsCompleted: number
    averageScore: number
    streakDays: number
    badges: string[]
  }[]
  generatedAt: string
}

// Permission system
export interface GroupPermissions {
  canCreateAssignments: boolean
  canEditGroup: boolean
  canInviteMembers: boolean
  canRemoveMembers: boolean
  canViewAllProgress: boolean
  canExportData: boolean
  canArchiveGroup: boolean
  canDeleteGroup: boolean
}

export const ROLE_PERMISSIONS: Record<GroupRole, GroupPermissions> = {
  owner: {
    canCreateAssignments: true,
    canEditGroup: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canViewAllProgress: true,
    canExportData: true,
    canArchiveGroup: true,
    canDeleteGroup: true
  },
  teacher: {
    canCreateAssignments: true,
    canEditGroup: false,
    canInviteMembers: true,
    canRemoveMembers: false,
    canViewAllProgress: true,
    canExportData: true,
    canArchiveGroup: false,
    canDeleteGroup: false
  },
  student: {
    canCreateAssignments: false,
    canEditGroup: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canViewAllProgress: false,
    canExportData: false,
    canArchiveGroup: false,
    canDeleteGroup: false
  }
}

// API request/response types
export interface CreateGroupRequest {
  name: string
  description: string
  settings: Partial<GroupSettings>
}

export interface UpdateGroupRequest {
  name?: string
  description?: string
  settings?: Partial<GroupSettings>
  status?: GroupStatus
}

export interface InviteMemberRequest {
  email: string
  role: GroupRole
  message?: string
}

export interface CreateAssignmentRequest {
  title: string
  description?: string
  dueDate?: string
  storyId?: string
  chapterIds?: string[]
  settings: Partial<ReadingAssignment['settings']>
}

export interface UpdateAssignmentRequest {
  title?: string
  description?: string
  dueDate?: string
  status?: AssignmentStatus
  settings?: Partial<ReadingAssignment['settings']>
}

// Search and filtering
export interface GroupSearchFilters {
  status?: GroupStatus[]
  role?: GroupRole[]
  hasActiveAssignments?: boolean
  createdAfter?: string
  createdBefore?: string
}

export interface AssignmentSearchFilters {
  status?: AssignmentStatus[]
  dueAfter?: string
  dueBefore?: string
  storyId?: string
  createdBy?: string
}

// Notification types
export interface GroupNotification {
  id: string
  userId: string
  groupId: string
  type: 'assignment_created' | 'assignment_due' | 'member_joined' | 'invitation_received' | 'milestone_reached'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  metadata?: {
    assignmentId?: string
    inviteId?: string
    xpEarned?: number
    groupName?: string
  }
}

// Analytics and reporting
export interface GroupAnalytics {
  groupId: string
  period: {
    start: string
    end: string
  }
  metrics: {
    memberEngagement: {
      activeMembers: number
      averageSessionTime: number
      storiesCompleted: number
      assignmentsCompleted: number
    }
    performance: {
      averageScore: number
      completionRate: number
      xpPerMember: number
      improvementTrend: number // percentage change
    }
    content: {
      popularStories: { storyId: string; title: string; completions: number }[]
      challengingAssignments: { assignmentId: string; title: string; averageScore: number }[]
      readingLevelDistribution: { level: string; count: number }[]
    }
  }
}

export interface GroupExportData {
  group: ReadingGroup
  members: (GroupMember & { 
    totalXP: number
    assignmentsCompleted: number
    averageScore: number
  })[]
  assignments: (ReadingAssignment & {
    progress: AssignmentProgress[]
  })[]
  summary: GroupProgressSummary
  exportedAt: string
  exportedBy: string
}

