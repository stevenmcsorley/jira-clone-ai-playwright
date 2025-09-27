# XState Setup and Configuration

This directory contains the base setup and configuration for XState state machines used throughout the Jira Clone application.

## State Machines

### Issue Status State Machine (`/machines/issue-status.machine.ts`)

Manages the lifecycle of issue statuses with proper business logic and validation:

- **States**: `todo`, `inProgress`, `codeReview`, `done`, plus transition states
- **Business Rules**:
  - Issues must be assigned before starting work
  - Simple tasks (≤2 points) can skip code review
  - Direct completion allowed for tiny tasks (≤1 point)
  - Proper rollback on API failures
- **Features**: Optimistic updates, automatic retry, side effects logging

## Files Overview

### `xstate-config.ts`
Contains the base configuration, common types, and utility functions for XState machines:
- `BaseContext`: Base context type that can be extended
- `BaseEvents`: Common events that most machines handle
- `createBaseSetup()`: Factory function for machine setup with common guards and actions

### `xstate-inspector.ts`
Development tools for visualizing state machines:
- `initializeInspector()`: Initialize the Stately.ai inspector for development
- `inspectMachine()`: Connect a machine to the inspector
- Automatically enabled only in development mode

### Usage Example

```typescript
import { setup } from 'xstate';
import { createBaseSetup } from './xstate-config';
import { inspectMachine } from './xstate-inspector';

// Create machine with base setup
const myMachine = createBaseSetup().createMachine({
  id: 'myMachine',
  initial: 'idle',
  context: { loading: false },
  states: {
    idle: {
      on: { START: 'loading' }
    },
    loading: {
      // ... machine logic
    }
  }
});

// In a React component
import { useMachine } from '@xstate/react';

export const MyComponent = () => {
  const machine = inspectMachine(myMachine, 'myMachine');
  const [state, send] = useMachine(machine);

  return (
    <div>
      <p>State: {state.value}</p>
      <button onClick={() => send({ type: 'START' })}>
        Start
      </button>
    </div>
  );
};
```

## State Machine Inspector

In development mode, open Chrome DevTools and look for the "Stately" tab to visualize your state machines in real-time.

## Compatibility Notes

- XState v5.x is used for the latest features
- @xstate/react v4.x is compatible with React 19 using --legacy-peer-deps
- Consider upgrading to @xstate/react v5 when available for full React 19 support