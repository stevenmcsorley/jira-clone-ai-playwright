/**
 * Dashboard State Machine
 *
 * Manages personalized dashboard with saved filters, widgets,
 * and real-time updates using XState and Effect.ts.
 */

import { setup, assign } from 'xstate';
import type { SearchQuery } from './search.machine';

export interface SavedFilter {
  id: number;
  name: string;
  description?: string;
  jql: string;
  query: SearchQuery;
  isPublic: boolean;
  isFavorite: boolean;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  category?: string;
  color?: string;
}

export interface DashboardWidget {
  id: string;
  type: 'filter-results' | 'recent-activity' | 'issue-stats' | 'sprint-progress' | 'velocity-chart';
  title: string;
  filterId?: number;
  configuration: {
    size: 'small' | 'medium' | 'large';
    position: { x: number; y: number; w: number; h: number };
    refreshInterval?: number;
    chartType?: 'bar' | 'line' | 'pie' | 'donut';
    timeRange?: 'week' | 'month' | 'quarter' | 'year';
    limit?: number;
  };
  data?: any;
  lastUpdated?: Date;
  isLoading?: boolean;
  error?: string;
}

export interface DashboardConfiguration {
  id: number;
  name: string;
  widgets: DashboardWidget[];
  layout: 'grid' | 'masonry' | 'fixed';
  isDefault: boolean;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardContext {
  currentDashboard: DashboardConfiguration | null;
  dashboards: DashboardConfiguration[];
  savedFilters: SavedFilter[];
  favoriteFilters: SavedFilter[];
  widgets: DashboardWidget[];
  isLoading: boolean;
  isEditMode: boolean;
  isConfiguring: boolean;
  error?: string;
  refreshingWidgets: Set<string>;
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number;
}

export type DashboardEvents =
  | { type: 'LOAD_DASHBOARD'; dashboardId?: number }
  | { type: 'CREATE_DASHBOARD'; name: string }
  | { type: 'UPDATE_DASHBOARD'; dashboard: Partial<DashboardConfiguration> }
  | { type: 'DELETE_DASHBOARD'; dashboardId: number }
  | { type: 'SWITCH_DASHBOARD'; dashboardId: number }
  | { type: 'ENTER_EDIT_MODE' }
  | { type: 'EXIT_EDIT_MODE' }
  | { type: 'SAVE_LAYOUT' }
  | { type: 'ADD_WIDGET'; widget: Omit<DashboardWidget, 'id' | 'data'> }
  | { type: 'UPDATE_WIDGET'; widgetId: string; updates: Partial<DashboardWidget> }
  | { type: 'REMOVE_WIDGET'; widgetId: string }
  | { type: 'REFRESH_WIDGET'; widgetId: string }
  | { type: 'REFRESH_ALL_WIDGETS' }
  | { type: 'SAVE_FILTER'; filter: Omit<SavedFilter, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_FILTER'; filterId: number; updates: Partial<SavedFilter> }
  | { type: 'DELETE_FILTER'; filterId: number }
  | { type: 'TOGGLE_FILTER_FAVORITE'; filterId: number }
  | { type: 'LOAD_SAVED_FILTERS' }
  | { type: 'API_SUCCESS'; data: any; operation: string }
  | { type: 'API_ERROR'; error: string; operation: string }
  | { type: 'ENABLE_AUTO_REFRESH' }
  | { type: 'DISABLE_AUTO_REFRESH' }
  | { type: 'CONFIGURE_WIDGET'; widgetId: string };

export const dashboardMachine = setup({
  types: {
    context: {} as DashboardContext,
    events: {} as DashboardEvents,
  },
  guards: {
    hasDashboard: ({ context }) => context.currentDashboard !== null,
    hasWidgets: ({ context }) => context.widgets.length > 0,
    isEditMode: ({ context }) => context.isEditMode,
    autoRefreshEnabled: ({ context }) => context.autoRefreshEnabled,
    canRefreshWidget: ({ context }, params: { widgetId: string }) => {
      return !context.refreshingWidgets.has(params.widgetId);
    },
  },
  actions: {
    // Loading states
    setLoading: assign({ isLoading: true, error: undefined }),
    clearLoading: assign({ isLoading: false }),
    setError: assign({
      error: (_, params: { error: string }) => params.error,
      isLoading: false,
    }),

    // Dashboard management
    setCurrentDashboard: assign({
      currentDashboard: (_, params: { dashboard: DashboardConfiguration }) => params.dashboard,
      widgets: (_, params: { dashboard: DashboardConfiguration }) => params.dashboard.widgets,
    }),
    updateDashboard: assign({
      currentDashboard: ({ context }, params: { updates: Partial<DashboardConfiguration> }) =>
        context.currentDashboard ? { ...context.currentDashboard, ...params.updates } : null,
    }),
    setDashboards: assign({
      dashboards: (_, params: { dashboards: DashboardConfiguration[] }) => params.dashboards,
    }),

    // Edit mode
    enterEditMode: assign({ isEditMode: true }),
    exitEditMode: assign({ isEditMode: false }),

    // Widget management
    addWidget: assign({
      widgets: ({ context }, params: { widget: DashboardWidget }) => [
        ...context.widgets,
        { ...params.widget, id: Date.now().toString() },
      ],
    }),
    updateWidget: assign({
      widgets: ({ context }, params: { widgetId: string; updates: Partial<DashboardWidget> }) =>
        context.widgets.map(w => w.id === params.widgetId ? { ...w, ...params.updates } : w),
    }),
    removeWidget: assign({
      widgets: ({ context }, params: { widgetId: string }) =>
        context.widgets.filter(w => w.id !== params.widgetId),
    }),
    setWidgetLoading: assign({
      widgets: ({ context }, params: { widgetId: string; isLoading: boolean }) =>
        context.widgets.map(w => w.id === params.widgetId ? { ...w, isLoading: params.isLoading } : w),
      refreshingWidgets: ({ context }, params: { widgetId: string; isLoading: boolean }) => {
        const refreshing = new Set(context.refreshingWidgets);
        if (params.isLoading) {
          refreshing.add(params.widgetId);
        } else {
          refreshing.delete(params.widgetId);
        }
        return refreshing;
      },
    }),
    setWidgetData: assign({
      widgets: ({ context }, params: { widgetId: string; data: any }) =>
        context.widgets.map(w =>
          w.id === params.widgetId
            ? { ...w, data: params.data, lastUpdated: new Date(), isLoading: false, error: undefined }
            : w
        ),
    }),
    setWidgetError: assign({
      widgets: ({ context }, params: { widgetId: string; error: string }) =>
        context.widgets.map(w =>
          w.id === params.widgetId
            ? { ...w, error: params.error, isLoading: false }
            : w
        ),
    }),

    // Filter management
    setSavedFilters: assign({
      savedFilters: (_, params: { filters: SavedFilter[] }) => params.filters,
      favoriteFilters: (_, params: { filters: SavedFilter[] }) =>
        params.filters.filter(f => f.isFavorite),
    }),
    addSavedFilter: assign({
      savedFilters: ({ context }, params: { filter: SavedFilter }) => [
        ...context.savedFilters,
        params.filter,
      ],
    }),
    updateSavedFilter: assign({
      savedFilters: ({ context }, params: { filterId: number; updates: Partial<SavedFilter> }) =>
        context.savedFilters.map(f => f.id === params.filterId ? { ...f, ...params.updates } : f),
      favoriteFilters: ({ context }, params: { filterId: number; updates: Partial<SavedFilter> }) =>
        context.favoriteFilters.map(f => f.id === params.filterId ? { ...f, ...params.updates } : f),
    }),
    removeSavedFilter: assign({
      savedFilters: ({ context }, params: { filterId: number }) =>
        context.savedFilters.filter(f => f.id !== params.filterId),
      favoriteFilters: ({ context }, params: { filterId: number }) =>
        context.favoriteFilters.filter(f => f.id !== params.filterId),
    }),

    // Auto-refresh
    enableAutoRefresh: assign({ autoRefreshEnabled: true }),
    disableAutoRefresh: assign({ autoRefreshEnabled: false }),

    // Side effects
    notifyDashboardLoaded: ({ context }) => {
      console.log('📊 Dashboard loaded:', context.currentDashboard?.name);
    },
    notifyWidgetRefreshed: (_, params: { widgetId: string; widgetType: string }) => {
      console.log('🔄 Widget refreshed:', params.widgetType, params.widgetId);
    },
    logFilterSaved: (_, params: { filterName: string }) => {
      console.log('💾 Filter saved:', params.filterName);
    },
  },
  actors: {
    loadDashboardAPI: ({ context }, params: { dashboardId?: number }) => {
      return new Promise<DashboardConfiguration>((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.1) {
            const mockDashboard = generateMockDashboard(params.dashboardId || 1);
            resolve(mockDashboard);
          } else {
            reject(new Error('Failed to load dashboard'));
          }
        }, 500);
      });
    },
    saveDashboardAPI: ({ context }) => {
      return new Promise<DashboardConfiguration>((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.1) {
            resolve(context.currentDashboard!);
          } else {
            reject(new Error('Failed to save dashboard'));
          }
        }, 300);
      });
    },
    loadSavedFiltersAPI: () => {
      return new Promise<SavedFilter[]>((resolve) => {
        setTimeout(() => {
          const mockFilters = generateMockSavedFilters();
          resolve(mockFilters);
        }, 400);
      });
    },
    refreshWidgetAPI: ({ context }, params: { widgetId: string }) => {
      return new Promise<any>((resolve, reject) => {
        setTimeout(() => {
          const widget = context.widgets.find(w => w.id === params.widgetId);
          if (widget && Math.random() > 0.1) {
            const mockData = generateMockWidgetData(widget.type);
            resolve(mockData);
          } else {
            reject(new Error('Failed to refresh widget'));
          }
        }, 800);
      });
    },
  },
}).createMachine({
  id: 'dashboard',
  initial: 'loading',
  context: {
    currentDashboard: null,
    dashboards: [],
    savedFilters: [],
    favoriteFilters: [],
    widgets: [],
    isLoading: false,
    isEditMode: false,
    isConfiguring: false,
    refreshingWidgets: new Set(),
    autoRefreshEnabled: true,
    autoRefreshInterval: 300000, // 5 minutes
  },
  states: {
    loading: {
      entry: ['setLoading'],
      invoke: [
        {
          src: 'loadDashboardAPI',
          input: { dashboardId: 1 },
          onDone: {
            target: 'loaded',
            actions: [
              'clearLoading',
              { type: 'setCurrentDashboard', params: ({ event }) => ({ dashboard: event.output }) },
              'notifyDashboardLoaded',
            ],
          },
          onError: {
            target: 'error',
            actions: [{ type: 'setError', params: { error: 'Failed to load dashboard' } }],
          },
        },
        {
          src: 'loadSavedFiltersAPI',
          onDone: {
            actions: [{ type: 'setSavedFilters', params: ({ event }) => ({ filters: event.output }) }],
          },
        },
      ],
    },

    loaded: {
      type: 'parallel',
      states: {
        editMode: {
          initial: 'viewing',
          states: {
            viewing: {
              on: {
                ENTER_EDIT_MODE: { target: 'editing' },
              },
            },
            editing: {
              entry: ['enterEditMode'],
              on: {
                EXIT_EDIT_MODE: { target: 'viewing' },
                SAVE_LAYOUT: { target: 'saving' },
                ADD_WIDGET: { actions: ['addWidget'] },
                UPDATE_WIDGET: { actions: ['updateWidget'] },
                REMOVE_WIDGET: { actions: ['removeWidget'] },
              },
            },
            saving: {
              entry: ['exitEditMode'],
              invoke: {
                src: 'saveDashboardAPI',
                onDone: { target: 'viewing' },
                onError: { target: 'editing' },
              },
            },
          },
        },

        autoRefresh: {
          initial: 'enabled',
          states: {
            enabled: {
              entry: ['enableAutoRefresh'],
              after: {
                300000: {
                  target: 'refreshing',
                  guard: 'autoRefreshEnabled',
                },
              },
              on: {
                DISABLE_AUTO_REFRESH: { target: 'disabled' },
                REFRESH_ALL_WIDGETS: { target: 'refreshing' },
              },
            },
            disabled: {
              entry: ['disableAutoRefresh'],
              on: {
                ENABLE_AUTO_REFRESH: { target: 'enabled' },
                REFRESH_ALL_WIDGETS: { target: 'refreshing' },
              },
            },
            refreshing: {
              entry: [
                ({ context }) => {
                  context.widgets.forEach(widget => {
                    // Trigger refresh for each widget
                    console.log('Refreshing widget:', widget.id);
                  });
                },
              ],
              after: {
                2000: [
                  { target: 'enabled', guard: 'autoRefreshEnabled' },
                  { target: 'disabled' },
                ],
              },
            },
          },
        },
      },

      on: {
        SWITCH_DASHBOARD: {
          target: 'loading',
          actions: ['setLoading'],
        },
        REFRESH_WIDGET: {
          actions: [
            { type: 'setWidgetLoading', params: ({ event }) => ({ widgetId: (event as any).widgetId, isLoading: true }) },
          ],
        },
        SAVE_FILTER: {
          actions: ['addSavedFilter', 'logFilterSaved'],
        },
        UPDATE_FILTER: {
          actions: ['updateSavedFilter'],
        },
        DELETE_FILTER: {
          actions: ['removeSavedFilter'],
        },
      },
    },

    error: {
      on: {
        LOAD_DASHBOARD: { target: 'loading' },
      },
    },
  },
});

