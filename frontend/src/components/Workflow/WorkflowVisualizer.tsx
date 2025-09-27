/**
 * Workflow Visualizer Component
 *
 * Provides visual representation of the issue workflow state machine
 * and shows valid transitions for the current state.
 */

import React from 'react';
import { IssueStatus } from '../../types/domain.types';

interface WorkflowVisualizerProps {
  currentStatus: IssueStatus;
  validTransitions: IssueStatus[];
  onTransition?: (targetStatus: IssueStatus) => void;
  disabled?: boolean;
}

interface StatusNode {
  status: IssueStatus;
  label: string;
  color: string;
  icon: string;
}

const statusNodes: StatusNode[] = [
  { status: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-800', icon: '📋' },
  { status: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: '🔄' },
  { status: 'code_review', label: 'Code Review', color: 'bg-yellow-100 text-yellow-800', icon: '👁️' },
  { status: 'done', label: 'Done', color: 'bg-green-100 text-green-800', icon: '✅' },
];

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({
  currentStatus,
  validTransitions,
  onTransition,
  disabled = false,
}) => {
  const getNodeStyle = (status: IssueStatus) => {
    const node = statusNodes.find(n => n.status === status);
    const isCurrent = status === currentStatus;
    const isValidTransition = validTransitions.includes(status);

    let className = `inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 `;

    if (isCurrent) {
      className += `${node?.color} ring-2 ring-blue-500 ring-offset-2`;
    } else if (isValidTransition && !disabled) {
      className += `${node?.color} cursor-pointer hover:scale-105 hover:shadow-md border-2 border-dashed border-gray-300`;
    } else {
      className += `bg-gray-50 text-gray-400 border border-gray-200`;
    }

    return className;
  };

  const handleStatusClick = (status: IssueStatus) => {
    if (!disabled && validTransitions.includes(status) && onTransition) {
      onTransition(status);
    }
  };

  return (
    <div className="workflow-visualizer p-4 bg-white rounded-lg border border-gray-200">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Issue Workflow</h3>

      {/* Status Flow */}
      <div className="flex items-center justify-between space-x-2 mb-4">
        {statusNodes.map((node, index) => (
          <React.Fragment key={node.status}>
            <div
              className={getNodeStyle(node.status)}
              onClick={() => handleStatusClick(node.status)}
              title={`${node.label}${validTransitions.includes(node.status) ? ' (click to transition)' : ''}`}
            >
              <span className="mr-2">{node.icon}</span>
              <span>{node.label}</span>
            </div>

            {/* Arrow between nodes */}
            {index < statusNodes.length - 1 && (
              <div className="flex-1 h-px bg-gray-300 relative">
                <div className="absolute right-0 top-0 transform -translate-y-1/2">
                  <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Valid Transitions Info */}
      <div className="text-xs text-gray-500">
        <span className="font-medium">Valid transitions:</span>{' '}
        {validTransitions.length > 0 ? (
          validTransitions.map(status => {
            const node = statusNodes.find(n => n.status === status);
            return node?.label;
          }).join(', ')
        ) : (
          'None available'
        )}
      </div>

      {/* Current Status Detail */}
      <div className="mt-2 text-xs text-gray-600">
        <span className="font-medium">Current:</span>{' '}
        {statusNodes.find(n => n.status === currentStatus)?.label}
      </div>
    </div>
  );
};