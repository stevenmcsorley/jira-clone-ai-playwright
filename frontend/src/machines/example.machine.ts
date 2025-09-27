/**
 * Example State Machine
 *
 * A simple counter machine to demonstrate XState setup and usage.
 * This can be removed once real state machines are implemented.
 */

import { setup, assign } from 'xstate';

interface CounterContext {
  count: number;
  error?: string;
}

type CounterEvents =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'RESET' }
  | { type: 'SET'; value: number };

export const counterMachine = setup({
  types: {
    context: {} as CounterContext,
    events: {} as CounterEvents,
  },
  guards: {
    isPositive: ({ context }) => context.count > 0,
    canIncrement: ({ context }) => context.count < 100,
  },
  actions: {
    increment: assign({
      count: ({ context }) => Math.min(context.count + 1, 100)
    }),
    decrement: assign({
      count: ({ context }) => Math.max(context.count - 1, 0)
    }),
    reset: assign({ count: 0 }),
    setValue: assign({
      count: ({ event }) => {
        if (event.type === 'SET') {
          return Math.max(0, Math.min(event.value, 100));
        }
        return 0;
      }
    }),
  },
}).createMachine({
  id: 'counter',
  initial: 'active',
  context: {
    count: 0,
  },
  states: {
    active: {
      on: {
        INCREMENT: {
          guard: 'canIncrement',
          actions: 'increment',
        },
        DECREMENT: {
          guard: 'isPositive',
          actions: 'decrement',
        },
        RESET: {
          actions: 'reset',
        },
        SET: {
          actions: 'setValue',
        },
      },
    },
  },
});