/**
 * Simple XState Demo Component
 *
 * A simplified demonstration of XState with basic state transitions
 * to show the visual inspector working.
 */

import React from 'react';
import { useMachine } from '@xstate/react';
import { createMachine, assign } from 'xstate';
import { Button } from '../ui/Button';

// Simple counter machine for demonstration
const counterMachine = createMachine({
  id: 'counter',
  initial: 'idle',
  context: {
    count: 0,
    error: null,
  },
  states: {
    idle: {
      on: {
        INCREMENT: {
          actions: assign({
            count: ({ context }) => context.count + 1,
          }),
        },
        DECREMENT: {
          actions: assign({
            count: ({ context }) => context.count - 1,
          }),
        },
        RESET: {
          actions: assign({
            count: 0,
          }),
        },
        START_ASYNC: {
          target: 'loading',
        },
      },
    },
    loading: {
      after: {
        2000: {
          target: 'success',
          actions: assign({
            count: ({ context }) => context.count + 10,
          }),
        },
      },
      on: {
        CANCEL: {
          target: 'idle',
        },
        ERROR: {
          target: 'error',
          actions: assign({
            error: ({ event }) => event.message || 'Something went wrong',
          }),
        },
      },
    },
    success: {
      after: {
        1500: {
          target: 'idle',
        },
      },
      on: {
        RESET: {
          target: 'idle',
          actions: assign({
            count: 0,
            error: null,
          }),
        },
      },
    },
    error: {
      on: {
        RETRY: {
          target: 'loading',
          actions: assign({
            error: null,
          }),
        },
        RESET: {
          target: 'idle',
          actions: assign({
            count: 0,
            error: null,
          }),
        },
      },
    },
  },
});

export const SimpleXStateDemo: React.FC = () => {
  const [state, send] = useMachine(counterMachine);
  // Disabled inspector temporarily to troubleshoot
  // inspect: process.env.NODE_ENV === 'development' ? {
  //   label: 'Counter Machine'
  // } : undefined,

  const { count, error } = state.context;
  const currentState = state.value;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎯 Simple XState Visual Inspector Demo
        </h1>
        <p className="text-gray-600 mb-6">
          This is a simplified XState demo with a basic counter machine.
          Watch the state transitions in the visual inspector!
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">🔍 How to View State Diagrams:</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li><strong>Option 1:</strong> Check browser console for XState inspector messages</li>
            <li><strong>Option 2:</strong> Visit <a href="https://stately.ai/inspect" target="_blank" rel="noopener noreferrer" className="underline">stately.ai/inspect</a></li>
            <li><strong>Option 3:</strong> Use Stately Studio: <a href="https://stately.ai/studio" target="_blank" rel="noopener noreferrer" className="underline">stately.ai/studio</a></li>
          </ul>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-blue-600 mb-2">{count}</div>
          <div className="text-sm text-gray-500">
            Current State: <code className="bg-gray-100 px-2 py-1 rounded">{String(currentState)}</code>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            onClick={() => send({ type: 'INCREMENT' })}
            disabled={currentState !== 'idle'}
            variant="primary"
            size="sm"
          >
            +1
          </Button>

          <Button
            onClick={() => send({ type: 'DECREMENT' })}
            disabled={currentState !== 'idle'}
            variant="secondary"
            size="sm"
          >
            -1
          </Button>

          <Button
            onClick={() => send({ type: 'START_ASYNC' })}
            disabled={currentState !== 'idle'}
            variant="primary"
            size="sm"
          >
            {currentState === 'loading' ? 'Loading...' : '+10 (Async)'}
          </Button>

          <Button
            onClick={() => send({ type: 'RESET' })}
            variant="ghost"
            size="sm"
          >
            Reset
          </Button>
        </div>

        {currentState === 'loading' && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm text-gray-600">Processing async operation...</span>
            </div>
            <div className="mt-2">
              <Button
                onClick={() => send({ type: 'CANCEL' })}
                variant="ghost"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => send({ type: 'ERROR', message: 'Simulated error!' })}
                variant="ghost"
                size="sm"
                className="ml-2"
              >
                Trigger Error
              </Button>
            </div>
          </div>
        )}

        {currentState === 'success' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-center">
            <p className="text-green-700 text-sm">✅ Operation completed successfully!</p>
          </div>
        )}

        {currentState === 'error' && (
          <div className="mt-4 text-center">
            <Button
              onClick={() => send({ type: 'RETRY' })}
              variant="primary"
              size="sm"
            >
              Retry
            </Button>
          </div>
        )}
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-700 mb-3">🔄 State Machine Flow</h3>
        <code className="block text-xs bg-white p-3 rounded border">
          idle → INCREMENT/DECREMENT/START_ASYNC
          <br />
          &nbsp;&nbsp;↓ START_ASYNC
          <br />
          loading → [after 2s] → success → [after 1.5s] → idle
          <br />
          loading → ERROR → error → RETRY → loading
          <br />
          any state → RESET → idle
        </code>
      </div>
    </div>
  );
};