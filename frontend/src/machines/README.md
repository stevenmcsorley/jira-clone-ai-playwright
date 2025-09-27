# XState Machine Visualizations

This directory contains state machines that can be visualized using several tools.

## 🎯 How to View State Diagrams

### 1. Stately.ai Studio (Recommended)
Visit [https://stately.ai/studio](https://stately.ai/studio) and paste any machine code to see an interactive diagram.

**Quick Links:**
- [Modal Machine](https://stately.ai/studio) - Copy `modalMachine` from `modal.machine.ts`
- [Form Machine](https://stately.ai/studio) - Copy `formMachine` from `form.machine.ts`
- [Issue Status Machine](https://stately.ai/studio) - Copy `issueStatusMachine` from `issue-status.machine.ts`

### 2. XState Inspector (Development)
When running the app in development mode, the XState inspector is available at:
```
http://localhost:3000/@xstate/inspector
```

This shows real-time state transitions as you interact with the application.

### 3. VS Code Extension
Install the "XState VSCode" extension for inline state machine visualization.

## 📊 Available State Machines

### Modal Machine (`modal.machine.ts`)
**States:** `closed` → `opening` → `open` → `submitting` → `success` → `closing`

**Key Events:**
- `OPEN` - Opens the modal
- `CLOSE` - Closes the modal
- `SUBMIT` - Submits form data
- `SUBMIT_SUCCESS` - Handles successful submission
- `SUBMIT_ERROR` - Handles submission errors

### Form Machine (`form.machine.ts`)
**States:** `idle` → `validating` → `valid`/`invalid` → `submitting` → `success`/`submitError`

**Key Events:**
- `FIELD_CHANGE` - Updates field value and triggers validation
- `FIELD_BLUR` - Marks field as touched
- `SUBMIT` - Attempts form submission
- `VALIDATION_COMPLETE` - Completes validation cycle

### Issue Status Machine (`issue-status.machine.ts`)
**States:** `todo` → `inProgress` → `codeReview` → `done`

**Key Events:**
- `START_WORK` - Moves issue to in progress
- `SUBMIT_FOR_REVIEW` - Moves to code review
- `APPROVE` - Approves and completes issue
- `REQUEST_CHANGES` - Sends back for changes

## 🛠️ Usage in Components

### Modal + Form Integration
```typescript
import { useModalForm } from '../hooks/useModalForm';

const MyModal = () => {
  const {
    isModalOpen,
    formFields,
    canSubmit,
    openModal,
    closeModal,
    updateField,
    submitForm
  } = useModalForm({
    fields: { /* field config */ },
    onSubmit: async (data) => { /* submit logic */ }
  });

  // Modal and form state managed by XState machines
};
```

### Issue Status Management
```typescript
import { useIssueStatus } from '../hooks/useIssueStatus';

const IssueCard = ({ issue }) => {
  const {
    status,
    canStartWork,
    canSubmitForReview,
    startWork,
    submitForReview
  } = useIssueStatus({ issue });

  // Issue status transitions managed by state machine
};
```

## 🎨 Visual State Machine Benefits

1. **Predictable Behavior**: State machines prevent invalid state transitions
2. **Visual Documentation**: Diagrams serve as living documentation
3. **Debugging**: Inspector shows exact state and event flow
4. **Testing**: Each state and transition can be tested individually
5. **Team Communication**: Visual diagrams improve team understanding

## 🔧 Development Tools

### Enable XState DevTools
The XState inspector is automatically enabled in development mode via:
```typescript
// src/lib/xstate-inspector.ts
import { createBrowserInspector } from '@statelyai/inspect';

export function initializeInspector() {
  if (process.env.NODE_ENV === 'development') {
    createBrowserInspector().start();
  }
}
```

### State Machine Testing
Each machine can be tested using XState's testing utilities:
```typescript
import { createActor } from 'xstate';
import { modalMachine } from './modal.machine';

const actor = createActor(modalMachine);
actor.start();
actor.send({ type: 'OPEN' });
expect(actor.getSnapshot().matches('opening')).toBe(true);
```