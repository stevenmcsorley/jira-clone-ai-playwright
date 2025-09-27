/**
 * Modal State Machine
 *
 * This state machine manages modal lifecycle including opening, closing,
 * submission states, and proper cleanup. It provides optimistic updates
 * and handles error states with proper user feedback.
 */

import { setup, assign } from 'xstate';

// Context for the modal machine
export interface ModalContext {
  isVisible: boolean;
  error?: string;
  isSubmitting: boolean;
  submitSuccess?: boolean;
  data?: any; // Generic data payload
}

// Events that can trigger modal state transitions
export type ModalEvents =
  | { type: 'OPEN'; data?: any }
  | { type: 'CLOSE' }
  | { type: 'SUBMIT'; data?: any }
  | { type: 'RESET' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'FORCE_CLOSE' };

// Machine setup with actions and guards
export const modalMachine = setup({
  types: {
    context: {} as ModalContext,
    events: {} as ModalEvents,
  },
  guards: {
    hasData: ({ context }) => !!context.data,
    hasError: ({ context }) => !!context.error,
    isSubmitting: ({ context }) => context.isSubmitting,
  },
  actions: {
    // Modal visibility actions
    showModal: assign({
      isVisible: true,
      error: undefined,
      submitSuccess: false,
    }),
    hideModal: assign({
      isVisible: false,
      isSubmitting: false,
      error: undefined,
      submitSuccess: false,
      data: undefined,
    }),

    // Data management actions
    setData: assign({
      data: (_, params: { data: any }) => params.data,
    }),
    clearData: assign({
      data: undefined,
    }),

    // Submission state actions
    startSubmitting: assign({
      isSubmitting: true,
      error: undefined,
    }),
    stopSubmitting: assign({
      isSubmitting: false,
    }),

    // Success handling
    setSubmitSuccess: assign({
      submitSuccess: true,
      isSubmitting: false,
      error: undefined,
    }),

    // Error handling
    setError: assign({
      error: (_, params: { error: string }) => params.error,
      isSubmitting: false,
    }),
    clearError: assign({
      error: undefined,
    }),

    // Reset all state
    resetModal: assign({
      isVisible: false,
      isSubmitting: false,
      error: undefined,
      submitSuccess: false,
      data: undefined,
    }),
  },
}).createMachine({
  id: 'modal',
  initial: 'closed',
  context: {
    isVisible: false,
    isSubmitting: false,
  },
  states: {
    // Modal is closed
    closed: {
      on: {
        OPEN: {
          target: 'opening',
          actions: [
            'showModal',
            { type: 'setData', params: ({ event }) => ({ data: event.data }) },
          ],
        },
      },
    },

    // Modal is opening (animation state)
    opening: {
      after: {
        100: { target: 'open' }, // Allow time for CSS animations
      },
      on: {
        CLOSE: { target: 'closing' },
        FORCE_CLOSE: { target: 'closed' },
      },
    },

    // Modal is open and ready for interaction
    open: {
      on: {
        CLOSE: { target: 'closing' },
        FORCE_CLOSE: { target: 'closed' },
        SUBMIT: {
          target: 'submitting',
          actions: [
            'startSubmitting',
            { type: 'setData', params: ({ event }) => ({ data: event.data }) },
          ],
        },
        CLEAR_ERROR: {
          actions: 'clearError',
        },
        RESET: {
          actions: ['clearData', 'clearError'],
        },
      },
    },

    // Modal is in submitting state
    submitting: {
      on: {
        SUBMIT_SUCCESS: {
          target: 'success',
          actions: 'setSubmitSuccess',
        },
        SUBMIT_ERROR: {
          target: 'open',
          actions: { type: 'setError', params: ({ event }) => ({ error: event.error }) },
        },
        FORCE_CLOSE: {
          target: 'closed',
          actions: 'resetModal',
        },
      },
    },

    // Modal showing success state
    success: {
      after: {
        1500: { target: 'closing' }, // Auto-close after success
      },
      on: {
        CLOSE: { target: 'closing' },
        FORCE_CLOSE: { target: 'closed' },
        RESET: {
          target: 'open',
          actions: ['clearData', 'clearError'],
        },
      },
    },

    // Modal is closing (animation state)
    closing: {
      entry: 'stopSubmitting',
      after: {
        200: { target: 'closed' }, // Allow time for CSS animations
      },
      on: {
        OPEN: { target: 'opening' },
      },
    },
  },

  // Global event handlers
  on: {
    RESET: {
      target: 'closed',
      actions: 'resetModal',
    },
  },
});

// Helper function to create modal machine with custom configuration
export function createModalMachine(options?: {
  openAnimationDuration?: number;
  closeAnimationDuration?: number;
  successDisplayDuration?: number;
}) {
  const {
    openAnimationDuration = 100,
    closeAnimationDuration = 200,
    successDisplayDuration = 1500,
  } = options || {};

  return modalMachine.provide({
    delays: {
      openAnimation: openAnimationDuration,
      closeAnimation: closeAnimationDuration,
      successDisplay: successDisplayDuration,
    },
  });
}