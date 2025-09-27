/**
 * Issue Status Machine Demo Component
 *
 * Demonstrates the Issue Status State Machine in action.
 * This component can be used for testing and as an example
 * of how to integrate the state machine with UI components.
 */

import React from 'react';
import type { Issue, IssueStatus } from '../../types/domain.types';
import { useIssueStatus, getStatusDisplay } from '../../hooks/useIssueStatus';
import { STATUS_COLORS } from '../../lib/issue-status-utils';

interface IssueStatusMachineProps {
  issue: Issue;
  onStatusChange?: (issueId: number, newStatus: IssueStatus) => Promise<void>;
}

export const IssueStatusMachine: React.FC<IssueStatusMachineProps> = ({
  issue,
  onStatusChange,
}) => {
  const {
    status,
    isLoading,
    error,
    canStartWork,
    canSubmitForReview,
    canApprove,
    canRequestChanges,
    canComplete,
    canReopen,
    canMoveToBacklog,
    startWork,
    submitForReview,
    approve,
    requestChanges,
    complete,
    reopen,
    moveToBacklog,
    retry,
    isTransitioning,
    currentState,
  } = useIssueStatus({ issue, onStatusChange });

  const statusDisplay = getStatusDisplay(status);
  const statusColors = STATUS_COLORS[status as IssueStatus];

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{issue.title}</h3>
        <p className="text-sm text-gray-600">
          Type: {issue.type} | Estimate: {issue.estimate || 'None'} |
          Assignee: {issue.assignee?.name || 'Unassigned'}
        </p>
      </div>

      {/* Current Status */}
      <div className="mb-4">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors.bg} ${statusColors.text}`}>
          <span className="mr-2">{statusDisplay.icon}</span>
          {statusDisplay.label}
          {isTransitioning && (
            <span className="ml-2 animate-pulse">⏳</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">{statusDisplay.description}</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={retry}
            className="mt-2 text-red-600 underline text-sm hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Available Actions */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Available Actions:</h4>

        <div className="grid grid-cols-2 gap-2">
          {canStartWork && (
            <button
              onClick={startWork}
              disabled={isLoading}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 text-sm"
            >
              🚀 Start Work
            </button>
          )}

          {canSubmitForReview && (
            <button
              onClick={submitForReview}
              disabled={isLoading}
              className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 disabled:opacity-50 text-sm"
            >
              📋 Submit for Review
            </button>
          )}

          {canApprove && (
            <button
              onClick={approve}
              disabled={isLoading}
              className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 text-sm"
            >
              ✅ Approve
            </button>
          )}

          {canRequestChanges && (
            <button
              onClick={() => requestChanges('Needs improvement')}
              disabled={isLoading}
              className="px-3 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 disabled:opacity-50 text-sm"
            >
              📝 Request Changes
            </button>
          )}

          {canComplete && (
            <button
              onClick={complete}
              disabled={isLoading}
              className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50 text-sm"
            >
              🎉 Complete
            </button>
          )}

          {canReopen && (
            <button
              onClick={() => reopen('Found an issue')}
              disabled={isLoading}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 text-sm"
            >
              🔄 Reopen
            </button>
          )}

          {canMoveToBacklog && (
            <button
              onClick={moveToBacklog}
              disabled={isLoading}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 text-sm"
            >
              📦 Move to Backlog
            </button>
          )}
        </div>
      </div>

      {/* Debug Information */}
      <details className="mt-4">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
          Debug Info (Development)
        </summary>
        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
          {JSON.stringify({
            currentState,
            status,
            isLoading,
            isTransitioning,
            error: !!error,
          }, null, 2)}
        </pre>
      </details>
    </div>
  );
};