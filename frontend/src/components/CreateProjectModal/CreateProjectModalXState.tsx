/**
 * CreateProjectModal with XState Integration
 *
 * This component replaces the traditional useState-based CreateProjectModal
 * with XState-powered modal and form management. It provides comprehensive
 * validation, proper state transitions, and robust error handling.
 */

import React from 'react';
import { ModalXState } from '../ui/ModalXState';
import { Button } from '../ui/Button';
import { useModalForm } from '../../hooks/useModalForm';
import type { CreateProjectRequest } from '../../types/domain.types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: CreateProjectRequest) => Promise<void>;
  users: Array<{ id: number; name: string; email: string }>;
}

interface CreateProjectFormData {
  name: string;
  key: string;
  description: string;
  leadId: number | '';
}

export const CreateProjectModalXState: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  users,
}) => {
  // Helper function to generate project key from name
  const generateKeyFromName = (name: string): string => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '') // Remove special characters
      .split(' ')
      .map(word => word.slice(0, 3)) // Take first 3 letters of each word
      .join('')
      .slice(0, 10); // Limit to 10 characters
  };

  // Configure form fields with comprehensive validation
  const formConfig = {
    name: {
      name: 'name',
      value: '',
      required: true,
      validator: (value: string) => {
        if (!value?.trim()) return 'Project name is required';
        if (value.trim().length < 2) return 'Project name must be at least 2 characters';
        if (value.trim().length > 50) return 'Project name must be less than 50 characters';
        return undefined;
      },
    },
    key: {
      name: 'key',
      value: '',
      required: true,
      validator: (value: string) => {
        if (!value?.trim()) return 'Project key is required';
        if (!/^[A-Z0-9]+$/.test(value)) {
          return 'Project key must contain only uppercase letters and numbers';
        }
        if (value.length < 2 || value.length > 10) {
          return 'Project key must be 2-10 characters long';
        }
        return undefined;
      },
    },
    description: {
      name: 'description',
      value: '',
      required: false,
      validator: (value: string) => {
        if (value && value.length > 500) {
          return 'Description must be less than 500 characters';
        }
        return undefined;
      },
    },
    leadId: {
      name: 'leadId',
      value: users[0]?.id || '',
      required: true,
      validator: (value: number | string) => {
        if (!value) return 'Project lead is required';
        return undefined;
      },
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
  } = useModalForm<CreateProjectFormData>({
    fields: formConfig,
    onSubmit: async (data) => {
      // Transform form data to match expected interface
      const projectData: CreateProjectRequest = {
        name: data.name.trim(),
        key: data.key.trim().toUpperCase(),
        description: data.description.trim(),
        leadId: Number(data.leadId),
      };

      await onSubmit(projectData);
    },
    onSuccess: () => {
      onClose();
    },
    onError: (error) => {
      console.error('Failed to create project:', error);
    },
    resetOnSuccess: true,
  });

  // Track whether key was manually edited
  const [keyManuallyEdited, setKeyManuallyEdited] = React.useState(false);

  // Sync external modal state with internal XState
  React.useEffect(() => {
    if (isOpen && !isModalOpen) {
      openModal();
      setKeyManuallyEdited(false);
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
      setKeyManuallyEdited(false);
    }
  }, [isOpen, resetForm]);

  // Auto-generate project key from name
  const handleNameChange = (name: string) => {
    updateField('name', name);

    // Auto-generate key if it hasn't been manually edited
    if (!keyManuallyEdited) {
      const generatedKey = generateKeyFromName(name);
      updateField('key', generatedKey);
    }
  };

  // Handle manual key changes
  const handleKeyChange = (key: string) => {
    const upperKey = key.toUpperCase();
    updateField('key', upperKey);
    setKeyManuallyEdited(true);
  };

  if (!isModalOpen) return null;

  return (
    <ModalXState
      isOpen={isModalOpen}
      onClose={handleClose}
      title="Create Project"
      size="lg"
      isSubmitting={isModalSubmitting}
      error={modalError}
      onClearError={clearErrors}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name *
          </label>
          <input
            type="text"
            value={formFields.name.value}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => blurField('name')}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formFields.name.error && formFields.name.touched
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            placeholder="Enter project name..."
            disabled={isModalSubmitting}
            data-testid="project-name-input"
          />
          {formFields.name.error && formFields.name.touched && (
            <p className="mt-1 text-sm text-red-600" data-testid="project-name-error">
              {formFields.name.error}
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
            value={formFields.key.value}
            onChange={(e) => handleKeyChange(e.target.value)}
            onBlur={() => blurField('key')}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formFields.key.error && formFields.key.touched
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            placeholder="e.g., PROJ"
            maxLength={10}
            disabled={isModalSubmitting}
            data-testid="project-key-input"
          />
          {formFields.key.error && formFields.key.touched && (
            <p className="mt-1 text-sm text-red-600" data-testid="project-key-error">
              {formFields.key.error}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Used as prefix for issues (e.g., {formFields.key.value || 'PROJ'}-123). Uppercase letters and numbers only.
          </p>
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
            rows={3}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formFields.description.error && formFields.description.touched
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            placeholder="Enter project description..."
            disabled={isModalSubmitting}
            data-testid="project-description-input"
          />
          {formFields.description.error && formFields.description.touched && (
            <p className="mt-1 text-sm text-red-600">
              {formFields.description.error}
            </p>
          )}
        </div>

        {/* Project Lead */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Lead *
          </label>
          <select
            value={formFields.leadId.value}
            onChange={(e) => updateField('leadId', e.target.value ? Number(e.target.value) : '')}
            onBlur={() => blurField('leadId')}
            className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formFields.leadId.error && formFields.leadId.touched
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            disabled={isModalSubmitting}
            data-testid="project-lead-select"
          >
            <option value="">Select a project lead...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          {formFields.leadId.error && formFields.leadId.touched && (
            <p className="mt-1 text-sm text-red-600" data-testid="project-lead-error">
              {formFields.leadId.error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isModalSubmitting}
            data-testid="create-project-cancel-button"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!canSubmit}
            className="relative"
            data-testid="create-project-submit-button"
          >
            {isModalSubmitting ? (
              <>
                <span className="opacity-70">Creating...</span>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              </>
            ) : (
              'Create Project'
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
                  keyManuallyEdited,
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
    </ModalXState>
  );
};