/**
 * Dashboard Component
 *
 * Personalized dashboard with drag-and-drop widgets, saved filters,
 * and real-time updates using XState dashboard machine.
 */

import React, { useState } from 'react';
import { useMachine } from '@xstate/react';
import { dashboardMachine } from '../../machines/dashboard.machine';
import type { DashboardWidget, SavedFilter } from '../../machines/dashboard.machine';

interface DashboardProps {
  className?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ className = '' }) => {
  const [state, send] = useMachine(dashboardMachine);
  const [selectedFilterId, setSelectedFilterId] = useState<number | null>(null);

  const handleAddWidget = (type: DashboardWidget['type']) => {
    const newWidget: Omit<DashboardWidget, 'id' | 'data'> = {
      type,
      title: getWidgetTitle(type),
      filterId: selectedFilterId || undefined,
      configuration: {
        size: 'medium',
        position: { x: 0, y: 0, w: 6, h: 4 },
        refreshInterval: 300000, // 5 minutes
      },
    };

    send({ type: 'ADD_WIDGET', widget: newWidget });
  };

  const handleRefreshWidget = (widgetId: string) => {
    send({ type: 'REFRESH_WIDGET', widgetId });
  };

  const handleRemoveWidget = (widgetId: string) => {
    send({ type: 'REMOVE_WIDGET', widgetId });
  };

  const handleSaveFilter = (filter: Omit<SavedFilter, 'id' | 'createdAt' | 'updatedAt'>) => {
    send({ type: 'SAVE_FILTER', filter });
  };

  const getWidgetTitle = (type: DashboardWidget['type']): string => {
    switch (type) {
      case 'filter-results': return 'Filter Results';
      case 'recent-activity': return 'Recent Activity';
      case 'issue-stats': return 'Issue Statistics';
      case 'sprint-progress': return 'Sprint Progress';
      case 'velocity-chart': return 'Velocity Chart';
      default: return 'Widget';
    }
  };

  const renderWidget = (widget: DashboardWidget) => {
    return (
      <div
        key={widget.id}
        className={`
          bg-white rounded-lg border border-gray-200 shadow-sm
          ${widget.configuration.size === 'small' ? 'h-32' : ''}
          ${widget.configuration.size === 'medium' ? 'h-64' : ''}
          ${widget.configuration.size === 'large' ? 'h-96' : ''}
        `}
      >
        {/* Widget Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-900">{widget.title}</h3>
          <div className="flex items-center space-x-2">
            {widget.isLoading && (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            )}
            <button
              onClick={() => handleRefreshWidget(widget.id)}
              disabled={widget.isLoading}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              title="Refresh widget"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {state.context.isEditMode && (
              <button
                onClick={() => handleRemoveWidget(widget.id)}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Remove widget"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Widget Content */}
        <div className="p-4">
          {widget.error ? (
            <div className="text-center py-8">
              <div className="text-red-500 text-sm mb-2">Failed to load widget</div>
              <button
                onClick={() => handleRefreshWidget(widget.id)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Try again
              </button>
            </div>
          ) : widget.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            renderWidgetContent(widget)
          )}
        </div>
      </div>
    );
  };

  const renderWidgetContent = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'filter-results':
        return renderFilterResultsWidget(widget);
      case 'recent-activity':
        return renderRecentActivityWidget(widget);
      case 'sprint-progress':
        return renderSprintProgressWidget(widget);
      case 'issue-stats':
        return renderIssueStatsWidget(widget);
      default:
        return <div className="text-gray-500 text-sm">Widget content not implemented</div>;
    }
  };

  const renderFilterResultsWidget = (widget: DashboardWidget) => {
    const data = widget.data;
    if (!data || !data.issues) {
      return <div className="text-gray-500 text-sm">No data available</div>;
    }

    return (
      <div className="space-y-2">
        {data.issues.slice(0, widget.configuration.limit || 10).map((issue: any) => (
          <div key={issue.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-blue-600">{issue.key}</span>
              <span className="text-sm text-gray-900 truncate">{issue.title}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`
                text-xs px-2 py-1 rounded-full
                ${issue.status === 'done' ? 'bg-green-100 text-green-800' : ''}
                ${issue.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${issue.status === 'todo' ? 'bg-gray-100 text-gray-800' : ''}
              `}>
                {issue.status.replace('_', ' ')}
              </span>
              <span className={`
                text-xs px-2 py-1 rounded-full
                ${issue.priority === 'high' ? 'bg-red-100 text-red-800' : ''}
                ${issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${issue.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
              `}>
                {issue.priority}
              </span>
            </div>
          </div>
        ))}
        {data.total > (widget.configuration.limit || 10) && (
          <div className="text-center pt-2">
            <span className="text-xs text-gray-500">
              Showing {widget.configuration.limit || 10} of {data.total} issues
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderRecentActivityWidget = (widget: DashboardWidget) => {
    const data = widget.data;
    if (!data || !data.activities) {
      return <div className="text-gray-500 text-sm">No recent activity</div>;
    }

    return (
      <div className="space-y-3">
        {data.activities.map((activity: any) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.user}</span>
                {' '}
                <span className="text-gray-600">{activity.action}</span>
                {' '}
                <span className="font-medium">{activity.issue}</span>
              </p>
              <p className="text-xs text-gray-500">
                {new Date(activity.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSprintProgressWidget = (widget: DashboardWidget) => {
    const data = widget.data;
    if (!data) {
      return <div className="text-gray-500 text-sm">No sprint data</div>;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">{data.name}</h4>
          <span className="text-sm text-gray-500">{data.progress}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${data.progress}%` }}
          ></div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-green-600">{data.completed}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-600">{data.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-orange-600">{data.remaining}</div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
        </div>
      </div>
    );
  };

  const renderIssueStatsWidget = (widget: DashboardWidget) => {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded">
          <div className="text-2xl font-bold text-blue-600">24</div>
          <div className="text-xs text-gray-600">Open Issues</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded">
          <div className="text-2xl font-bold text-green-600">12</div>
          <div className="text-xs text-gray-600">Completed</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded">
          <div className="text-2xl font-bold text-yellow-600">8</div>
          <div className="text-xs text-gray-600">In Progress</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded">
          <div className="text-2xl font-bold text-red-600">3</div>
          <div className="text-xs text-gray-600">Blocked</div>
        </div>
      </div>
    );
  };

  const renderSavedFilters = () => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-900">Saved Filters</h3>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {state.context.favoriteFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilterId(filter.id)}
                className={`
                  w-full text-left p-2 rounded hover:bg-gray-50 transition-colors
                  ${selectedFilterId === filter.id ? 'bg-blue-50 border border-blue-200' : ''}
                `}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: filter.color || '#3B82F6' }}
                  ></div>
                  <span className="text-sm font-medium text-gray-900">{filter.name}</span>
                  {filter.isFavorite && (
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                </div>
                {filter.description && (
                  <p className="text-xs text-gray-500 mt-1">{filter.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (state.matches('loading')) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (state.matches('error')) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-500 mb-2">Failed to load dashboard</div>
        <button
          onClick={() => send({ type: 'LOAD_DASHBOARD' })}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {state.context.currentDashboard?.name || 'Dashboard'}
        </h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => send({ type: 'REFRESH_ALL_WIDGETS' })}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Refresh All
          </button>
          <button
            onClick={() => send(state.context.isEditMode ? { type: 'EXIT_EDIT_MODE' } : { type: 'ENTER_EDIT_MODE' })}
            className={`
              px-3 py-2 text-sm rounded transition-colors
              ${state.context.isEditMode
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {state.context.isEditMode ? 'Done Editing' : 'Edit Dashboard'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="col-span-3 space-y-6">
          {renderSavedFilters()}

          {/* Widget Library (Edit Mode) */}
          {state.context.isEditMode && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-900">Add Widget</h3>
              </div>
              <div className="p-4 space-y-2">
                {(['filter-results', 'recent-activity', 'issue-stats', 'sprint-progress', 'velocity-chart'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => handleAddWidget(type)}
                    className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded transition-colors"
                  >
                    {getWidgetTitle(type)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          {state.context.widgets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets configured</h3>
              <p className="text-gray-500 mb-4">Add widgets to personalize your dashboard</p>
              <button
                onClick={() => send({ type: 'ENTER_EDIT_MODE' })}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Widgets
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {state.context.widgets.map(renderWidget)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};