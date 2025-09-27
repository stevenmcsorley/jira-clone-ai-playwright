/**
 * Issue Status State Machine
 *
 * This state machine manages the lifecycle of issue statuses with proper
 * transition guards and business logic. It prevents invalid state transitions
 * and provides hooks for side effects like API calls and notifications.
 */

import { setup, assign } from 'xstate';
import { IssueStatus, Issue } from '../types/domain.types';

// Context for the issue status machine
export interface IssueStatusContext {
  issue: Issue;
  previousStatus?: IssueStatus;
  error?: string;
  isLoading: boolean;
  optimisticStatus?: IssueStatus;
  transitionReason?: string;
  validTransitions: IssueStatus[];
  workflowConfig: WorkflowConfig;
}

// Workflow configuration interface
export interface WorkflowConfig {
  requireAssigneeForStart: boolean;
  requireDescriptionForReview: boolean;
  allowDirectCompletion: boolean;
  autoCompleteThreshold: number; // minutes
  requireApprovalForCompletion: boolean;
  allowReopenFromDone: boolean;
}

// Events that can trigger state transitions
export type IssueStatusEvents =
  | { type: 'START_WORK' }
  | { type: 'SUBMIT_FOR_REVIEW' }
  | { type: 'REQUEST_CHANGES'; feedback?: string }
  | { type: 'APPROVE' }
  | { type: 'COMPLETE' }
  | { type: 'REOPEN'; reason?: string }
  | { type: 'MOVE_TO_BACKLOG' }
  | { type: 'API_SUCCESS'; status: IssueStatus }
  | { type: 'API_ERROR'; error: string }
  | { type: 'RETRY' }
  | { type: 'CANCEL_OPTIMISTIC' };

