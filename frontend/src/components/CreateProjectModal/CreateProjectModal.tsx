import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { CreateProjectRequest } from '../../types/domain.types'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (projectData: CreateProjectRequest) => void
  users: Array<{ id: number; name: string; email: string }>
}

export const CreateProjectModal = ({
  isOpen,
  onClose,
  onSubmit,
  users
}: CreateProjectModalProps) => {
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    key: '',
    description: '',
    leadId: users[0]?.id || 1 // Default to first user or user 1
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    }

    if (!formData.key.trim()) {
      newErrors.key = 'Project key is required'
    } else if (!/^[A-Z0-9]+$/.test(formData.key)) {
      newErrors.key = 'Project key must contain only uppercase letters and numbers'
    } else if (formData.key.length < 2 || formData.key.length > 10) {
      newErrors.key = 'Project key must be 2-10 characters long'
    }

    if (!formData.leadId) {
      newErrors.leadId = 'Project lead is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateKeyFromName = (name: string): string => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '') // Remove special characters
      .split(' ')
      .map(word => word.slice(0, 3)) // Take first 3 letters of each word
      .join('')
      .slice(0, 10) // Limit to 10 characters
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      // Auto-generate key if it hasn't been manually edited
      key: prev.key === generateKeyFromName(prev.name) || !prev.key
        ? generateKeyFromName(name)
        : prev.key
    }))

    // Clear name error when user starts typing
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: '' }))
    }
  }

  const handleKeyChange = (key: string) => {
    const upperKey = key.toUpperCase()
    setFormData(prev => ({ ...prev, key: upperKey }))

    // Clear key error when user starts typing
    if (errors.key) {
      setErrors(prev => ({ ...prev, key: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({
        name: '',
        key: '',
        description: '',
        leadId: users[0]?.id || 1
      })
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Failed to create project:', error)
      // Handle API errors here if needed
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      key: '',
      description: '',
      leadId: users[0]?.id || 1
    })
    setErrors({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Project" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter project name..."
            required
            data-testid="project-name-input"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600" data-testid="project-name-error">
              {errors.name}
            </p>
          )}
        </div>

        {/* Project Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Key *
          </label>
          <input
            type="text"
            value={formData.key}
            onChange={(e) => handleKeyChange(e.target.value)}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.key ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., PROJ"
            required
            maxLength={10}
            data-testid="project-key-input"
          />
          {errors.key && (
            <p className="mt-1 text-sm text-red-600" data-testid="project-key-error">
              {errors.key}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Used as prefix for issues (e.g., {formData.key || 'PROJ'}-123). Uppercase letters and numbers only.
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter project description..."
            data-testid="project-description-input"
          />
        </div>

        {/* Project Lead */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Lead *
          </label>
          <select
            value={formData.leadId}
            onChange={(e) => setFormData({ ...formData, leadId: Number(e.target.value) })}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.leadId ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            data-testid="project-lead-select"
          >
            <option value="">Select a project lead...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          {errors.leadId && (
            <p className="mt-1 text-sm text-red-600" data-testid="project-lead-error">
              {errors.leadId}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
            data-testid="create-project-cancel-button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!formData.name.trim() || !formData.key.trim() || isSubmitting}
            data-testid="create-project-submit-button"
          >
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}