'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'
import { ReadingCirclesService } from '@/lib/services/reading-circles-service'
import { LibraryService } from '@/lib/services/library-service'
import { 
  ReadingGroup, 
  GroupMember, 
  ReadingAssignment, 
  GroupProgressSummary,
  GroupPermissions 
} from '@/lib/types/reading-circles-types'
import { LibraryStoryMetadata } from '@/lib/types/library-types'

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<ReadingGroup | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [assignments, setAssignments] = useState<ReadingAssignment[]>([])
  const [progressSummary, setProgressSummary] = useState<GroupProgressSummary | null>(null)
  const [permissions, setPermissions] = useState<GroupPermissions | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'members' | 'progress'>('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Mock user ID - in real app this would come from auth
  const userId = 'user-123'

  useEffect(() => {
    loadGroupData()
  }, [groupId])

  const loadGroupData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [groupData, membersData, assignmentsData, progressData, userPermissions] = await Promise.all([
        ReadingCirclesService.getGroupById(groupId),
        ReadingCirclesService.getGroupMembers(groupId),
        ReadingCirclesService.getGroupAssignments(groupId),
        ReadingCirclesService.getGroupProgressSummary(groupId),
        ReadingCirclesService.getUserPermissions(userId, groupId)
      ])

      if (!groupData) {
        setError('Group not found')
        return
      }

      setGroup(groupData)
      setMembers(membersData)
      setAssignments(assignmentsData)
      setProgressSummary(progressData)
      setPermissions(userPermissions)

    } catch (err) {
      console.error('Failed to load group data:', err)
      setError('Failed to load group data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAssignment = () => {
    router.push(`/reading-circles/group/${groupId}/create-assignment`)
  }

  const handleInviteMember = () => {
    router.push(`/reading-circles/group/${groupId}/invite`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavWithTabs />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavWithTabs />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Group Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The requested group could not be found.'}</p>
            <button
              onClick={() => router.push('/reading-circles')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Reading Circles
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavWithTabs />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/reading-circles')}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Reading Circles
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{group.name}</h1>
              <p className="text-gray-600 mb-4">{group.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{group.memberCount} members</span>
                <span>{group.activeAssignments} active assignments</span>
                <span>{group.totalXP.toLocaleString()} total XP</span>
                <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              {permissions?.canCreateAssignments && (
                <button
                  onClick={handleCreateAssignment}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  New Assignment
                </button>
              )}
              {permissions?.canInviteMembers && (
                <button
                  onClick={handleInviteMember}
                  className="bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Invite Members
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'assignments', label: 'Assignments' },
              { id: 'members', label: 'Members' },
              { id: 'progress', label: 'Progress' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab 
            group={group} 
            progressSummary={progressSummary} 
            assignments={assignments.slice(0, 3)} 
            members={members.slice(0, 6)}
            onViewAllAssignments={() => setActiveTab('assignments')}
            onViewAllMembers={() => setActiveTab('members')}
          />
        )}

        {activeTab === 'assignments' && (
          <AssignmentsTab 
            assignments={assignments} 
            permissions={permissions}
            onCreateAssignment={handleCreateAssignment}
            onAssignmentClick={(assignmentId) => router.push(`/reading-circles/assignment/${assignmentId}`)}
          />
        )}

        {activeTab === 'members' && (
          <MembersTab 
            members={members} 
            permissions={permissions}
            onInviteMember={handleInviteMember}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressTab 
            progressSummary={progressSummary} 
            permissions={permissions}
          />
        )}
      </div>

      <FeedbackButton />
    </div>
  )
}

// Overview Tab Component
interface OverviewTabProps {
  group: ReadingGroup
  progressSummary: GroupProgressSummary | null
  assignments: ReadingAssignment[]
  members: GroupMember[]
  onViewAllAssignments: () => void
  onViewAllMembers: () => void
}

function OverviewTab({ 
  group, 
  progressSummary, 
  assignments, 
  members, 
  onViewAllAssignments, 
  onViewAllMembers 
}: OverviewTabProps) {
  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      {progressSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{progressSummary.totalMembers}</div>
            <div className="text-sm text-gray-600">Total Members</div>
            <div className="text-xs text-green-600 mt-1">
              {progressSummary.activeMembers} active this week
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{progressSummary.totalAssignments}</div>
            <div className="text-sm text-gray-600">Assignments</div>
            <div className="text-xs text-blue-600 mt-1">
              {progressSummary.completedAssignments} completed
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(progressSummary.averageCompletionRate * 100)}%
            </div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">
              {progressSummary.totalXPEarned.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total XP Earned</div>
            <div className="text-xs text-purple-600 mt-1">
              {Math.round(progressSummary.averageXPPerMember)} avg per member
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Assignments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Assignments</h3>
              {assignments.length > 3 && (
                <button
                  onClick={onViewAllAssignments}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{assignment.title}</div>
                      <div className="text-sm text-gray-600">
                        {assignment.completedCount}/{assignment.memberCount} completed
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        assignment.status === 'active' ? 'bg-green-100 text-green-800' :
                        assignment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.status}
                      </div>
                      {assignment.dueDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Due {new Date(assignment.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No assignments yet
              </div>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
              {members.length > 6 && (
                <button
                  onClick={onViewAllMembers}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </button>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {progressSummary?.topPerformers && progressSummary.topPerformers.length > 0 ? (
              <div className="space-y-4">
                {progressSummary.topPerformers.map((performer, index) => (
                  <div key={performer.userId} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3 ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{performer.displayName}</div>
                        <div className="text-sm text-gray-600">
                          {Math.round(performer.completionRate * 100)}% completion
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{performer.xpEarned} XP</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No activity yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {progressSummary?.recentActivity && progressSummary.recentActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {progressSummary.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">{activity.metadata.displayName}</span>
                      {activity.type === 'assignment_completed' && activity.metadata.assignmentTitle && (
                        <span> completed "{activity.metadata.assignmentTitle}"</span>
                      )}
                      {activity.type === 'member_joined' && <span> joined the group</span>}
                      {activity.type === 'story_completed' && activity.metadata.storyTitle && (
                        <span> finished reading "{activity.metadata.storyTitle}"</span>
                      )}
                      {activity.metadata.xpEarned && (
                        <span className="text-purple-600"> (+{activity.metadata.xpEarned} XP)</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Assignments Tab Component
interface AssignmentsTabProps {
  assignments: ReadingAssignment[]
  permissions: GroupPermissions | null
  onCreateAssignment: () => void
  onAssignmentClick: (assignmentId: string) => void
}

function AssignmentsTab({ assignments, permissions, onCreateAssignment, onAssignmentClick }: AssignmentsTabProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Assignments</h2>
        {permissions?.canCreateAssignments && (
          <button
            onClick={onCreateAssignment}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Create Assignment
          </button>
        )}
      </div>

      {assignments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              onClick={() => onAssignmentClick(assignment.id)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{assignment.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${
                  assignment.status === 'active' ? 'bg-green-100 text-green-800' :
                  assignment.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  assignment.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {assignment.status}
                </span>
              </div>

              {assignment.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{assignment.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">
                    {assignment.completedCount}/{assignment.memberCount}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${assignment.memberCount > 0 ? (assignment.completedCount / assignment.memberCount) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {assignment.settings.pointsValue} XP
                </span>
                {assignment.dueDate && (
                  <span>
                    Due {new Date(assignment.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first assignment to get started with group reading activities.
          </p>
          {permissions?.canCreateAssignments && (
            <button
              onClick={onCreateAssignment}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create First Assignment
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Members Tab Component
interface MembersTabProps {
  members: GroupMember[]
  permissions: GroupPermissions | null
  onInviteMember: () => void
}

function MembersTab({ members, permissions, onInviteMember }: MembersTabProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800'
      case 'teacher': return 'bg-blue-100 text-blue-800'
      case 'student': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Members ({members.length})</h2>
        {permissions?.canInviteMembers && (
          <button
            onClick={onInviteMember}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Invite Members
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700">
            <div>Member</div>
            <div>Role</div>
            <div>Joined</div>
            <div>Last Active</div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {members.map((member) => (
            <div key={member.id} className="px-6 py-4">
              <div className="grid grid-cols-4 gap-4 items-center">
                <div>
                  <div className="font-medium text-gray-900">{member.displayName}</div>
                  {member.email && (
                    <div className="text-sm text-gray-600">{member.email}</div>
                  )}
                </div>
                
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                    {member.role}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </div>
                
                <div className="text-sm text-gray-600">
                  {member.lastActiveAt 
                    ? new Date(member.lastActiveAt).toLocaleDateString()
                    : 'Never'
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Progress Tab Component
interface ProgressTabProps {
  progressSummary: GroupProgressSummary | null
  permissions: GroupPermissions | null
}

function ProgressTab({ progressSummary, permissions }: ProgressTabProps) {
  if (!progressSummary) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading progress data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="text-3xl font-bold text-blue-600">
            {Math.round(progressSummary.averageCompletionRate * 100)}%
          </div>
          <div className="text-sm text-gray-600 mt-1">Average Completion Rate</div>
          <div className="text-xs text-gray-500 mt-2">
            {progressSummary.completedAssignments} of {progressSummary.totalAssignments} assignments completed
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="text-3xl font-bold text-purple-600">
            {progressSummary.totalXPEarned.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 mt-1">Total XP Earned</div>
          <div className="text-xs text-gray-500 mt-2">
            {Math.round(progressSummary.averageXPPerMember)} average per member
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="text-3xl font-bold text-green-600">
            {progressSummary.activeMembers}
          </div>
          <div className="text-sm text-gray-600 mt-1">Active Members</div>
          <div className="text-xs text-gray-500 mt-2">
            of {progressSummary.totalMembers} total members
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Leaderboard</h3>
            {permissions?.canExportData && (
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Export Data
              </button>
            )}
          </div>
        </div>
        
        <div className="p-6">
          {progressSummary.topPerformers.length > 0 ? (
            <div className="space-y-4">
              {progressSummary.topPerformers.map((performer, index) => (
                <div key={performer.userId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-800' :
                      index === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{performer.displayName}</div>
                      <div className="text-sm text-gray-600">
                        {Math.round(performer.completionRate * 100)}% completion rate
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600">{performer.xpEarned} XP</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No progress data available yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

