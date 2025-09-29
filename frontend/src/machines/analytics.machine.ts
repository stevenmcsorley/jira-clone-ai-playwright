/**
 * Analytics State Machine
 *
 * Manages loading, caching, and real-time updates for velocity tracking,
 * burndown charts, and predictive analytics.
 */

import { setup, assign, fromPromise } from 'xstate';

// Types
export interface VelocityData {
  sprintId: number;
  sprintName: string;
  startDate: string;
  endDate: string;
  plannedPoints: number;
  completedPoints: number;
  velocity: number;
  issuesCompleted: number;
  issuesPlanned: number;
  completionRate: number;
}

export interface VelocityTrends {
  average3Sprints: number;
  average6Sprints: number;
  average12Sprints: number;
  currentTrend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  standardDeviation: number;
  confidenceInterval: [number, number];
}

export interface VelocityForecast {
  projectedVelocity: number;
  confidenceLevel: number;
  estimatedReleaseDate?: string;
  remainingSprintsForScope?: number;
  riskAssessment: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface TeamVelocityComparison {
  teamMember: {
    id: number;
    name: string;
    email: string;
  };
  individualVelocity: number;
  contributionPercentage: number;
  tasksCompleted: number;
  averageTaskSize: number;
  consistencyScore: number;
}

export interface BurndownData {
  date: string;
  remainingWork: number;
  idealRemaining: number;
  actualCompleted: number;
  idealCompleted: number;
}

export interface CycleTimeMetrics {
  averageCycleTime: number;
  medianCycleTime: number;
  cycleTimeByType: Record<string, number>;
  cycleTimeByPriority: Record<string, number>;
  cycleTimeTrend: Array<{
    period: string;
    averageCycleTime: number;
  }>;
}

export interface DashboardAnalytics {
  velocityTrends: VelocityTrends;
  velocityForecast: VelocityForecast;
  teamComparison: TeamVelocityComparison[];
  cycleTimeMetrics: CycleTimeMetrics;
  throughputMetrics: any;
  lastUpdated: string;
}

// Context for the analytics machine
export interface AnalyticsContext {
  // Project context
  projectId?: number;
  sprintId?: number;

  // Data state
  velocityData: VelocityData[];
  velocityTrends?: VelocityTrends;
  velocityForecast?: VelocityForecast;
  teamComparison: TeamVelocityComparison[];
  burndownData: BurndownData[];
  cycleTimeMetrics?: CycleTimeMetrics;
  dashboardAnalytics?: DashboardAnalytics;

  // Chart state
  selectedChart: 'velocity' | 'burndown' | 'team' | 'cycletime' | 'dashboard';
  chartTimeRange: '3' | '6' | '12' | 'all';
  chartInteractionState: 'idle' | 'hovering' | 'zooming' | 'filtering';

  // Cache and performance
  cacheTimestamp?: string;
  cacheExpiry: number; // minutes
  autoRefresh: boolean;
  refreshInterval: number; // milliseconds

  // UI state
  isLoading: boolean;
  isRefreshing: boolean;
  showForecast: boolean;
  showConfidenceIntervals: boolean;
  error?: string;

  // Real-time updates
  liveUpdatesEnabled: boolean;
  updateSubscription?: any;
  lastUpdateTimestamp?: string;

