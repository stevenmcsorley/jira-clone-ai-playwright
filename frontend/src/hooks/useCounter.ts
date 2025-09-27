/**
 * Example XState React Hook
 *
 * Demonstrates how to use XState with React.
 * This shows the pattern that will be used for real state machines.
 */

import { useMachine } from '@xstate/react';
import { counterMachine } from '../machines/example.machine';
import { inspectMachine } from '../lib/xstate-inspector';

export const useCounter = () => {
  // Connect machine to inspector in development
  const machine = inspectMachine(counterMachine);

  const [state, send] = useMachine(machine);

  return {
    // State values
    count: state.context.count,

    // Actions
    increment: () => send({ type: 'INCREMENT' }),
    decrement: () => send({ type: 'DECREMENT' }),
    reset: () => send({ type: 'RESET' }),
    setValue: (value: number) => send({ type: 'SET', value } as any),

    // State checks
    canIncrement: state.can({ type: 'INCREMENT' }),
    canDecrement: state.can({ type: 'DECREMENT' }),

    // For debugging
    state: state.value,
    context: state.context,
  };
};