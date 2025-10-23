/**
 * Reading Circles Service
 * 
 * Manages reading groups, assignments, progress tracking, and XP aggregation.
 * Provides asynchronous group functionality without real-time features.
 */

import {
  ReadingGroup,
  GroupMember,
  GroupInvite,
  ReadingAssignment,
  AssignmentProgress,
  GroupProgressSummary,
  GroupActivity,
  GroupLeaderboard,
  GroupPermissions,
  ROLE_PERMISSIONS,
  CreateGroupRequest,
  UpdateGroupRequest,
  InviteMemberRequest,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  GroupSearchFilters,
  AssignmentSearchFilters,
  GroupNotification,
  GroupAnalytics,
  GroupExportData,
  GroupRole,
  GroupStatus,
  AssignmentStatus,
  MembershipStatus
} from '@/lib/types/reading-circles-types'
import { TelemetryService } from './telemetry-service'
import { LibraryService } from './library-service'

export class ReadingCirclesService {
  private static readonly STORAGE_PREFIX = 'reading_circles_'
  private static readonly GROUPS_KEY = 'groups'
  private static readonly MEMBERS_KEY = 'members'
  private static readonly INVITES_KEY = 'invites'
  private static readonly ASSIGNMENTS_KEY = 'assignments'
  private static readonly PROGRESS_KEY = 'progress'
  private static readonly NOTIFICATIONS_KEY = 'notifications'

  // Group Management
  static async createGroup(userId: string, request: CreateGroupRequest): Promise<ReadingGroup> {
    const groupId = this.generateId('group')
    const now = new Date().toISOString()

    const group: ReadingGroup = {
      id: groupId,
      name: request.name,
      description: request.description,
      status: 'active',
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      settings: {
        isPublic: false,
        allowSelfJoin: false,
        requireApproval: true,
        notifications: {
          assignmentCreated: true,
          assignmentDue: true,
          memberJoined: true,
          progressMilestones: true
        },
        privacy: {
          showMemberProgress: true,
          showLeaderboard: true,
          allowProgressExport: true
        },
        ...request.settings
      },
      memberCount: 1,
      activeAssignments: 0,
      totalXP: 0
    }

    // Create owner membership
    const ownerMember: GroupMember = {
      id: this.generateId('member'),
      groupId,
      userId,
      role: 'owner',
      status: 'active',
      joinedAt: now,
      displayName: await this.getUserDisplayName(userId)
    }

    // Store group and membership
    await this.storeGroup(group)
    await this.storeMember(ownerMember)

    // Track group creation
    TelemetryService.trackUserEvent({
      category: 'reading_circles',
      action: 'group_created',
      userId,
      properties: {
        groupId,
        groupName: group.name,
        isPublic: group.settings.isPublic
      }
    })

    // Create activity
    await this.createActivity({
      groupId,
      userId,
      type: 'member_joined',
      metadata: {
        displayName: ownerMember.displayName
      }
    })

    return group
  }

  static async updateGroup(userId: string, groupId: string, request: UpdateGroupRequest): Promise<ReadingGroup> {
    const group = await this.getGroupById(groupId)
    if (!group) throw new Error('Group not found')

    const permissions = await this.getUserPermissions(userId, groupId)
    if (!permissions.canEditGroup) throw new Error('Insufficient permissions')

    const updatedGroup: ReadingGroup = {
      ...group,
      ...request,
      updatedAt: new Date().toISOString()
    }

    if (request.settings) {
      updatedGroup.settings = { ...group.settings, ...request.settings }
    }

    await this.storeGroup(updatedGroup)

    TelemetryService.trackUserEvent({
      category: 'reading_circles',
      action: 'group_updated',
      userId,
      properties: {
        groupId,
        changes: Object.keys(request)
      }
    })

    return updatedGroup
  }

  static async getGroupById(groupId: string): Promise<ReadingGroup | null> {
    try {
      const groups = this.getStoredData<ReadingGroup[]>(this.GROUPS_KEY, [])
      return groups.find(g => g.id === groupId) || null
    } catch (error) {
      console.error('Failed to get group:', error)
      return null
    }
  }

