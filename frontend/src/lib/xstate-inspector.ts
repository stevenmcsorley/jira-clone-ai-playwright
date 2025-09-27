/**
 * XState Inspector Setup for Development
 *
 * This file configures the Stately.ai inspector for visualizing
 * state machines during development.
 */

import { createBrowserInspector } from '@statelyai/inspect';
import { enableInspection } from './xstate-config';

let inspector: ReturnType<typeof createBrowserInspector> | null = null;

/**
 * Initialize the XState inspector for development
 * Call this once at app startup in development mode
 */
export const initializeInspector = () => {
  if (enableInspection && !inspector) {
    try {
      inspector = createBrowserInspector({
        iframe: false,
        autoStart: true,
      });

      // Start the inspector
      inspector.start();

      console.log('🔍 XState Inspector initialized!');
      console.log('📱 Open the browser inspector at: https://stately.ai/inspect');
      console.log('🔗 Or check the Network tab in DevTools for inspector connection');
    } catch (error) {
      console.warn('Failed to initialize XState inspector:', error);
    }
  }
  return inspector;
};

/**
 * Get the current inspector instance
 */
export const getInspector = () => inspector;

/**
 * Connect a machine to the inspector
 */
export const inspectMachine = (machine: any) => {
  if (inspector) {
    return machine.provide({
      inspect: inspector.inspect,
    });
  }
  return machine;
};