/**
 * XState Demo Component
 *
 * This component demonstrates the XState inspector in action.
 * It shows modal and form state machines with visual feedback.
 */

import React from 'react';
import { useModalForm } from '../../hooks/useModalForm';
import { Button } from '../ui/Button';

export const XStateDemo: React.FC = () => {
  const {
    isModalOpen,
    isModalSubmitting,
    modalError,
    isFormValid,
    formFields,
    canSubmit,
    openModal,
    closeModal,
    updateField,
    blurField,
    submitForm,
    resetForm,
    clearErrors,
    modalState,
    formState,
  } = useModalForm({
    fields: {
      name: {
        name: 'name',
        value: '',
        required: true,
        validator: (value: string) => {
          if (!value?.trim()) return 'Name is required';
          if (value.length < 2) return 'Name must be at least 2 characters';
          return undefined;
        },
      },
      email: {
        name: 'email',
        value: '',
        required: true,
        validator: (value: string) => {
          if (!value?.trim()) return 'Email is required';
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Please enter a valid email';
          }
          return undefined;
        },
      },
    },
    onSubmit: async (data) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate occasional failure
      if (Math.random() < 0.3) {
        throw new Error('Simulated submission error');
      }

      console.log('Demo form submitted:', data);
    },
    onSuccess: () => {
      console.log('Demo form submission successful!');
    },
    onError: (error) => {
      console.error('Demo form submission error:', error);
    },
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎯 XState Visual Inspector Demo
        </h1>
        <p className="text-gray-600 mb-6">
          This component demonstrates XState machines in action. Watch the state transitions
          in real-time using the inspector tools below.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">🔍 How to View State Diagrams:</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li><strong>Option 1:</strong> Open browser console and look for inspector URLs</li>
            <li><strong>Option 2:</strong> Visit <a href="https://stately.ai/inspect" target="_blank" rel="noopener noreferrer" className="underline">stately.ai/inspect</a></li>
            <li><strong>Option 3:</strong> Use Stately Studio: <a href="https://stately.ai/studio" target="_blank" rel="noopener noreferrer" className="underline">stately.ai/studio</a></li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">🎮 Demo Controls</h2>

          <div className="space-y-3">
            <Button
              onClick={() => openModal()}
              variant="primary"
              className="w-full"
            >
              🚀 Open Modal (Watch State Change!)
            </Button>

            <Button
              onClick={resetForm}
              variant="ghost"
              className="w-full"
            >
              🔄 Reset Form State
            </Button>

            <Button
              onClick={clearErrors}
              variant="ghost"
              className="w-full"
            >
              ✨ Clear Errors
            </Button>
          </div>

          {/* Current State Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-3">📊 Current State</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Modal:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{String(modalState.value)}</code></div>
              <div><strong>Form:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{String(formState.value)}</code></div>
              <div><strong>Is Valid:</strong> <span className={isFormValid ? 'text-green-600' : 'text-red-600'}>{String(isFormValid)}</span></div>
              <div><strong>Can Submit:</strong> <span className={canSubmit ? 'text-green-600' : 'text-red-600'}>{String(canSubmit)}</span></div>
            </div>
          </div>
        </div>

        {/* Demo Form */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">📝 Test Form</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formFields.name.value}
                onChange={(e) => updateField('name', e.target.value)}
                onBlur={() => blurField('name')}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formFields.name.error && formFields.name.touched
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder="Enter your name..."
              />
              {formFields.name.error && formFields.name.touched && (
                <p className="mt-1 text-sm text-red-600">{formFields.name.error}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formFields.email.value}
                onChange={(e) => updateField('email', e.target.value)}
                onBlur={() => blurField('email')}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formFields.email.error && formFields.email.touched
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder="Enter your email..."
              />
              {formFields.email.error && formFields.email.touched && (
                <p className="mt-1 text-sm text-red-600">{formFields.email.error}</p>
              )}
            </div>

            <Button
              onClick={submitForm}
              disabled={!canSubmit}
              className="w-full"
            >
              {isModalSubmitting ? '⏳ Submitting...' : '📤 Submit Form'}
            </Button>
          </div>

          {modalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{modalError}</p>
            </div>
          )}
        </div>
      </div>

      {/* State Machine Flow Diagram */}
      <div className="mt-12 bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🔄 State Machine Flow</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Modal States:</h3>
            <code className="block bg-gray-100 p-3 rounded text-xs">
              closed → opening → open → submitting → success → closing → closed
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SUBMIT_ERROR → open (with error)
            </code>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Form States:</h3>
            <code className="block bg-gray-100 p-3 rounded text-xs">
              idle → validating → valid/invalid → submitting → success
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SUBMIT_ERROR → submitError
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};