// Mock data generators
function generateMockDashboard(id: number): DashboardConfiguration {
  return {
    id,
    name: 'My Dashboard',
    isDefault: true,
    userId: 1,
    layout: 'grid',
    createdAt: new Date(),
    updatedAt: new Date(),
    widgets: [
      {
        id: '1',
        type: 'filter-results',
        title: 'My Open Issues',
        filterId: 1,
        configuration: {
          size: 'medium',
          position: { x: 0, y: 0, w: 6, h: 4 },
          limit: 10,
        },
        data: null,
      },
      {
        id: '2',
        type: 'recent-activity',
        title: 'Recent Activity',
        configuration: {
          size: 'medium',
          position: { x: 6, y: 0, w: 6, h: 4 },
          limit: 5,
        },
        data: null,
      },
      {
        id: '3',
        type: 'sprint-progress',
        title: 'Current Sprint',
        configuration: {
          size: 'large',
          position: { x: 0, y: 4, w: 12, h: 3 },
        },
        data: null,
      },
    ],
  };
}

function generateMockSavedFilters(): SavedFilter[] {
  return [
    {
      id: 1,
      name: 'My Open Issues',
      description: 'Issues assigned to me that are not completed',
      jql: 'assignee = currentUser() AND status != Done',
      query: { jql: 'assignee = currentUser() AND status != Done', filters: {} },
      isPublic: false,
      isFavorite: true,
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: 'personal',
      color: 'blue',
    },
    {
      id: 2,
      name: 'High Priority Bugs',
      description: 'All high priority bugs in the project',
      jql: 'type = Bug AND priority = High',
      query: { jql: 'type = Bug AND priority = High', filters: {} },
      isPublic: true,
      isFavorite: false,
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: 'team',
      color: 'red',
    },
    {
      id: 3,
      name: 'Recently Updated',
      description: 'Issues updated in the last 7 days',
      jql: 'updated >= -7d',
      query: { jql: 'updated >= -7d', filters: {} },
      isPublic: false,
      isFavorite: true,
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: 'recent',
      color: 'green',
    },
  ];
}

function generateMockWidgetData(widgetType: string): any {
  switch (widgetType) {
    case 'filter-results':
      return {
        issues: Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          key: `JCD-${130 + i}`,
          title: `Sample Issue ${i + 1}`,
          status: ['todo', 'in_progress', 'done'][Math.floor(Math.random() * 3)],
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        })),
        total: 5,
      };
    case 'recent-activity':
      return {
        activities: Array.from({ length: 3 }, (_, i) => ({
          id: i + 1,
          action: ['created', 'updated', 'commented'][Math.floor(Math.random() * 3)],
          issue: `JCD-${140 + i}`,
          user: 'john',
          timestamp: new Date(Date.now() - i * 3600000),
        })),
      };
    case 'sprint-progress':
      return {
        name: 'Phase 3: Advanced Search & Filtering',
        completed: 2,
        total: 3,
        progress: 67,
        remaining: 1,
      };
    default:
      return {};
  }
}