/**
 * CreateIssueModal with XState Integration
 *
 * This component replaces the traditional useState-based CreateIssueModal
 * with XState-powered modal and form management. It provides optimistic
 * updates, proper validation, and robust error handling.
 */

import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useModalForm } from '../../hooks/useModalForm';
import type { IssueStatus, IssuePriority, IssueType } from '../../types/domain.types';

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (issueData: {
    title: string;
    description: string;
    status: IssueStatus;
    priority: IssuePriority;
    type: IssueType;
    assigneeId?: number;
  }) => Promise<void>;
  defaultStatus?: IssueStatus;
  users: Array<{ id: number; name: string; email: string }>;
}

interface CreateIssueFormData {
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  type: IssueType;
  assigneeId: number | '';
}

export const CreateIssueModalXState: React.FC<CreateIssueModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultStatus = 'todo',
  users,
}) => {
  // Configure form fields with validation
  const formConfig = {
    title: {
      name: 'title',
      value: '',
      required: true,
      validator: (value: string) => {
        if (!value?.trim()) return 'Title is required';
        if (value.trim().length < 3) return 'Title must be at least 3 characters';
        if (value.trim().length > 100) return 'Title must be less than 100 characters';
        return undefined;
      },
    },
    description: {
      name: 'description',
      value: '',
      required: false,
      validator: (value: string) => {
        if (value && value.length > 1000) return 'Description must be less than 1000 characters';
        return undefined;
      },
    },
    status: {
      name: 'status',
      value: defaultStatus,
      required: true,
    },
    priority: {
      name: 'priority',
      value: 'medium' as IssuePriority,
      required: true,
    },
    type: {
      name: 'type',
      value: 'task' as IssueType,
      required: true,
    },
    assigneeId: {
      name: 'assigneeId',
      value: '',
      required: false,
    },
  };

  // Initialize modal form hook
  const {
    isModalOpen,
    isModalSubmitting,
    modalError,
    isFormValid,
    hasFormErrors,
    formFields,
    canSubmit,
    openModal,
    closeModal,
    updateField,
    blurField,
    submitForm,
    resetForm,
    clearErrors,
  } = useModalForm<CreateIssueFormData>({
    fields: formConfig,
    onSubmit: async (data) => {
      // Transform form data to match expected interface
      const issueData = {
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        type: data.type,
        assigneeId: data.assigneeId ? Number(data.assigneeId) : undefined,
      };

      await onSubmit(issueData);
    },
    onSuccess: () => {
      onClose();
    },
    onError: (error) => {
      console.error('Failed to create issue:', error);
    },
    resetOnSuccess: true,
  });

  // Sync external modal state with internal XState
  React.useEffect(() => {
    if (isOpen && !isModalOpen) {
      openModal();
    } else if (!isOpen && isModalOpen) {
      closeModal();
    }
  }, [isOpen, isModalOpen, openModal, closeModal]);

  // Handle external close
  const handleClose = () => {
    closeModal();
    onClose();
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm();
  };

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  if (!isModalOpen) return null;

  return (
    <Modal isOpen={isModalOpen} onClose={handleClose} title="Create Issue" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Global Error Display */}
        {modalError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex justify-between items-start">
              <p className="text-red-700 text-sm">{modalError}</p>
              <button
                type="button"
                onClick={clearErrors}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Issue Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Issue Type *
          </label>
          <select
            value={formFields.type.value}
            onChange={(e) => updateField('type', e.target.value as IssueType)}
            onBlur={() => blurField('type')}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formFields.type.error && formFields.type.touched
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            disabled={isModalSubmitting}
          >
            <option value="task">Task</option>
            <option value="story">Story</option>
            <option value="bug">Bug</option>
            <option value="epic">Epic</option>
          </select>
          {formFields.type.error && formFields.type.touched && (
            <p className="mt-1 text-sm text-red-600">{formFields.type.error}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={formFields.title.value}
            onChange={(e) => updateField('title', e.target.value)}
            onBlur={() => blurField('title')}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formFields.title.error && formFields.title.touched
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            placeholder="Enter issue title..."
            disabled={isModalSubmitting}
          />
          {formFields.title.error && formFields.title.touched && (
            <p className="mt-1 text-sm text-red-600">{formFields.title.error}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formFields.description.value}
            onChange={(e) => updateField('description', e.target.value)}
            onBlur={() => blurField('description')}
            rows={4}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formFields.description.error && formFields.description.touched
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            placeholder="Enter issue description..."
            disabled={isModalSubmitting}
          />
          {formFields.description.error && formFields.description.touched && (
            <p className="mt-1 text-sm text-red-600">{formFields.description.error}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              value={formFields.status.value}
              onChange={(e) => updateField('status', e.target.value as IssueStatus)}
              onBlur={() => blurField('status')}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formFields.status.error && formFields.status.touched
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
              disabled={isModalSubmitting}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="code_review">Code Review</option>
              <option value="done">Done</option>
            </select>
            {formFields.status.error && formFields.status.touched && (
              <p className="mt-1 text-sm text-red-600">{formFields.status.error}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority *
            </label>
            <select
              value={formFields.priority.value}
              onChange={(e) => updateField('priority', e.target.value as IssuePriority)}
              onBlur={() => blurField('priority')}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formFields.priority.error && formFields.priority.touched
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
              disabled={isModalSubmitting}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            {formFields.priority.error && formFields.priority.touched && (
              <p className="mt-1 text-sm text-red-600">{formFields.priority.error}</p>
            )}
          </div>
        </div>

        {/* Assignee */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assignee
          </label>
          <select
            value={formFields.assigneeId.value}
            onChange={(e) => updateField('assigneeId', e.target.value)}
            onBlur={() => blurField('assigneeId')}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formFields.assigneeId.error && formFields.assigneeId.touched
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            disabled={isModalSubmitting}
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          {formFields.assigneeId.error && formFields.assigneeId.touched && (
            <p className="mt-1 text-sm text-red-600">{formFields.assigneeId.error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isModalSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit}
            className="relative"
          >
            {isModalSubmitting ? (
              <>
                <span className="opacity-70">Creating...</span>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              </>
            ) : (
              'Create Issue'
            )}
          </Button>
        </div>

        {/* Form State Debug (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-xs">
            <summary className="cursor-pointer text-gray-500">Debug Form State</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(
                {
                  isFormValid,
                  hasFormErrors,
                  canSubmit,
                  isModalSubmitting,
                  modalError,
                  fieldErrors: Object.fromEntries(
                    Object.entries(formFields).map(([name, field]) => [
                      name,
                      { value: field.value, error: field.error, touched: field.touched },
                    ])
                  ),
                },
                null,
                2
              )}
            </pre>
          </details>
        )}
      </form>
    </Modal>
  );
};