  static async getUserGroups(userId: string, filters?: GroupSearchFilters): Promise<ReadingGroup[]> {
    try {
      const members = this.getStoredData<GroupMember[]>(this.MEMBERS_KEY, [])
      const userMemberships = members.filter(m => m.userId === userId && m.status === 'active')
      
      const groups = this.getStoredData<ReadingGroup[]>(this.GROUPS_KEY, [])
      let userGroups = groups.filter(g => 
        userMemberships.some(m => m.groupId === g.id)
      )

      // Apply filters
      if (filters) {
        if (filters.status) {
          userGroups = userGroups.filter(g => filters.status!.includes(g.status))
        }
        if (filters.role) {
          userGroups = userGroups.filter(g => {
            const membership = userMemberships.find(m => m.groupId === g.id)
            return membership && filters.role!.includes(membership.role)
          })
        }
        if (filters.hasActiveAssignments !== undefined) {
          userGroups = userGroups.filter(g => 
            filters.hasActiveAssignments ? g.activeAssignments > 0 : g.activeAssignments === 0
          )
        }
      }

      return userGroups.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    } catch (error) {
      console.error('Failed to get user groups:', error)
      return []
    }
  }

  // Member Management
  static async inviteMember(userId: string, groupId: string, request: InviteMemberRequest): Promise<GroupInvite> {
    const permissions = await this.getUserPermissions(userId, groupId)
    if (!permissions.canInviteMembers) throw new Error('Insufficient permissions')

    const group = await this.getGroupById(groupId)
    if (!group) throw new Error('Group not found')

    // Check if already a member or invited
    const existingMember = await this.getGroupMember(groupId, request.email)
    if (existingMember) throw new Error('User is already a member')

    const existingInvite = await this.getPendingInvite(groupId, request.email)
    if (existingInvite) throw new Error('User already has a pending invitation')

    const inviteId = this.generateId('invite')
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

    const invite: GroupInvite = {
      id: inviteId,
      groupId,
      invitedBy: userId,
      invitedEmail: request.email,
      role: request.role,
      status: 'pending',
      createdAt: now,
      expiresAt,
      token: this.generateInviteToken()
    }

    await this.storeInvite(invite)

    // Create notification for invited user
    await this.createNotification({
      userId: request.email, // Using email as userId for now
      groupId,
      type: 'invitation_received',
      title: 'Reading Circle Invitation',
      message: `You've been invited to join "${group.name}"`,
      metadata: {
        inviteId,
        groupName: group.name
      }
    })

    TelemetryService.trackUserEvent({
      category: 'reading_circles',
      action: 'member_invited',
      userId,
      properties: {
        groupId,
        invitedRole: request.role,
        groupName: group.name
      }
    })

    return invite
  }

