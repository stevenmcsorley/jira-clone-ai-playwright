/**
 * Issue Status Utilities
 *
 * Utility functions and constants for working with issue statuses,
 * transitions, and business rules.
 */

import { IssueStatus, Issue, IssueType } from '../types/domain.types';

// Status transition rules - defines which transitions are allowed
export const STATUS_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  todo: ['in_progress', 'done'], // Can start work or complete directly (simple tasks)
  in_progress: ['todo', 'code_review', 'done'], // Can go back, submit for review, or complete
  code_review: ['in_progress', 'done'], // Can request changes or approve
  done: ['in_progress'], // Can reopen
};

// Business rules for status transitions
export const canTransitionTo = (
  fromStatus: IssueStatus,
  toStatus: IssueStatus,
  issue: Issue
): boolean => {
  // Check if transition is allowed in general
  if (!STATUS_TRANSITIONS[fromStatus].includes(toStatus)) {
    return false;
  }

  // Apply specific business rules
  switch (toStatus) {
    case 'in_progress':
      // Can only start work if assigned
      return fromStatus === 'todo' ? !!issue.assigneeId : true;

    case 'done':
      // Direct completion from todo only for simple tasks
      if (fromStatus === 'todo') {
        return issue.type === 'task' && (issue.estimate || 0) <= 1;
      }
      return true;

    case 'code_review':
      // Code review typically not needed for simple tasks or bugs
      if (issue.type === 'task' && (issue.estimate || 0) <= 2) {
        return false; // Should skip to done
      }
      return true;

    default:
      return true;
  }
};

// Get next logical status based on business rules
export const getNextLogicalStatus = (issue: Issue): IssueStatus | null => {
  switch (issue.status) {
    case 'todo':
      return issue.assigneeId ? 'in_progress' : null;

    case 'in_progress':
      // Simple tasks can skip review
      if (issue.type === 'task' && (issue.estimate || 0) <= 2) {
        return 'done';
      }
      return 'code_review';

    case 'code_review':
      return 'done';

    case 'done':
      return null; // No automatic next status

    default:
      return null;
  }
};

// Status priority for sorting (lower number = earlier in workflow)
export const STATUS_PRIORITY: Record<IssueStatus, number> = {
  todo: 1,
  in_progress: 2,
  code_review: 3,
  done: 4,
};

// Status colors for UI
export const STATUS_COLORS = {
  todo: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    hover: 'hover:bg-gray-200',
  },
  in_progress: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    hover: 'hover:bg-blue-200',
  },
  code_review: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-300',
    hover: 'hover:bg-yellow-200',
  },
  done: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
    hover: 'hover:bg-green-200',
  },
};

// Validation rules for different issue types
export const ISSUE_TYPE_RULES: Record<IssueType, {
  requiresReview: boolean;
  maxDirectCompleteEstimate: number;
  defaultStatus: IssueStatus;
}> = {
  task: {
    requiresReview: false,
    maxDirectCompleteEstimate: 2,
    defaultStatus: 'todo',
  },
  story: {
    requiresReview: true,
    maxDirectCompleteEstimate: 0,
    defaultStatus: 'todo',
  },
  bug: {
    requiresReview: false,
    maxDirectCompleteEstimate: 1,
    defaultStatus: 'todo',
  },
  epic: {
    requiresReview: false,
    maxDirectCompleteEstimate: 0,
    defaultStatus: 'todo',
  },
};

// Check if issue requires code review
export const requiresCodeReview = (issue: Issue): boolean => {
  const rules = ISSUE_TYPE_RULES[issue.type];

  if (!rules.requiresReview) {
    return false;
  }

  // Even stories might skip review if they're very small
  if (issue.type === 'story' && (issue.estimate || 0) <= 1) {
    return false;
  }

  return true;
};

// Get workflow progress percentage
export const getWorkflowProgress = (status: IssueStatus): number => {
  const progress = {
    todo: 0,
    in_progress: 33,
    code_review: 66,
    done: 100,
  };

  return progress[status];
};

// Format status for display
export const formatStatusForDisplay = (status: IssueStatus): string => {
  const formats = {
    todo: 'To Do',
    in_progress: 'In Progress',
    code_review: 'Code Review',
    done: 'Done',
  };

  return formats[status];
};

// Get all possible statuses in workflow order
export const getAllStatuses = (): IssueStatus[] => {
  return ['todo', 'in_progress', 'code_review', 'done'];
};

// Validate if a status transition makes business sense
export const validateTransition = (
  issue: Issue,
  fromStatus: IssueStatus,
  toStatus: IssueStatus
): { valid: boolean; reason?: string } => {
  if (!canTransitionTo(fromStatus, toStatus, issue)) {
    return {
      valid: false,
      reason: `Cannot transition from ${formatStatusForDisplay(fromStatus)} to ${formatStatusForDisplay(toStatus)}`,
    };
  }

  // Additional validations
  if (toStatus === 'in_progress' && !issue.assigneeId) {
    return {
      valid: false,
      reason: 'Issue must be assigned before starting work',
    };
  }

  if (toStatus === 'done' && fromStatus === 'todo' && issue.type !== 'task') {
    return {
      valid: false,
      reason: 'Non-task issues should go through proper workflow',
    };
  }

  return { valid: true };
};