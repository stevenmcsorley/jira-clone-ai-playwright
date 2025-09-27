/**
 * useModalForm Hook
 *
 * This hook combines modal and form state machines to provide a complete
 * modal form experience with validation, submission, and error handling.
 * It integrates with Effect.ts for robust API calls and optimistic updates.
 */

import { useMachine } from '@xstate/react';
import { useCallback } from 'react';
import { modalMachine } from '../machines/modal.machine';
import { formMachine } from '../machines/form.machine';
import type { FormField } from '../machines/form.machine';
import type { ActorRefFrom } from 'xstate';

export interface UseModalFormOptions<TData = any> {
  fields: Record<string, Omit<FormField, 'touched'>>;
  onSubmit?: (data: TData) => Promise<void>;
  onSuccess?: (data: TData) => void;
  onError?: (error: string) => void;
  resetOnSuccess?: boolean;
}

export function useModalForm<TData = any>(options: UseModalFormOptions<TData>) {
  const {
    fields,
    onSubmit,
    onSuccess,
    onError,
    resetOnSuccess = true,
  } = options;

  // Initialize state machines with inspector connection
  const [modalState, modalSend] = useMachine(modalMachine, {
    inspect: process.env.NODE_ENV === 'development' ? {
      label: 'Modal Machine'
    } : undefined,
  });
  const [formState, formSend] = useMachine(formMachine, {
    input: { fields },
    inspect: process.env.NODE_ENV === 'development' ? {
      label: 'Form Machine'
    } : undefined,
  });

  // Modal control functions
  const openModal = useCallback((data?: any) => {
    modalSend({ type: 'OPEN', data });
    if (resetOnSuccess) {
      formSend({ type: 'RESET' });
    }
  }, [modalSend, formSend, resetOnSuccess]);

  const closeModal = useCallback(() => {
    modalSend({ type: 'CLOSE' });
  }, [modalSend]);

  const forceCloseModal = useCallback(() => {
    modalSend({ type: 'FORCE_CLOSE' });
    formSend({ type: 'RESET' });
  }, [modalSend, formSend]);

  // Form control functions
  const updateField = useCallback((field: string, value: any) => {
    formSend({ type: 'FIELD_CHANGE', field, value });
  }, [formSend]);

  const blurField = useCallback((field: string) => {
    formSend({ type: 'FIELD_BLUR', field });
  }, [formSend]);

  const focusField = useCallback((field: string) => {
    formSend({ type: 'FIELD_FOCUS', field });
  }, [formSend]);

  const validateForm = useCallback(() => {
    formSend({ type: 'VALIDATE' });
  }, [formSend]);

  const resetForm = useCallback(() => {
    formSend({ type: 'RESET' });
  }, [formSend]);

  const clearErrors = useCallback(() => {
    formSend({ type: 'CLEAR_ERRORS' });
    modalSend({ type: 'CLEAR_ERROR' });
  }, [formSend, modalSend]);

  // Form submission with Effect.ts integration
  const submitForm = useCallback(async () => {
    if (!formState.context.isValid) {
      formSend({ type: 'SUBMIT' }); // This will trigger validation
      return;
    }

    modalSend({ type: 'SUBMIT' });
    formSend({ type: 'SUBMIT' });

    try {
      // Extract form data
      const formData = Object.fromEntries(
        Object.entries(formState.context.fields).map(([name, field]) => [name, field.value])
      ) as TData;

      // Call the submit handler if provided
      if (onSubmit) {
        await onSubmit(formData);
      }

      // Handle success
      modalSend({ type: 'SUBMIT_SUCCESS' });
      formSend({ type: 'SUBMIT_SUCCESS' });

      if (onSuccess) {
        onSuccess(formData);
      }

      // Auto-close modal after success if configured
      if (resetOnSuccess) {
        setTimeout(() => {
          closeModal();
        }, 1500);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Submission failed';

      modalSend({ type: 'SUBMIT_ERROR', error: errorMessage });
      formSend({ type: 'SUBMIT_ERROR', error: errorMessage });

      if (onError) {
        onError(errorMessage);
      }
    }
  }, [
    formState.context.isValid,
    formState.context.fields,
    modalSend,
    formSend,
    onSubmit,
    onSuccess,
    onError,
    resetOnSuccess,
    closeModal,
  ]);

  // Helper to get current form data
  const getFormData = useCallback(() => {
    return Object.fromEntries(
      Object.entries(formState.context.fields).map(([name, field]) => [name, field.value])
    ) as TData;
  }, [formState.context.fields]);

  // Helper to set field errors (useful for server-side validation)
  const setFieldError = useCallback((field: string, error: string) => {
    formSend({ type: 'SET_FIELD_ERROR', field, error });
  }, [formSend]);

  const clearFieldError = useCallback((field: string) => {
    formSend({ type: 'CLEAR_FIELD_ERROR', field });
  }, [formSend]);

  // Computed values for easy access
  const isModalOpen = modalState.context.isVisible;
  const isModalSubmitting = modalState.context.isSubmitting;
  const modalError = modalState.context.error;

  const isFormValid = formState.context.isValid;
  const isFormDirty = formState.context.isDirty;
  const hasFormErrors = formState.context.hasErrors;
  const isFormSubmitting = formState.context.isSubmitting;
  const formSubmitError = formState.context.submitError;
  const formFields = formState.context.fields;

  // Combined state helpers
  const canSubmit = isFormValid && !isModalSubmitting && !isFormSubmitting;
  const hasErrors = !!modalError || hasFormErrors || !!formSubmitError;

  return {
    // Modal state
    isModalOpen,
    isModalSubmitting,
    modalError,
    modalState: modalState.value,

    // Form state
    isFormValid,
    isFormDirty,
    hasFormErrors,
    isFormSubmitting,
    formSubmitError,
    formFields,
    formState: formState.value,

    // Combined state
    canSubmit,
    hasErrors,

    // Modal actions
    openModal,
    closeModal,
    forceCloseModal,

    // Form actions
    updateField,
    blurField,
    focusField,
    validateForm,
    resetForm,
    clearErrors,
    submitForm,
    getFormData,
    setFieldError,
    clearFieldError,

    // Raw state machines (for advanced usage)
    modalMachine: modalState,
    formMachine: formState,
    modalSend,
    formSend,
  };
}

// Type helper for form data
export type FormData<T extends Record<string, Omit<FormField, 'touched'>>> = {
  [K in keyof T]: T[K]['value'];
};