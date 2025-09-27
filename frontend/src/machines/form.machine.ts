/**
 * Form State Machine
 *
 * This state machine manages form lifecycle including validation states,
 * submission handling, and data persistence. It provides real-time validation
 * and optimistic updates with proper error handling.
 */

import { setup, assign } from 'xstate';

// Form field definition
export interface FormField {
  name: string;
  value: any;
  error?: string;
  touched: boolean;
  required?: boolean;
  validator?: (value: any, formData: Record<string, any>) => string | undefined;
}

// Context for the form machine
export interface FormContext {
  fields: Record<string, FormField>;
  isValid: boolean;
  hasErrors: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  submitError?: string;
  submitSuccess?: boolean;
  validationInProgress: boolean;
}

// Events that can trigger form state transitions
export type FormEvents =
  | { type: 'FIELD_CHANGE'; field: string; value: any }
  | { type: 'FIELD_BLUR'; field: string }
  | { type: 'FIELD_FOCUS'; field: string }
  | { type: 'SUBMIT' }
  | { type: 'RESET' }
  | { type: 'VALIDATE' }
  | { type: 'VALIDATION_COMPLETE' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_FIELD_ERROR'; field: string; error: string }
  | { type: 'CLEAR_FIELD_ERROR'; field: string };

// Helper function to validate a single field
function validateField(field: FormField, allFields: Record<string, FormField>): string | undefined {
  const { value, required, validator } = field;

  // Check required validation
  if (required && (!value || (typeof value === 'string' && !value.trim()))) {
    return 'This field is required';
  }

  // Run custom validator if provided
  if (validator) {
    const formData = Object.fromEntries(
      Object.entries(allFields).map(([name, f]) => [name, f.value])
    );
    return validator(value, formData);
  }

  return undefined;
}

// Helper function to validate all fields
function validateAllFields(fields: Record<string, FormField>): {
  fields: Record<string, FormField>;
  isValid: boolean;
  hasErrors: boolean;
} {
  const updatedFields = { ...fields };
  let isValid = true;
  let hasErrors = false;

  for (const [name, field] of Object.entries(updatedFields)) {
    const error = validateField(field, fields);
    updatedFields[name] = { ...field, error };

    if (error) {
      isValid = false;
      hasErrors = true;
    }
  }

  return { fields: updatedFields, isValid, hasErrors };
}

// Machine setup with guards and actions
export const formMachine = setup({
  types: {
    context: {} as FormContext,
    events: {} as FormEvents,
  },
  guards: {
    isValid: ({ context }) => context.isValid,
    hasErrors: ({ context }) => context.hasErrors,
    isDirty: ({ context }) => context.isDirty,
    isSubmitting: ({ context }) => context.isSubmitting,
    hasSubmitError: ({ context }) => !!context.submitError,
  },
  actions: {
    // Field update actions
    updateField: assign({
      fields: ({ context }, params: { field: string; value: any }) => {
        const updatedFields = {
          ...context.fields,
          [params.field]: {
            ...context.fields[params.field],
            value: params.value,
            touched: true,
          },
        };

        // Validate the changed field immediately
        const fieldError = validateField(updatedFields[params.field], updatedFields);
        updatedFields[params.field].error = fieldError;

        return updatedFields;
      },
      isDirty: true,
    }),

    // Field blur/focus actions
    markFieldTouched: assign({
      fields: ({ context }, params: { field: string }) => ({
        ...context.fields,
        [params.field]: {
          ...context.fields[params.field],
          touched: true,
        },
      }),
    }),

    // Validation actions
    validateForm: assign(({ context }) => {
      const result = validateAllFields(context.fields);
      return {
        fields: result.fields,
        isValid: result.isValid,
        hasErrors: result.hasErrors,
        validationInProgress: false,
      };
    }),

    startValidation: assign({
      validationInProgress: true,
    }),

    // Submission actions
    startSubmitting: assign({
      isSubmitting: true,
      submitError: undefined,
    }),

    stopSubmitting: assign({
      isSubmitting: false,
    }),

    setSubmitSuccess: assign({
      submitSuccess: true,
      isSubmitting: false,
      submitError: undefined,
    }),

    setSubmitError: assign({
      submitError: (_, params: { error: string }) => params.error,
      isSubmitting: false,
    }),

    // Error management actions
    setFieldError: assign({
      fields: ({ context }, params: { field: string; error: string }) => ({
        ...context.fields,
        [params.field]: {
          ...context.fields[params.field],
          error: params.error,
        },
      }),
      hasErrors: true,
      isValid: false,
    }),

    clearFieldError: assign({
      fields: ({ context }, params: { field: string }) => ({
        ...context.fields,
        [params.field]: {
          ...context.fields[params.field],
          error: undefined,
        },
      }),
    }),

    clearAllErrors: assign({
      fields: ({ context }) => {
        const clearedFields = { ...context.fields };
        for (const field of Object.values(clearedFields)) {
          field.error = undefined;
        }
        return clearedFields;
      },
      submitError: undefined,
      hasErrors: false,
    }),

    // Reset form
    resetForm: assign(({ context }) => {
      const resetFields = { ...context.fields };
      for (const field of Object.values(resetFields)) {
        field.value = '';
        field.error = undefined;
        field.touched = false;
      }
      return {
        fields: resetFields,
        isValid: false,
        hasErrors: false,
        isDirty: false,
        isSubmitting: false,
        submitError: undefined,
        submitSuccess: false,
        validationInProgress: false,
      };
    }),
  },
}).createMachine({
  id: 'form',
  initial: 'idle',
  context: ({ input }: { input: { fields: Record<string, Omit<FormField, 'touched'>> } }) => {
    const fields: Record<string, FormField> = {};
    for (const [name, fieldConfig] of Object.entries(input.fields)) {
      fields[name] = {
        ...fieldConfig,
        touched: false,
      };
    }

    return {
      fields,
      isValid: false,
      hasErrors: false,
      isDirty: false,
      isSubmitting: false,
      validationInProgress: false,
    };
  },
  states: {
    // Form is idle, ready for user input
    idle: {
      on: {
        FIELD_CHANGE: {
          actions: 'updateField',
          target: 'validating',
        },
        FIELD_BLUR: {
          actions: 'markFieldTouched',
        },
        SUBMIT: [
          {
            guard: 'isValid',
            target: 'submitting',
            actions: 'startSubmitting',
          },
          {
            target: 'invalid',
            actions: ['validateForm'],
          },
        ],
        VALIDATE: {
          target: 'validating',
          actions: 'startValidation',
        },
        RESET: {
          actions: 'resetForm',
        },
      },
    },

    // Form is being validated
    validating: {
      entry: 'validateForm',
      always: [
        {
          guard: 'hasErrors',
          target: 'invalid',
        },
        {
          target: 'valid',
        },
      ],
      on: {
        FIELD_CHANGE: {
          actions: 'updateField',
          target: 'validating',
        },
        FIELD_BLUR: {
          actions: 'markFieldTouched',
        },
        RESET: {
          target: 'idle',
          actions: 'resetForm',
        },
      },
    },

    // Form is valid and ready for submission
    valid: {
      on: {
        FIELD_CHANGE: {
          actions: 'updateField',
          target: 'validating',
        },
        FIELD_BLUR: {
          actions: 'markFieldTouched',
        },
        SUBMIT: {
          target: 'submitting',
          actions: 'startSubmitting',
        },
        RESET: {
          target: 'idle',
          actions: 'resetForm',
        },
      },
    },

    // Form has validation errors
    invalid: {
      on: {
        FIELD_CHANGE: {
          actions: 'updateField',
          target: 'validating',
        },
        FIELD_BLUR: {
          actions: 'markFieldTouched',
        },
        SUBMIT: {
          actions: 'validateForm', // Re-validate on submit attempt
        },
        CLEAR_ERRORS: {
          target: 'validating',
          actions: 'clearAllErrors',
        },
        SET_FIELD_ERROR: {
          actions: 'setFieldError',
        },
        CLEAR_FIELD_ERROR: {
          actions: 'clearFieldError',
        },
        RESET: {
          target: 'idle',
          actions: 'resetForm',
        },
      },
    },

    // Form is being submitted
    submitting: {
      on: {
        SUBMIT_SUCCESS: {
          target: 'success',
          actions: 'setSubmitSuccess',
        },
        SUBMIT_ERROR: {
          target: 'submitError',
          actions: 'setSubmitError',
        },
      },
    },

    // Form submission was successful
    success: {
      on: {
        RESET: {
          target: 'idle',
          actions: 'resetForm',
        },
      },
    },

    // Form submission failed
    submitError: {
      on: {
        SUBMIT: {
          target: 'submitting',
          actions: 'startSubmitting',
        },
        FIELD_CHANGE: {
          actions: 'updateField',
          target: 'validating',
        },
        CLEAR_ERRORS: {
          target: 'valid',
          actions: 'clearAllErrors',
        },
        RESET: {
          target: 'idle',
          actions: 'resetForm',
        },
      },
    },
  },
});

// Helper function to create form machine with initial field configuration
export function createFormMachine(fields: Record<string, Omit<FormField, 'touched'>>) {
  return formMachine.provide({
    input: { fields },
  });
}

// Common field validators
export const validators = {
  required: (value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return 'This field is required';
    }
    return undefined;
  },

  email: (value: string) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  },

  minLength: (min: number) => (value: string) => {
    if (value && value.length < min) {
      return `Must be at least ${min} characters long`;
    }
    return undefined;
  },

  maxLength: (max: number) => (value: string) => {
    if (value && value.length > max) {
      return `Must be no more than ${max} characters long`;
    }
    return undefined;
  },
};