  static async acceptInvite(userId: string, inviteToken: string): Promise<GroupMember> {
    const invite = await this.getInviteByToken(inviteToken)
    if (!invite) throw new Error('Invalid invitation')
    if (invite.status !== 'pending') throw new Error('Invitation is no longer valid')
    if (new Date(invite.expiresAt) < new Date()) throw new Error('Invitation has expired')

    const group = await this.getGroupById(invite.groupId)
    if (!group) throw new Error('Group not found')

    const now = new Date().toISOString()

    // Create membership
    const member: GroupMember = {
      id: this.generateId('member'),
      groupId: invite.groupId,
      userId,
      role: invite.role,
      status: 'active',
      joinedAt: now,
      invitedBy: invite.invitedBy,
      invitedAt: invite.createdAt,
      displayName: await this.getUserDisplayName(userId)
    }

    // Update invite status
    const updatedInvite = { ...invite, status: 'accepted' as const, acceptedAt: now }

    // Update group member count
    const updatedGroup = { ...group, memberCount: group.memberCount + 1, updatedAt: now }

    await this.storeMember(member)
    await this.storeInvite(updatedInvite)
    await this.storeGroup(updatedGroup)

    // Create activity
    await this.createActivity({
      groupId: invite.groupId,
      userId,
      type: 'member_joined',
      metadata: {
        displayName: member.displayName
      }
    })

    // Notify group members
    if (group.settings.notifications.memberJoined) {
      const members = await this.getGroupMembers(invite.groupId)
      for (const groupMember of members) {
        if (groupMember.userId !== userId) {
          await this.createNotification({
            userId: groupMember.userId,
            groupId: invite.groupId,
            type: 'member_joined',
            title: 'New Member Joined',
            message: `${member.displayName} joined "${group.name}"`,
            metadata: {
              groupName: group.name
            }
          })
        }
      }
    }

    TelemetryService.trackUserEvent({
      category: 'reading_circles',
      action: 'invite_accepted',
      userId,
      properties: {
        groupId: invite.groupId,
        role: invite.role,
        groupName: group.name
      }
    })

    return member
  }

  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const members = this.getStoredData<GroupMember[]>(this.MEMBERS_KEY, [])
      return members.filter(m => m.groupId === groupId && m.status === 'active')
        .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime())
    } catch (error) {
      console.error('Failed to get group members:', error)
      return []
    }
  }

  // Assignment Management
  static async createAssignment(userId: string, groupId: string, request: CreateAssignmentRequest): Promise<ReadingAssignment> {
    const permissions = await this.getUserPermissions(userId, groupId)
    if (!permissions.canCreateAssignments) throw new Error('Insufficient permissions')

    const group = await this.getGroupById(groupId)
    if (!group) throw new Error('Group not found')

    const assignmentId = this.generateId('assignment')
    const now = new Date().toISOString()

    const assignment: ReadingAssignment = {
      id: assignmentId,
      groupId,
      createdBy: userId,
      title: request.title,
      description: request.description,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      dueDate: request.dueDate,
      storyId: request.storyId,
      chapterIds: request.chapterIds,
      settings: {
        allowLateSubmission: true,
        showProgressToGroup: true,
        requireCompletion: false,
        pointsValue: 100,
        ...request.settings
      },
      memberCount: group.memberCount,
      completedCount: 0,
      totalXPAwarded: 0
    }

    await this.storeAssignment(assignment)

    // Update group active assignments count
    const updatedGroup = { 
      ...group, 
      activeAssignments: group.activeAssignments + 1,
      updatedAt: now 
    }
    await this.storeGroup(updatedGroup)

    // Create progress records for all members
    const members = await this.getGroupMembers(groupId)
    for (const member of members) {
      const progress: AssignmentProgress = {
        id: this.generateId('progress'),
        assignmentId,
        userId: member.userId,
        status: 'not_started',
        chaptersCompleted: [],
        totalChapters: request.chapterIds?.length || 1,
        readingTimeMinutes: 0,
        questionsAnswered: 0,
        questionsCorrect: 0,
        xpEarned: 0,
        isLateSubmission: false
      }
      await this.storeProgress(progress)
    }

    // Notify group members
    if (group.settings.notifications.assignmentCreated) {
      for (const member of members) {
        if (member.userId !== userId) {
          await this.createNotification({
            userId: member.userId,
            groupId,
            type: 'assignment_created',
            title: 'New Assignment',
            message: `New assignment "${assignment.title}" in "${group.name}"`,
            metadata: {
              assignmentId,
              groupName: group.name
            }
          })
        }
      }
    }

    TelemetryService.trackUserEvent({
      category: 'reading_circles',
      action: 'assignment_created',
      userId,
      properties: {
        groupId,
        assignmentId,
        assignmentTitle: assignment.title,
        storyId: assignment.storyId,
        hasDueDate: !!assignment.dueDate
      }
    })

    return assignment
  }

  static async getGroupAssignments(groupId: string, filters?: AssignmentSearchFilters): Promise<ReadingAssignment[]> {
    try {
      const assignments = this.getStoredData<ReadingAssignment[]>(this.ASSIGNMENTS_KEY, [])
      let groupAssignments = assignments.filter(a => a.groupId === groupId)

      // Apply filters
      if (filters) {
        if (filters.status) {
          groupAssignments = groupAssignments.filter(a => filters.status!.includes(a.status))
        }
        if (filters.storyId) {
          groupAssignments = groupAssignments.filter(a => a.storyId === filters.storyId)
        }
        if (filters.createdBy) {
          groupAssignments = groupAssignments.filter(a => a.createdBy === filters.createdBy)
        }
        if (filters.dueAfter) {
          groupAssignments = groupAssignments.filter(a => 
            a.dueDate && new Date(a.dueDate) > new Date(filters.dueAfter!)
          )
        }
        if (filters.dueBefore) {
          groupAssignments = groupAssignments.filter(a => 
            a.dueDate && new Date(a.dueDate) < new Date(filters.dueBefore!)
          )
        }
      }

      return groupAssignments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (error) {
      console.error('Failed to get group assignments:', error)
      return []
    }
  }

  static async updateAssignmentProgress(
    userId: string, 
    assignmentId: string, 
    progressUpdate: Partial<AssignmentProgress>
  ): Promise<AssignmentProgress> {
    const progress = await this.getAssignmentProgress(assignmentId, userId)
    if (!progress) throw new Error('Assignment progress not found')

    const updatedProgress: AssignmentProgress = {
      ...progress,
      ...progressUpdate,
      userId // Ensure userId doesn't change
    }

    // Calculate completion status
    if (progressUpdate.chaptersCompleted) {
      const completionRate = updatedProgress.chaptersCompleted.length / updatedProgress.totalChapters
      if (completionRate >= 1.0 && updatedProgress.status !== 'completed') {
        updatedProgress.status = 'completed'
        updatedProgress.completedAt = new Date().toISOString()
        
        // Award XP
        const assignment = await this.getAssignmentById(assignmentId)
        if (assignment) {
          const baseXP = assignment.settings.pointsValue
          const scoreMultiplier = updatedProgress.score ? updatedProgress.score / 100 : 1
          const xpEarned = Math.round(baseXP * scoreMultiplier)
          updatedProgress.xpEarned = xpEarned

          // Update assignment totals
          const updatedAssignment = {
            ...assignment,
            completedCount: assignment.completedCount + 1,
            totalXPAwarded: assignment.totalXPAwarded + xpEarned
          }
          await this.storeAssignment(updatedAssignment)
        }
      }
    }

    await this.storeProgress(updatedProgress)

    TelemetryService.trackUserEvent({
      category: 'reading_circles',
      action: 'assignment_progress_updated',
      userId,
      properties: {
        assignmentId,
        status: updatedProgress.status,
        completionRate: updatedProgress.chaptersCompleted.length / updatedProgress.totalChapters,
        xpEarned: updatedProgress.xpEarned
      }
    })

    return updatedProgress
  }

  // Progress and Analytics
  static async getGroupProgressSummary(groupId: string): Promise<GroupProgressSummary> {
    const group = await this.getGroupById(groupId)
    if (!group) throw new Error('Group not found')

    const members = await this.getGroupMembers(groupId)
    const assignments = await this.getGroupAssignments(groupId)
    const activities = await this.getGroupActivities(groupId, 10)

    // Calculate metrics
    const totalAssignments = assignments.length
    const completedAssignments = assignments.filter(a => a.status === 'completed').length
    const totalXP = assignments.reduce((sum, a) => sum + a.totalXPAwarded, 0)

    // Get top performers
    const memberProgress = await Promise.all(
      members.map(async (member) => {
        const memberAssignments = await this.getUserAssignmentProgress(member.userId, groupId)
        const memberXP = memberAssignments.reduce((sum, p) => sum + p.xpEarned, 0)
        const completionRate = memberAssignments.length > 0 
          ? memberAssignments.filter(p => p.status === 'completed').length / memberAssignments.length 
          : 0

        return {
          userId: member.userId,
          displayName: member.displayName,
          xpEarned: memberXP,
          completionRate
        }
      })
    )

    const topPerformers = memberProgress
      .sort((a, b) => b.xpEarned - a.xpEarned)
      .slice(0, 5)

    return {
      groupId,
      totalMembers: members.length,
      activeMembers: members.filter(m => m.lastActiveAt && 
        new Date(m.lastActiveAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
      totalAssignments,
      completedAssignments,
      averageCompletionRate: members.length > 0 
        ? memberProgress.reduce((sum, m) => sum + m.completionRate, 0) / members.length 
        : 0,
      totalXPEarned: totalXP,
      averageXPPerMember: members.length > 0 ? totalXP / members.length : 0,
      topPerformers,
      recentActivity: activities
    }
  }

  // Utility methods
  static async getUserPermissions(userId: string, groupId: string): Promise<GroupPermissions> {
    const member = await this.getGroupMemberByUserId(groupId, userId)
    if (!member || member.status !== 'active') {
      return ROLE_PERMISSIONS.student // Default to most restrictive
    }
    return ROLE_PERMISSIONS[member.role]
  }

  private static async getUserDisplayName(userId: string): Promise<string> {
    // In a real app, this would fetch from user service
    return `User ${userId.substring(0, 8)}`
  }

  private static generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private static generateInviteToken(): string {
    return Math.random().toString(36).substr(2, 32)
  }

  // Storage helpers
  private static getStoredData<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(`${this.STORAGE_PREFIX}${key}`)
      return data ? JSON.parse(data) : defaultValue
    } catch (error) {
      console.error(`Failed to get stored data for ${key}:`, error)
      return defaultValue
    }
  }

  private static setStoredData<T>(key: string, data: T): void {
    try {
      localStorage.setItem(`${this.STORAGE_PREFIX}${key}`, JSON.stringify(data))
    } catch (error) {
      console.error(`Failed to store data for ${key}:`, error)
    }
  }

  private static async storeGroup(group: ReadingGroup): Promise<void> {
    const groups = this.getStoredData<ReadingGroup[]>(this.GROUPS_KEY, [])
    const index = groups.findIndex(g => g.id === group.id)
    if (index >= 0) {
      groups[index] = group
    } else {
      groups.push(group)
    }
    this.setStoredData(this.GROUPS_KEY, groups)
  }

  private static async storeMember(member: GroupMember): Promise<void> {
    const members = this.getStoredData<GroupMember[]>(this.MEMBERS_KEY, [])
    const index = members.findIndex(m => m.id === member.id)
    if (index >= 0) {
      members[index] = member
    } else {
      members.push(member)
    }
    this.setStoredData(this.MEMBERS_KEY, members)
  }

  private static async storeInvite(invite: GroupInvite): Promise<void> {
    const invites = this.getStoredData<GroupInvite[]>(this.INVITES_KEY, [])
    const index = invites.findIndex(i => i.id === invite.id)
    if (index >= 0) {
      invites[index] = invite
    } else {
      invites.push(invite)
    }
    this.setStoredData(this.INVITES_KEY, invites)
  }

  private static async storeAssignment(assignment: ReadingAssignment): Promise<void> {
    const assignments = this.getStoredData<ReadingAssignment[]>(this.ASSIGNMENTS_KEY, [])
    const index = assignments.findIndex(a => a.id === assignment.id)
    if (index >= 0) {
      assignments[index] = assignment
    } else {
      assignments.push(assignment)
    }
    this.setStoredData(this.ASSIGNMENTS_KEY, assignments)
  }

  private static async storeProgress(progress: AssignmentProgress): Promise<void> {
    const progressData = this.getStoredData<AssignmentProgress[]>(this.PROGRESS_KEY, [])
    const index = progressData.findIndex(p => p.id === progress.id)
    if (index >= 0) {
      progressData[index] = progress
    } else {
      progressData.push(progress)
    }
    this.setStoredData(this.PROGRESS_KEY, progressData)
  }

  private static async createActivity(activity: Omit<GroupActivity, 'id' | 'timestamp'>): Promise<void> {
    const activities = this.getStoredData<GroupActivity[]>('activities', [])
    const newActivity: GroupActivity = {
      ...activity,
      id: this.generateId('activity'),
      timestamp: new Date().toISOString()
    }
    activities.unshift(newActivity) // Add to beginning
    
    // Keep only last 100 activities per group
    const groupActivities = activities.filter(a => a.groupId === activity.groupId)
    if (groupActivities.length > 100) {
      const toRemove = groupActivities.slice(100)
      toRemove.forEach(activityToRemove => {
        const index = activities.findIndex(a => a.id === activityToRemove.id)
        if (index >= 0) activities.splice(index, 1)
      })
    }
    
    this.setStoredData('activities', activities)
  }

  private static async createNotification(notification: Omit<GroupNotification, 'id' | 'isRead' | 'createdAt'>): Promise<void> {
    const notifications = this.getStoredData<GroupNotification[]>(this.NOTIFICATIONS_KEY, [])
    const newNotification: GroupNotification = {
      ...notification,
      id: this.generateId('notification'),
      isRead: false,
      createdAt: new Date().toISOString()
    }
    notifications.unshift(newNotification)
    
    // Keep only last 50 notifications per user
    const userNotifications = notifications.filter(n => n.userId === notification.userId)
    if (userNotifications.length > 50) {
      const toRemove = userNotifications.slice(50)
      toRemove.forEach(notificationToRemove => {
        const index = notifications.findIndex(n => n.id === notificationToRemove.id)
        if (index >= 0) notifications.splice(index, 1)
      })
    }
    
    this.setStoredData(this.NOTIFICATIONS_KEY, notifications)
  }

  // Helper getters
  private static async getGroupMember(groupId: string, email: string): Promise<GroupMember | null> {
    const members = this.getStoredData<GroupMember[]>(this.MEMBERS_KEY, [])
    return members.find(m => m.groupId === groupId && m.email === email) || null
  }

  private static async getGroupMemberByUserId(groupId: string, userId: string): Promise<GroupMember | null> {
    const members = this.getStoredData<GroupMember[]>(this.MEMBERS_KEY, [])
    return members.find(m => m.groupId === groupId && m.userId === userId && m.status === 'active') || null
  }

  private static async getPendingInvite(groupId: string, email: string): Promise<GroupInvite | null> {
    const invites = this.getStoredData<GroupInvite[]>(this.INVITES_KEY, [])
    return invites.find(i => i.groupId === groupId && i.invitedEmail === email && i.status === 'pending') || null
  }

  private static async getInviteByToken(token: string): Promise<GroupInvite | null> {
    const invites = this.getStoredData<GroupInvite[]>(this.INVITES_KEY, [])
    return invites.find(i => i.token === token) || null
  }

  private static async getAssignmentById(assignmentId: string): Promise<ReadingAssignment | null> {
    const assignments = this.getStoredData<ReadingAssignment[]>(this.ASSIGNMENTS_KEY, [])
    return assignments.find(a => a.id === assignmentId) || null
  }

  private static async getAssignmentProgress(assignmentId: string, userId: string): Promise<AssignmentProgress | null> {
    const progressData = this.getStoredData<AssignmentProgress[]>(this.PROGRESS_KEY, [])
    return progressData.find(p => p.assignmentId === assignmentId && p.userId === userId) || null
  }

  private static async getUserAssignmentProgress(userId: string, groupId: string): Promise<AssignmentProgress[]> {
    const progressData = this.getStoredData<AssignmentProgress[]>(this.PROGRESS_KEY, [])
    const assignments = await this.getGroupAssignments(groupId)
    const assignmentIds = assignments.map(a => a.id)
    
    return progressData.filter(p => p.userId === userId && assignmentIds.includes(p.assignmentId))
  }

  private static async getGroupActivities(groupId: string, limit: number = 10): Promise<GroupActivity[]> {
    const activities = this.getStoredData<GroupActivity[]>('activities', [])
    return activities
      .filter(a => a.groupId === groupId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }
}

