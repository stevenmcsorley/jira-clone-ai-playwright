/**
 * XState Kanban Board Component
 *
 * Enhanced Kanban board using XState for state management and Effect.ts for data operations.
 * Features optimistic updates, conflict resolution, and real-time synchronization.
 */

import React, { useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useKanbanMachine } from '../../hooks/useKanbanMachine';
import { useIssueMetrics } from '../../hooks/useIssueMetrics';
import { useTimerManager } from '../../hooks/useTimerManager';
import { TimeTrackingService } from '../../services/api/time-tracking.service';
import { TimeProgressIndicator } from '../TimeProgressBar';
import type { Issue, IssueStatus } from '../../types/domain.types';

interface XStateKanbanProps {
  projectId: number;
  project: any;
  initialIssues?: Issue[];
  onIssueUpdate?: (issueId: number, updates: any) => void;
  className?: string;
}

// Enhanced Issue Card with XState integration
const XStateIssueCard = ({
  issue,
  isDragged,
  isOptimistic,
  onDragStart,
  onDragEnd,
  projectId
}: {
  issue: Issue;
  isDragged: boolean;
  isOptimistic: boolean;
  onDragStart: (issue: Issue) => void;
  onDragEnd: () => void;
  projectId: string;
}) => {
  const metrics = useIssueMetrics(issue.id);

  const priorityIcons = {
    low: { icon: '↓', color: 'text-green-600', bg: 'bg-green-50' },
    medium: { icon: '→', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    high: { icon: '↑', color: 'text-orange-600', bg: 'bg-orange-50' },
    urgent: { icon: '⇈', color: 'text-red-600', bg: 'bg-red-50' },
  };

  const formatRelativeTime = (dateString: Date) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        onDragStart(issue);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', issue.id.toString());
      }}
      onDragEnd={onDragEnd}
      className={`
        relative bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-3 cursor-grab active:cursor-grabbing
        hover:shadow-md transition-all select-none
        ${isDragged ? 'opacity-50 scale-95' : ''}
        ${isOptimistic ? 'ring-2 ring-blue-300 bg-blue-50' : ''}
      `}
      data-testid={`xstate-issue-card-${issue.id}`}
    >
      {/* Optimistic indicator */}
      {isOptimistic && (
        <div className="flex items-center gap-1 mb-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          Syncing...
        </div>
      )}

      {/* Title */}
      <Link to={`/projects/${projectId}/issues/${issue.id}`}>
        <h3 className="font-medium text-gray-900 mb-3 hover:text-blue-600 text-sm cursor-pointer">
          {issue.title}
        </h3>
      </Link>

      {/* Labels */}
      {issue.labels && issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {issue.labels.map((label, index) => (
            <span
              key={index}
              className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 font-medium"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Metrics Row */}
      {!metrics.loading && (
        <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
          {/* Subtask Progress */}
          {metrics.subtaskProgress && metrics.subtaskProgress.total > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-200 rounded-sm relative overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${metrics.subtaskProgress.percentage}%` }}
                />
              </div>
              <span>{metrics.subtaskProgress.completed}/{metrics.subtaskProgress.total}</span>
            </div>
          )}

          {/* Time Logged */}
          {metrics.timeSpent > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>{TimeTrackingService.formatTime(metrics.timeSpent)}</span>
            </div>
          )}

          {/* Comment Count */}
          {metrics.commentCount > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <span>{metrics.commentCount}</span>
            </div>
          )}

          {/* Last Updated */}
          <div className="flex items-center gap-1 ml-auto">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span>{formatRelativeTime(issue.updatedAt)}</span>
          </div>
        </div>
      )}

      {/* Bottom row with priority, task ID, story points, and assignee */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Priority indicator */}
          <div className={`w-4 h-4 flex items-center justify-center rounded ${priorityIcons[issue.priority].bg}`}>
            <span className={`text-xs font-bold ${priorityIcons[issue.priority].color}`}>
              {priorityIcons[issue.priority].icon}
            </span>
          </div>

          {/* Task ID */}
          <span className="text-xs font-medium text-gray-500">
            {issue.project?.key || 'TIS'}-{issue.id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Story Points */}
          {(issue.storyPoints !== null && issue.storyPoints !== undefined && issue.storyPoints !== '' && issue.storyPoints !== 0) ? (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
              📊 {issue.storyPoints}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-50 text-gray-500 rounded-full border border-dashed border-gray-300">
              📊 ?
            </span>
          )}

          {/* Assignee avatar */}
          {issue.assignee && (
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {issue.assignee.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Time Progress Indicator */}
      <TimeProgressIndicator issue={issue} />
    </div>
  );
};

// Enhanced Column with XState integration
const XStateColumn = ({
  title,
  status,
  issues,
  draggedIssue,
  optimisticUpdates,
  onDrop,
  onDragStart,
  onDragEnd,
  projectId,
  columnStats
}: {
  title: string;
  status: IssueStatus;
  issues: Issue[];
  draggedIssue: Issue | null;
  optimisticUpdates: Map<number, Issue>;
  onDrop: (status: IssueStatus, targetIndex?: number) => void;
  onDragStart: (issue: Issue) => void;
  onDragEnd: () => void;
  projectId: string;
  columnStats: { count: number; optimistic: number };
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [dropIndex, setDropIndex] = React.useState<number | null>(null);

  const config = {
    todo: { color: 'bg-gray-50', icon: '📋', borderColor: 'border-gray-300' },
    in_progress: { color: 'bg-blue-50', icon: '🚧', borderColor: 'border-blue-300' },
    code_review: { color: 'bg-purple-50', icon: '👁️', borderColor: 'border-purple-300' },
    done: { color: 'bg-green-50', icon: '✅', borderColor: 'border-green-300' },
  }[status];

  const handleDrop = useCallback((e: React.DragEvent, index?: number) => {
    e.preventDefault();
    setIsDragOver(false);
    setDropIndex(null);
    onDrop(status, index);
  }, [status, onDrop]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  return (
    <div className="flex-1" data-testid={`xstate-column-${status}`}>
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 px-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm text-gray-600 uppercase tracking-wide">
            {config.icon} {title}
          </h2>
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
            {columnStats.count}
          </span>
          {columnStats.optimistic > 0 && (
            <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-medium animate-pulse">
              +{columnStats.optimistic} syncing
            </span>
          )}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={`
          min-h-[500px] p-6 rounded-lg border-2 border-dashed transition-all
          ${config.color} ${config.borderColor}
          ${isDragOver ? 'border-blue-400 bg-blue-100 scale-102' : ''}
        `}
        onDrop={(e) => handleDrop(e)}
        onDragOver={handleDragOver}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX;
          const y = e.clientY;

          if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            setIsDragOver(false);
            setDropIndex(null);
          }
        }}
      >
        {/* Drop zone at the top */}
        <div
          className={`h-4 ${dropIndex === 0 ? 'bg-blue-200 rounded' : ''}`}
          onDrop={(e) => {
            e.stopPropagation();
            handleDrop(e, 0);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDropIndex(0);
          }}
        />

        {/* Issue Cards */}
        {issues.map((issue, index) => (
          <div key={issue.id} className="relative">
            <XStateIssueCard
              issue={issue}
              isDragged={draggedIssue?.id === issue.id}
              isOptimistic={optimisticUpdates.has(issue.id)}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              projectId={projectId}
            />

            {/* Drop zone after each card */}
            <div
              className={`h-4 ${dropIndex === index + 1 ? 'bg-blue-200 rounded' : ''}`}
              onDrop={(e) => {
                e.stopPropagation();
                handleDrop(e, index + 1);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDropIndex(index + 1);
              }}
            />
          </div>
        ))}

        {/* Empty state */}
        {issues.length === 0 && !isDragOver && (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <div className="text-center">
              <div className="text-2xl mb-2">{config.icon}</div>
              <p className="text-sm">Drop issues here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const XStateKanban: React.FC<XStateKanbanProps> = ({
  projectId,
  project,
  initialIssues = [],
  onIssueUpdate,
  className = ''
}) => {
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const projectIdStr = urlProjectId || projectId.toString();

  // Initialize XState Kanban machine
  const {
    issuesByStatus,
    draggedIssue,
    isDragging,
    isLoading,
    isUpdating,
    isSyncing,
    error,
    hasError,
    hasOptimisticUpdates,
    optimisticUpdates,
    conflicts,
    hasConflicts,
    lastSync,
    columnStats,
    startDrag,
    endDrag,
    dropIssue,
    syncNow,
    resolveConflict,
    clearError,
    machine
  } = useKanbanMachine({
    projectId,
    initialIssues,
    enableSync: true,
    syncInterval: 60000
  });

  // Timer manager for automatic time tracking
  const { handleIssueStatusChange } = useTimerManager();

  // Enhanced drop function that integrates timer tracking
  const enhancedDropIssue = useCallback(async (targetStatus: IssueStatus, targetIndex?: number) => {
    const draggedIssue = machine.context.draggedIssue;
    if (!draggedIssue) return;

    // Trigger timer status change
    handleIssueStatusChange(draggedIssue.id, targetStatus, draggedIssue.estimate);

    // Perform the actual drop operation
    await dropIssue(targetStatus, targetIndex);
  }, [dropIssue, handleIssueStatusChange, machine.context.draggedIssue]);

  // Handle external issue updates (from props)
  useEffect(() => {
    if (onIssueUpdate && hasOptimisticUpdates) {
      // Sync with parent component if needed
    }
  }, [onIssueUpdate, hasOptimisticUpdates]);

  // Log state machine transitions in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎰 Kanban State:', machine.currentState, machine.context);
    }
  }, [machine.currentState, machine.context]);

  return (
    <div className={`${className}`} data-testid="xstate-kanban">
      {/* Project Header with State Information */}
      <div className="mb-6" data-testid="xstate-project-header">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold" data-testid="project-name">{project.name}</h1>
          <div className="flex items-center gap-3 text-sm">
            {/* Sync Status */}
            {isSyncing && (
              <div className="flex items-center gap-1 text-blue-600">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                Syncing...
              </div>
            )}
            {lastSync && (
              <div className="text-gray-500">
                Last sync: {lastSync.toLocaleTimeString()}
              </div>
            )}
            <button
              onClick={syncNow}
              className="text-gray-600 hover:text-blue-600 p-1 rounded"
              title="Sync now"
            >
              🔄
            </button>
          </div>
        </div>
        <p className="text-gray-600" data-testid="project-description">{project.description}</p>
      </div>

      {/* Error Banner */}
      {hasError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Conflicts Banner */}
      {hasConflicts && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-yellow-600">
              <p className="text-sm font-medium">
                {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} detected
              </p>
              <p className="text-xs mt-1">
                Other users have made changes to issues you're editing.
              </p>
            </div>
            <div className="flex gap-2">
              {conflicts.map(issue => (
                <div key={issue.id} className="flex gap-1">
                  <button
                    onClick={() => resolveConflict(issue.id, 'local')}
                    className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded"
                  >
                    Keep mine
                  </button>
                  <button
                    onClick={() => resolveConflict(issue.id, 'remote')}
                    className="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded"
                  >
                    Use theirs
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading board...</p>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {!isLoading && (
        <div className="grid grid-cols-4 gap-6" data-testid="xstate-kanban-columns">
          <XStateColumn
            title="To Do"
            status="todo"
            issues={issuesByStatus.todo}
            draggedIssue={draggedIssue}
            optimisticUpdates={optimisticUpdates}
            onDrop={enhancedDropIssue}
            onDragStart={startDrag}
            onDragEnd={endDrag}
            projectId={projectIdStr}
            columnStats={columnStats.todo}
          />
          <XStateColumn
            title="In Progress"
            status="in_progress"
            issues={issuesByStatus.in_progress}
            draggedIssue={draggedIssue}
            optimisticUpdates={optimisticUpdates}
            onDrop={enhancedDropIssue}
            onDragStart={startDrag}
            onDragEnd={endDrag}
            projectId={projectIdStr}
            columnStats={columnStats.in_progress}
          />
          <XStateColumn
            title="Code Review"
            status="code_review"
            issues={issuesByStatus.code_review}
            draggedIssue={draggedIssue}
            optimisticUpdates={optimisticUpdates}
            onDrop={enhancedDropIssue}
            onDragStart={startDrag}
            onDragEnd={endDrag}
            projectId={projectIdStr}
            columnStats={columnStats.code_review}
          />
          <XStateColumn
            title="Done"
            status="done"
            issues={issuesByStatus.done}
            draggedIssue={draggedIssue}
            optimisticUpdates={optimisticUpdates}
            onDrop={enhancedDropIssue}
            onDragStart={startDrag}
            onDragEnd={endDrag}
            projectId={projectIdStr}
            columnStats={columnStats.done}
          />
        </div>
      )}

      {/* Debug Info (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-3 bg-gray-100 rounded text-xs">
          <strong>XState Debug:</strong> State: {String(machine.currentState)},
          Optimistic: {optimisticUpdates.size},
          Conflicts: {conflicts.length}
        </div>
      )}
    </div>
  );
};