  // Export state
  exportFormat?: 'pdf' | 'excel' | 'csv';
  exportInProgress: boolean;
}

// Events
export type AnalyticsEvents =
  | { type: 'LOAD_ANALYTICS'; projectId: number; sprintId?: number }
  | { type: 'ANALYTICS_LOADED'; data: any }
  | { type: 'SELECT_CHART'; chartType: 'velocity' | 'burndown' | 'team' | 'cycletime' | 'dashboard' }
  | { type: 'CHANGE_TIME_RANGE'; range: '3' | '6' | '12' | 'all' }
  | { type: 'TOGGLE_FORECAST' }
  | { type: 'TOGGLE_CONFIDENCE_INTERVALS' }
  | { type: 'START_CHART_INTERACTION'; interactionType: 'hovering' | 'zooming' | 'filtering' }
  | { type: 'END_CHART_INTERACTION' }
  | { type: 'REFRESH_DATA' }
  | { type: 'ENABLE_AUTO_REFRESH' }
  | { type: 'DISABLE_AUTO_REFRESH' }
  | { type: 'TOGGLE_LIVE_UPDATES' }
  | { type: 'REAL_TIME_UPDATE'; data: any }
  | { type: 'CACHE_EXPIRED' }
  | { type: 'EXPORT_ANALYTICS'; format: 'pdf' | 'excel' | 'csv' }
  | { type: 'EXPORT_COMPLETE'; result: any }
  | { type: 'EXPORT_FAILED'; error: string }
  | { type: 'ERROR'; error: string }
  | { type: 'RETRY' }
  | { type: 'RESET' };

// Machine setup
export const analyticsMachine = setup({
  types: {
    context: {} as AnalyticsContext,
    events: {} as AnalyticsEvents,
    input: {} as { projectId: number; sprintId?: number; autoRefresh?: boolean },
  },

  guards: {
    hasProjectId: ({ context }) => !!context.projectId,
    isCacheValid: ({ context }) => {
      if (!context.cacheTimestamp) return false;
      const cacheTime = new Date(context.cacheTimestamp);
      const now = new Date();
      const diffMinutes = (now.getTime() - cacheTime.getTime()) / (1000 * 60);
      return diffMinutes < context.cacheExpiry;
    },
    isAutoRefreshEnabled: ({ context }) => context.autoRefresh,
    isLiveUpdatesEnabled: ({ context }) => context.liveUpdatesEnabled,
    shouldShowForecast: ({ context }) => context.showForecast,
    hasVelocityData: ({ context }) => context.velocityData.length > 0,
    isChartInteractionActive: ({ context }) => context.chartInteractionState !== 'idle',
  },

  actions: {
    // Data loading actions
    setProjectContext: assign({
      projectId: ({ input }) => input.projectId,
      sprintId: ({ input }) => input.sprintId,
      autoRefresh: ({ input }) => input.autoRefresh ?? true,
    }),

    setLoading: assign({ isLoading: true }),
    clearLoading: assign({ isLoading: false }),
    setRefreshing: assign({ isRefreshing: true }),
    clearRefreshing: assign({ isRefreshing: false }),

    // Data assignment actions
    setVelocityData: assign({
      velocityData: ({ event }, params: { data: VelocityData[] }) => params.data,
      cacheTimestamp: () => new Date().toISOString(),
    }),

    setVelocityTrends: assign({
      velocityTrends: ({ event }, params: { trends: VelocityTrends }) => params.trends,
    }),

    setVelocityForecast: assign({
      velocityForecast: ({ event }, params: { forecast: VelocityForecast }) => params.forecast,
    }),

    setTeamComparison: assign({
      teamComparison: ({ event }, params: { comparison: TeamVelocityComparison[] }) => params.comparison,
    }),

    setBurndownData: assign({
      burndownData: ({ event }, params: { data: BurndownData[] }) => params.data,
    }),

    setCycleTimeMetrics: assign({
      cycleTimeMetrics: ({ event }, params: { metrics: CycleTimeMetrics }) => params.metrics,
    }),

    setDashboardAnalytics: assign({
      dashboardAnalytics: ({ event }, params: { analytics: DashboardAnalytics }) => params.analytics,
      cacheTimestamp: () => new Date().toISOString(),
    }),

    // Chart interaction actions
    selectChart: assign({
      selectedChart: ({ event }, params: { chartType: string }) => params.chartType as any,
    }),

    changeTimeRange: assign({
      chartTimeRange: ({ event }, params: { range: string }) => params.range as any,
    }),

    toggleForecast: assign({
      showForecast: ({ context }) => !context.showForecast,
    }),

    toggleConfidenceIntervals: assign({
      showConfidenceIntervals: ({ context }) => !context.showConfidenceIntervals,
    }),

    startChartInteraction: assign({
      chartInteractionState: ({ event }, params: { interactionType: string }) => params.interactionType as any,
    }),

    endChartInteraction: assign({
      chartInteractionState: 'idle',
    }),

    // Refresh and caching actions
    enableAutoRefresh: assign({
      autoRefresh: true,
    }),

    disableAutoRefresh: assign({
      autoRefresh: false,
    }),

    toggleLiveUpdates: assign({
      liveUpdatesEnabled: ({ context }) => !context.liveUpdatesEnabled,
    }),

    updateCacheTimestamp: assign({
      cacheTimestamp: () => new Date().toISOString(),
    }),

    // Real-time update handling
    handleRealTimeUpdate: assign({
      lastUpdateTimestamp: () => new Date().toISOString(),
      // Would update specific data based on the update type
    }),

    // Export actions
    startExport: assign({
      exportFormat: ({ event }, params: { format: string }) => params.format as any,
      exportInProgress: true,
    }),

    completeExport: assign({
      exportInProgress: false,
      exportFormat: undefined,
    }),

    // Error handling
    setError: assign({
      error: ({ event }, params: { error: string }) => params.error,
      isLoading: false,
      isRefreshing: false,
    }),

    clearError: assign({
      error: undefined,
    }),

    // Reset actions
    resetAnalytics: assign({
      velocityData: [],
      velocityTrends: undefined,
      velocityForecast: undefined,
      teamComparison: [],
      burndownData: [],
      cycleTimeMetrics: undefined,
      dashboardAnalytics: undefined,
      cacheTimestamp: undefined,
      isLoading: false,
      isRefreshing: false,
      error: undefined,
    }),
  },

  actors: {
    // Load velocity data
    loadVelocityData: fromPromise(async ({ input }: {
      input: { projectId: number; sprintCount: number }
    }) => {
      const response = await fetch(`/api/analytics/velocity/${input.projectId}?sprintCount=${input.sprintCount}`);
      if (!response.ok) throw new Error('Failed to load velocity data');
      return response.json();
    }),

    // Load velocity trends
    loadVelocityTrends: fromPromise(async ({ input }: {
      input: { projectId: number }
    }) => {
      const response = await fetch(`/api/analytics/velocity/${input.projectId}/trends`);
      if (!response.ok) throw new Error('Failed to load velocity trends');
      return response.json();
    }),

    // Load velocity forecast
    loadVelocityForecast: fromPromise(async ({ input }: {
      input: { projectId: number; remainingStoryPoints?: number }
    }) => {
      let url = `/api/analytics/velocity/${input.projectId}/forecast`;
      if (input.remainingStoryPoints) {
        url += `?remainingStoryPoints=${input.remainingStoryPoints}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to load velocity forecast');
      return response.json();
    }),

    // Load team comparison
    loadTeamComparison: fromPromise(async ({ input }: {
      input: { projectId: number; sprintCount: number }
    }) => {
      const response = await fetch(`/api/analytics/velocity/${input.projectId}/team-comparison?sprintCount=${input.sprintCount}`);
      if (!response.ok) throw new Error('Failed to load team comparison');
      return response.json();
    }),

    // Load burndown data
    loadBurndownData: fromPromise(async ({ input }: {
      input: { sprintId: number }
    }) => {
      const response = await fetch(`/api/analytics/burndown/${input.sprintId}`);
      if (!response.ok) throw new Error('Failed to load burndown data');
      return response.json();
    }),

    // Load cycle time metrics
    loadCycleTimeMetrics: fromPromise(async ({ input }: {
      input: { projectId: number; sprintCount: number }
    }) => {
      const response = await fetch(`/api/analytics/cycle-time/${input.projectId}?sprintCount=${input.sprintCount}`);
      if (!response.ok) throw new Error('Failed to load cycle time metrics');
      return response.json();
    }),

    // Load dashboard analytics
    loadDashboardAnalytics: fromPromise(async ({ input }: {
      input: { projectId: number }
    }) => {
      const response = await fetch(`/api/analytics/dashboard/${input.projectId}`);
      if (!response.ok) throw new Error('Failed to load dashboard analytics');
      return response.json();
    }),

    // Export analytics
    exportAnalytics: fromPromise(async ({ input }: {
      input: { projectId: number; format: string; data: any }
    }) => {
      // This would generate and download the export
      // For now, we'll simulate the export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, filename: `analytics-${input.projectId}.${input.format}` };
    }),

    // Auto refresh timer
    autoRefreshTimer: fromPromise(async ({ input }: { input: { interval: number } }) => {
      return new Promise<void>((resolve) => {
        setTimeout(resolve, input.interval);
      });
    }),
  },
}).createMachine({
  id: 'analytics',
  initial: 'idle',

  context: ({ input }) => ({
    projectId: input.projectId,
    sprintId: input.sprintId,
    velocityData: [],
    teamComparison: [],
    burndownData: [],
    selectedChart: 'velocity' as const,
    chartTimeRange: '12' as const,
    chartInteractionState: 'idle' as const,
    cacheExpiry: 15, // 15 minutes
    autoRefresh: input.autoRefresh ?? true,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    isLoading: false,
    isRefreshing: false,
    showForecast: true,
    showConfidenceIntervals: true,
    liveUpdatesEnabled: false,
    exportInProgress: false,
  }),

  states: {
    idle: {
      entry: 'setProjectContext',
      on: {
        LOAD_ANALYTICS: {
          target: 'loading',
        },
      },
    },

    loading: {
      entry: 'setLoading',
      initial: 'dashboard',

      states: {
        dashboard: {
          invoke: {
            src: 'loadDashboardAnalytics',
            input: ({ context }) => ({ projectId: context.projectId! }),
            onDone: {
              target: 'complete',
              actions: [
                'clearLoading',
                { type: 'setDashboardAnalytics', params: ({ event }) => ({ analytics: event.output }) },
              ],
            },
            onError: {
              target: '#analytics.error',
              actions: { type: 'setError', params: ({ event }) => ({ error: event.error.message }) },
            },
          },
        },

        velocity: {
          invoke: [
            {
              src: 'loadVelocityData',
              input: ({ context }) => ({
                projectId: context.projectId!,
                sprintCount: parseInt(context.chartTimeRange)
              }),
              onDone: {
                actions: { type: 'setVelocityData', params: ({ event }) => ({ data: event.output }) },
              },
            },
            {
              src: 'loadVelocityTrends',
              input: ({ context }) => ({ projectId: context.projectId! }),
              onDone: {
                actions: { type: 'setVelocityTrends', params: ({ event }) => ({ trends: event.output }) },
              },
            },
            {
              src: 'loadVelocityForecast',
              input: ({ context }) => ({ projectId: context.projectId! }),
              onDone: {
                target: 'complete',
                actions: [
                  'clearLoading',
                  { type: 'setVelocityForecast', params: ({ event }) => ({ forecast: event.output }) },
                ],
              },
            },
          ],
          onError: {
            target: '#analytics.error',
            actions: { type: 'setError', params: ({ event }) => ({ error: event.error.message }) },
          },
        },

        burndown: {
          invoke: {
            src: 'loadBurndownData',
            input: ({ context }) => ({ sprintId: context.sprintId! }),
            onDone: {
              target: 'complete',
              actions: [
                'clearLoading',
                { type: 'setBurndownData', params: ({ event }) => ({ data: event.output }) },
              ],
            },
            onError: {
              target: '#analytics.error',
              actions: { type: 'setError', params: ({ event }) => ({ error: event.error.message }) },
            },
          },
        },

        team: {
          invoke: {
            src: 'loadTeamComparison',
            input: ({ context }) => ({
              projectId: context.projectId!,
              sprintCount: parseInt(context.chartTimeRange)
            }),
            onDone: {
              target: 'complete',
              actions: [
                'clearLoading',
                { type: 'setTeamComparison', params: ({ event }) => ({ comparison: event.output }) },
              ],
            },
            onError: {
              target: '#analytics.error',
              actions: { type: 'setError', params: ({ event }) => ({ error: event.error.message }) },
            },
          },
        },

        complete: {
          type: 'final',
        },
      },

      onDone: {
        target: 'loaded',
      },
    },

    loaded: {
      initial: 'displaying',

      states: {
        displaying: {
          on: {
            START_CHART_INTERACTION: {
              target: 'interacting',
              actions: { type: 'startChartInteraction', params: ({ event }) => ({ interactionType: event.interactionType }) },
            },
          },
        },

        interacting: {
          on: {
            END_CHART_INTERACTION: {
              target: 'displaying',
              actions: 'endChartInteraction',
            },
          },
        },

        refreshing: {
          entry: 'setRefreshing',
          // Similar loading logic but with refresh flag
          invoke: {
            src: 'loadDashboardAnalytics',
            input: ({ context }) => ({ projectId: context.projectId! }),
            onDone: {
              target: 'displaying',
              actions: [
                'clearRefreshing',
                { type: 'setDashboardAnalytics', params: ({ event }) => ({ analytics: event.output }) },
                'updateCacheTimestamp',
              ],
            },
            onError: {
              target: 'displaying',
              actions: ['clearRefreshing', { type: 'setError', params: ({ event }) => ({ error: event.error.message }) }],
            },
          },
        },

        exporting: {
          entry: { type: 'startExport', params: ({ event }) => ({ format: event.format }) },
          invoke: {
            src: 'exportAnalytics',
            input: ({ context, event }) => ({
              projectId: context.projectId!,
              format: event.format,
              data: context.dashboardAnalytics,
            }),
            onDone: {
              target: 'displaying',
              actions: ['completeExport'],
            },
            onError: {
              target: 'displaying',
              actions: ['completeExport', { type: 'setError', params: ({ event }) => ({ error: event.error.message }) }],
            },
          },
        },
      },

      on: {
        SELECT_CHART: {
          actions: { type: 'selectChart', params: ({ event }) => ({ chartType: event.chartType }) },
        },
        CHANGE_TIME_RANGE: {
          actions: { type: 'changeTimeRange', params: ({ event }) => ({ range: event.range }) },
          target: '.refreshing',
        },
        TOGGLE_FORECAST: {
          actions: 'toggleForecast',
        },
        TOGGLE_CONFIDENCE_INTERVALS: {
          actions: 'toggleConfidenceIntervals',
        },
        REFRESH_DATA: {
          target: '.refreshing',
        },
        EXPORT_ANALYTICS: {
          target: '.exporting',
        },
        ENABLE_AUTO_REFRESH: {
          actions: 'enableAutoRefresh',
        },
        DISABLE_AUTO_REFRESH: {
          actions: 'disableAutoRefresh',
        },
        TOGGLE_LIVE_UPDATES: {
          actions: 'toggleLiveUpdates',
        },
        REAL_TIME_UPDATE: {
          actions: 'handleRealTimeUpdate',
        },
      },

      // Auto refresh every 5 minutes if enabled
      invoke: {
        src: 'autoRefreshTimer',
        input: ({ context }) => ({ interval: context.refreshInterval }),
        onDone: [
          {
            guard: 'isAutoRefreshEnabled',
            target: '.refreshing',
            reenter: true,
          },
        ],
      },
    },

    error: {
      on: {
        RETRY: {
          target: 'loading',
          actions: 'clearError',
        },
        RESET: {
          target: 'idle',
          actions: ['clearError', 'resetAnalytics'],
        },
      },
    },
  },

  on: {
    ERROR: {
      target: '.error',
      actions: { type: 'setError', params: ({ event }) => ({ error: event.error }) },
    },
    CACHE_EXPIRED: [
      {
        guard: 'isAutoRefreshEnabled',
        target: '.loaded.refreshing',
      },
    ],
  },
});

// Helper function to create machine with input
export function createAnalyticsMachine(projectId: number, sprintId?: number, autoRefresh: boolean = true) {
  return analyticsMachine.provide({
    input: { projectId, sprintId, autoRefresh },
  });
}