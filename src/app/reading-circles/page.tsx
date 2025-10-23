'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TopNavWithTabs } from '@/components/TopNavWithTabs'
import { FeedbackButton } from '@/components/FeedbackButton'
import { ReadingCirclesService } from '@/lib/services/reading-circles-service'
import { ReadingGroup, GroupRole } from '@/lib/types/reading-circles-types'

export default function ReadingCirclesPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<ReadingGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Mock user ID - in real app this would come from auth
  const userId = 'user-123'

  useEffect(() => {
    loadUserGroups()
  }, [])

  const loadUserGroups = async () => {
    try {
      setLoading(true)
      const userGroups = await ReadingCirclesService.getUserGroups(userId)
      setGroups(userGroups)
    } catch (error) {
      console.error('Failed to load groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = () => {
    setShowCreateForm(true)
  }

  const handleJoinGroup = () => {
    // Navigate to join group page
    router.push('/reading-circles/join')
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

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavWithTabs />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reading Circles</h1>
          <p className="text-gray-600">
            Join reading groups, complete assignments together, and track your progress with friends and classmates.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={handleCreateGroup}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Create Reading Circle
          </button>
          <button
            onClick={handleJoinGroup}
            className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Join a Circle
          </button>
        </div>

        {/* Groups Grid */}
        {groups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                userId={userId}
                onGroupClick={(groupId) => router.push(`/reading-circles/group/${groupId}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reading Circles Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first reading circle or join an existing one to start reading together with others.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleCreateGroup}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Create Your First Circle
                </button>
                <button
                  onClick={handleJoinGroup}
                  className="bg-white text-blue-600 border border-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Join a Circle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateForm && (
          <CreateGroupModal
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false)
              loadUserGroups()
            }}
            userId={userId}
          />
        )}
      </div>

      <FeedbackButton />
    </div>
  )
}

// Group Card Component
interface GroupCardProps {
  group: ReadingGroup
  userId: string
  onGroupClick: (groupId: string) => void
}

function GroupCard({ group, userId, onGroupClick }: GroupCardProps) {
  const [userRole, setUserRole] = useState<GroupRole | null>(null)

  useEffect(() => {
    const loadUserRole = async () => {
      const permissions = await ReadingCirclesService.getUserPermissions(userId, group.id)
      // Determine role based on permissions (simplified)
      if (permissions.canDeleteGroup) setUserRole('owner')
      else if (permissions.canCreateAssignments) setUserRole('teacher')
      else setUserRole('student')
    }
    loadUserRole()
  }, [userId, group.id])

  const getRoleColor = (role: GroupRole | null) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800'
      case 'teacher': return 'bg-blue-100 text-blue-800'
      case 'student': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div
      onClick={() => onGroupClick(group.id)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{group.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{group.description}</p>
        </div>
        <div className="flex flex-col gap-2 ml-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(group.status)}`}>
            {group.status}
          </span>
          {userRole && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userRole)}`}>
              {userRole}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold text-gray-900">{group.memberCount}</div>
          <div className="text-xs text-gray-600">Members</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">{group.activeAssignments}</div>
          <div className="text-xs text-gray-600">Assignments</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">{group.totalXP.toLocaleString()}</div>
          <div className="text-xs text-gray-600">Total XP</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          Created {new Date(group.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

// Create Group Modal Component
interface CreateGroupModalProps {
  onClose: () => void
  onSuccess: () => void
  userId: string
}

function CreateGroupModal({ onClose, onSuccess, userId }: CreateGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    allowSelfJoin: false,
    requireApproval: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Group name is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await ReadingCirclesService.createGroup(userId, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        settings: {
          isPublic: formData.isPublic,
          allowSelfJoin: formData.allowSelfJoin,
          requireApproval: formData.requireApproval
        }
      })
      onSuccess()
    } catch (error) {
      console.error('Failed to create group:', error)
      setErrors({ submit: 'Failed to create group. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create Reading Circle</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Circle Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Ms. Smith's 4th Grade Class"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe the purpose and goals of this reading circle..."
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                Make this circle public (visible to all users)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="allowSelfJoin"
                checked={formData.allowSelfJoin}
                onChange={(e) => setFormData({ ...formData, allowSelfJoin: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="allowSelfJoin" className="ml-2 block text-sm text-gray-700">
                Allow users to join without invitation
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="requireApproval"
                checked={formData.requireApproval}
                onChange={(e) => setFormData({ ...formData, requireApproval: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requireApproval" className="ml-2 block text-sm text-gray-700">
                Require approval for new members
              </label>
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Circle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

