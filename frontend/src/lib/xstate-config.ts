/**
 * XState Configuration and Context Setup
 *
 * This file contains the base configuration for XState state machines
 * used throughout the Jira Clone application.
 */

import { setup } from 'xstate';

// Base context type that can be extended by specific machines
export interface BaseContext {
  error?: string;
  loading?: boolean;
  lastUpdated?: Date;
}

// Common events that most machines will handle
export type BaseEvents =
  | { type: 'RETRY' }
  | { type: 'RESET' }
  | { type: 'ERROR'; error: string };

// Utility function to create machine setup with common guards and actions
export const createBaseSetup = () => setup({
  guards: {
    hasError: ({ context }) => !!context.error,
    isLoading: ({ context }) => !!context.loading,
  },
  actions: {
    setError: ({ context }, params: { error: string }) => {
      context.error = params.error;
      context.loading = false;
    },
    clearError: ({ context }) => {
      context.error = undefined;
    },
    setLoading: ({ context }, params: { loading: boolean }) => {
      context.loading = params.loading;
    },
    updateTimestamp: ({ context }) => {
      context.lastUpdated = new Date();
    },
  }
});

// Development helper to enable state machine inspection
export const enableInspection = process.env.NODE_ENV === 'development';

// Inspector configuration for development
export const inspectorConfig = {
  url: 'https://stately.ai/viz',
  iframe: false, // Set to true to embed inspector in app
};