// Machine setup with guards, actions, and actors
export const issueStatusMachine = setup({
  types: {
    context: {} as IssueStatusContext,
    events: {} as IssueStatusEvents,
  },
  guards: {
    // Enhanced business rule guards
    canStartWork: ({ context }) => {
      if (!context.workflowConfig.requireAssigneeForStart) return true;
      return !!context.issue.assigneeId;
    },
    canSubmitForReview: ({ context }) => {
      // Check if description is required for review
      if (context.workflowConfig.requireDescriptionForReview) {
        return !!context.issue.description?.trim();
      }
      // For bugs, always require description
      if (context.issue.type === 'bug') {
        return !!context.issue.description?.trim();
      }
      return true;
    },
    canApprove: ({ context }) => {
      // Only allow approval if issue has been properly reviewed
      return context.issue.status === 'code_review';
    },
    canDirectComplete: ({ context }) => {
      if (!context.workflowConfig.allowDirectCompletion) return false;
      // Allow direct completion for small tasks
      return context.issue.type === 'task' &&
             (context.issue.estimate || 0) <= context.workflowConfig.autoCompleteThreshold;
    },
    canSkipReview: ({ context }) => {
      // Simple tasks might skip code review
      return context.issue.type === 'task' &&
             (context.issue.estimate || 0) <= 5; // 5 minutes
    },
    requiresApproval: ({ context }) => {
      if (!context.workflowConfig.requireApprovalForCompletion) return false;
      // High priority items and epics require approval
      return context.issue.priority === 'high' ||
             context.issue.priority === 'urgent' ||
             context.issue.type === 'epic';
    },
    canReopen: ({ context }) => {
      return context.workflowConfig.allowReopenFromDone;
    },
    hasValidTransition: ({ context }, params: { targetStatus: IssueStatus }) => {
      return context.validTransitions.includes(params.targetStatus);
    },
    hasAssignee: ({ context }) => !!context.issue.assigneeId,
    hasDescription: ({ context }) => !!context.issue.description?.trim(),
    isEpic: ({ context }) => context.issue.type === 'epic',
    isBug: ({ context }) => context.issue.type === 'bug',
    hasError: ({ context }) => !!context.error,
  },
  actions: {
    // State management actions
    setOptimisticStatus: assign({
      optimisticStatus: (_, params: { status: IssueStatus; reason?: string }) => params.status,
      transitionReason: (_, params: { status: IssueStatus; reason?: string }) => params.reason,
      previousStatus: ({ context }) => context.issue.status,
      isLoading: true,
      error: undefined,
    }),
    updateValidTransitions: assign({
      validTransitions: ({ context }) => {
        const current = context.issue.status;
        const config = context.workflowConfig;

        switch (current) {
          case 'todo':
            const todoTransitions: IssueStatus[] = [];
            if (config.requireAssigneeForStart ? !!context.issue.assigneeId : true) {
              todoTransitions.push('in_progress');
            }
            if (config.allowDirectCompletion) {
              todoTransitions.push('done');
            }
            return todoTransitions;

          case 'in_progress':
            const inProgressTransitions: IssueStatus[] = ['todo'];
            if (context.issue.type === 'task' && (context.issue.estimate || 0) <= 5) {
              inProgressTransitions.push('done');
            } else {
              inProgressTransitions.push('code_review');
            }
            return inProgressTransitions;

          case 'code_review':
            return ['in_progress', 'done'];

          case 'done':
            return config.allowReopenFromDone ? ['in_progress'] : [];

          default:
            return [];
        }
      },
    }),
    clearOptimisticUpdate: assign({
      optimisticStatus: undefined,
      isLoading: false,
    }),
    setError: assign({
      error: (_, params: { error: string }) => params.error,
      isLoading: false,
      optimisticStatus: undefined,
    }),
    rollbackStatus: assign({
      optimisticStatus: undefined,
      isLoading: false,
    }),
    updateIssueStatus: assign({
      issue: ({ context }, params: { status: IssueStatus }) => ({
        ...context.issue,
        status: params.status,
      }),
      optimisticStatus: undefined,
      previousStatus: undefined,
      isLoading: false,
      error: undefined,
    }),

    // Side effect actions (to be implemented with actual API calls)
    notifyAssignee: () => {
      // TODO: Implement notification system
      console.log('📧 Notifying assignee of status change');
    },
    logStatusChange: ({ context }) => {
      console.log('📝 Status change logged:', {
        issueId: context.issue.id,
        from: context.previousStatus,
        to: context.optimisticStatus || context.issue.status,
      });
    },
    updateEstimate: () => {
      // TODO: Implement estimate update logic
      console.log('⏱️ Updating time estimates');
    },
  },
  actors: {
    updateIssueAPI: ({ context }) => {
      // Enhanced Effect.ts API integration
      const { issue, optimisticStatus } = context;

      if (!optimisticStatus) {
        return Promise.reject(new Error('No optimistic status set'));
      }

      // Simulate Effect.ts API call with proper error handling
      return new Promise<IssueStatus>((resolve, reject) => {
        // Add workflow validation
        const isValidTransition = context.validTransitions.includes(optimisticStatus);

        if (!isValidTransition) {
          reject(new Error(`Invalid transition: ${issue.status} → ${optimisticStatus}`));
          return;
        }

        // Simulate API call with realistic delay
        setTimeout(() => {
          // 90% success rate for demo
          if (Math.random() > 0.1) {
            console.log('✅ API Success: Issue status updated', {
              issueId: issue.id,
              from: issue.status,
              to: optimisticStatus,
              reason: context.transitionReason
            });
            resolve(optimisticStatus);
          } else {
            console.log('❌ API Error: Status update failed', {
              issueId: issue.id,
              attemptedTransition: `${issue.status} → ${optimisticStatus}`
            });
            reject(new Error('Network error: Failed to update issue status'));
          }
        }, 800); // Realistic API delay
      });
    },
  },
}).createMachine({
  id: 'issueStatus',
  initial: 'determineState',
  context: ({ input }: { input: { issue: Issue; workflowConfig?: WorkflowConfig } }) => ({
    issue: input.issue,
    isLoading: false,
    validTransitions: [],
    workflowConfig: input.workflowConfig || {
      requireAssigneeForStart: true,
      requireDescriptionForReview: true,
      allowDirectCompletion: false,
      autoCompleteThreshold: 5, // 5 minutes
      requireApprovalForCompletion: false,
      allowReopenFromDone: true,
    },
  }),
  states: {
    // Initial state determination
    determineState: {
      entry: ['updateValidTransitions'],
      always: [
        { guard: ({ context }) => context.issue.status === 'todo', target: 'todo' },
        { guard: ({ context }) => context.issue.status === 'in_progress', target: 'inProgress' },
        { guard: ({ context }) => context.issue.status === 'code_review', target: 'codeReview' },
        { guard: ({ context }) => context.issue.status === 'done', target: 'done' },
        { target: 'todo' }, // fallback
      ],
    },

    // TODO state - Issue is in backlog
    todo: {
      entry: ['updateValidTransitions'],
      on: {
        START_WORK: {
          guard: 'canStartWork',
          target: 'updatingToInProgress',
          actions: [
            { type: 'setOptimisticStatus', params: { status: 'in_progress' } },
            'logStatusChange',
          ],
        },
        COMPLETE: {
          // Allow direct completion for simple tasks
          guard: 'canDirectComplete',
          target: 'updatingToDone',
          actions: [
            { type: 'setOptimisticStatus', params: { status: 'done' } },
            'logStatusChange',
          ],
        },
      },
    },

    // IN PROGRESS state - Issue is being worked on
    inProgress: {
      entry: ['updateValidTransitions'],
      on: {
        SUBMIT_FOR_REVIEW: [
          {
            guard: 'canSkipReview',
            target: 'updatingToDone',
            actions: [
              { type: 'setOptimisticStatus', params: { status: 'done' } },
              'logStatusChange',
            ],
          },
          {
            guard: 'canSubmitForReview',
            target: 'updatingToReview',
            actions: [
              { type: 'setOptimisticStatus', params: { status: 'code_review' } },
              'logStatusChange',
              'notifyAssignee',
            ],
          },
        ],
        COMPLETE: [
          {
            guard: 'requiresApproval',
            target: 'updatingToReview',
            actions: [
              { type: 'setOptimisticStatus', params: { status: 'code_review' } },
              'logStatusChange',
            ],
          },
          {
            // Direct completion from in progress
            target: 'updatingToDone',
            actions: [
              { type: 'setOptimisticStatus', params: { status: 'done' } },
              'logStatusChange',
            ],
          },
        ],
        MOVE_TO_BACKLOG: {
          target: 'updatingToTodo',
          actions: [
            { type: 'setOptimisticStatus', params: { status: 'todo', reason: 'Moved back to backlog' } },
            'logStatusChange',
          ],
        },
      },
    },

    // CODE REVIEW state - Issue is under review
    codeReview: {
      entry: ['updateValidTransitions'],
      on: {
        APPROVE: {
          guard: 'canApprove',
          target: 'updatingToDone',
          actions: [
            { type: 'setOptimisticStatus', params: { status: 'done' } },
            'logStatusChange',
            'notifyAssignee',
          ],
        },
        REQUEST_CHANGES: {
          target: 'updatingToInProgress',
          actions: [
            { type: 'setOptimisticStatus', params: { status: 'in_progress', reason: 'Changes requested during review' } },
            'logStatusChange',
            'notifyAssignee',
          ],
        },
      },
    },

    // DONE state - Issue is completed
    done: {
      entry: ['updateValidTransitions'],
      on: {
        REOPEN: {
          guard: 'canReopen',
          target: 'updatingToInProgress',
          actions: [
            { type: 'setOptimisticStatus', params: { status: 'in_progress', reason: 'Issue reopened' } },
            'logStatusChange',
          ],
        },
      },
    },

    // Transition states for optimistic updates
    updatingToTodo: {
      invoke: {
        src: 'updateIssueAPI',
        onDone: {
          target: 'todo',
          actions: [
            { type: 'updateIssueStatus', params: { status: 'todo' } },
          ],
        },
        onError: {
          target: 'error',
          actions: [
            { type: 'setError', params: { error: 'Failed to move to backlog' } },
          ],
        },
      },
    },

    updatingToInProgress: {
      invoke: {
        src: 'updateIssueAPI',
        onDone: {
          target: 'inProgress',
          actions: [
            { type: 'updateIssueStatus', params: { status: 'in_progress' } },
          ],
        },
        onError: {
          target: 'error',
          actions: [
            { type: 'setError', params: { error: 'Failed to start work' } },
          ],
        },
      },
    },

    updatingToReview: {
      invoke: {
        src: 'updateIssueAPI',
        onDone: {
          target: 'codeReview',
          actions: [
            { type: 'updateIssueStatus', params: { status: 'code_review' } },
          ],
        },
        onError: {
          target: 'error',
          actions: [
            { type: 'setError', params: { error: 'Failed to submit for review' } },
          ],
        },
      },
    },

    updatingToDone: {
      invoke: {
        src: 'updateIssueAPI',
        onDone: {
          target: 'done',
          actions: [
            { type: 'updateIssueStatus', params: { status: 'done' } },
            'updateEstimate',
          ],
        },
        onError: {
          target: 'error',
          actions: [
            { type: 'setError', params: { error: 'Failed to complete issue' } },
          ],
        },
      },
    },

    // Error state with retry capability
    error: {
      on: {
        RETRY: {
          target: 'determineState',
          actions: ['rollbackStatus'],
        },
        CANCEL_OPTIMISTIC: {
          target: 'determineState',
          actions: ['rollbackStatus'],
        },
      },
    },
  },
});