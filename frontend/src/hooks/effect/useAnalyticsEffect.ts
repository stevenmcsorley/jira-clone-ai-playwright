/**
 * Analytics Effect.ts React Hooks
 *
 * Enhanced hooks for velocity tracking, burndown charts, and predictive analytics
 * with caching, real-time updates, and optimistic UI updates
 */

import { useMemo, useCallback } from 'react';
import { Effect } from 'effect';
import { useEffectHook, useAsyncEffect } from './useEffect';
import type { ApiError } from '../../lib/effect-config';

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

/**
 * Hook for fetching velocity data with caching
 */
export const useVelocityDataEffect = (projectId?: number, sprintCount: number = 12) => {
  const fetchEffect = useMemo(() => {
    if (projectId === undefined) {
      return Effect.succeed([]);
    }

    return Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/analytics/velocity/${projectId}?sprintCount=${sprintCount}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      catch: (error) => new Error(`Failed to fetch velocity data: ${String(error)}`)
    }) as Effect.Effect<VelocityData[], ApiError, never>;
  }, [projectId, sprintCount]);

  const {
    data: velocityData,
    loading,
    error,
    refetch
  } = useEffectHook<VelocityData[]>(fetchEffect, {
    initialData: [],
    dependencies: [projectId, sprintCount],
    immediate: projectId !== undefined,
    // Cache for 5 minutes
    cacheKey: `velocity-${projectId}-${sprintCount}`,
    cacheTTL: 5 * 60 * 1000,
  });

  return {
    velocityData: velocityData || [],
    loading,
    error,
    refetch
  };
};

/**
 * Hook for fetching velocity trends
 */
export const useVelocityTrendsEffect = (projectId?: number) => {
  const fetchEffect = useMemo(() => {
    if (projectId === undefined) {
      return Effect.succeed(null);
    }

    return Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/analytics/velocity/${projectId}/trends`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      catch: (error) => new Error(`Failed to fetch velocity trends: ${String(error)}`)
    }) as Effect.Effect<VelocityTrends | null, ApiError, never>;
  }, [projectId]);

  const {
    data: velocityTrends,
    loading,
    error,
    refetch
  } = useEffectHook<VelocityTrends | null>(fetchEffect, {
    initialData: null,
    dependencies: [projectId],
    immediate: projectId !== undefined,
    cacheKey: `velocity-trends-${projectId}`,
    cacheTTL: 10 * 60 * 1000, // Cache for 10 minutes
  });

  return {
    velocityTrends,
    loading,
    error,
    refetch
  };
};

/**
 * Hook for fetching velocity forecast
 */
export const useVelocityForecastEffect = (projectId?: number, remainingStoryPoints?: number) => {
  const fetchEffect = useMemo(() => {
    if (projectId === undefined) {
      return Effect.succeed(null);
    }

    return Effect.tryPromise({
      try: async () => {
        let url = `/api/analytics/velocity/${projectId}/forecast`;
        if (remainingStoryPoints) {
          url += `?remainingStoryPoints=${remainingStoryPoints}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      catch: (error) => new Error(`Failed to fetch velocity forecast: ${String(error)}`)
    }) as Effect.Effect<VelocityForecast | null, ApiError, never>;
  }, [projectId, remainingStoryPoints]);

  const {
    data: velocityForecast,
    loading,
    error,
    refetch
  } = useEffectHook<VelocityForecast | null>(fetchEffect, {
    initialData: null,
    dependencies: [projectId, remainingStoryPoints],
    immediate: projectId !== undefined,
    cacheKey: `velocity-forecast-${projectId}-${remainingStoryPoints}`,
    cacheTTL: 15 * 60 * 1000, // Cache for 15 minutes
  });

  return {
    velocityForecast,
    loading,
    error,
    refetch
  };
};

/**
 * Hook for fetching team velocity comparison
 */
export const useTeamVelocityComparisonEffect = (projectId?: number, sprintCount: number = 6) => {
  const fetchEffect = useMemo(() => {
    if (projectId === undefined) {
      return Effect.succeed([]);
    }

    return Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/analytics/velocity/${projectId}/team-comparison?sprintCount=${sprintCount}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      catch: (error) => new Error(`Failed to fetch team comparison: ${String(error)}`)
    }) as Effect.Effect<TeamVelocityComparison[], ApiError, never>;
  }, [projectId, sprintCount]);

  const {
    data: teamComparison,
    loading,
    error,
    refetch
  } = useEffectHook<TeamVelocityComparison[]>(fetchEffect, {
    initialData: [],
    dependencies: [projectId, sprintCount],
    immediate: projectId !== undefined,
    cacheKey: `team-comparison-${projectId}-${sprintCount}`,
    cacheTTL: 10 * 60 * 1000,
  });

  return {
    teamComparison: teamComparison || [],
    loading,
    error,
    refetch
  };
};

/**
 * Hook for fetching burndown chart data
 */
export const useBurndownDataEffect = (sprintId?: number) => {
  const fetchEffect = useMemo(() => {
    if (sprintId === undefined) {
      return Effect.succeed([]);
    }

    return Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/analytics/burndown/${sprintId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      catch: (error) => new Error(`Failed to fetch burndown data: ${String(error)}`)
    }) as Effect.Effect<BurndownData[], ApiError, never>;
  }, [sprintId]);

  const {
    data: burndownData,
    loading,
    error,
    refetch
  } = useEffectHook<BurndownData[]>(fetchEffect, {
    initialData: [],
    dependencies: [sprintId],
    immediate: sprintId !== undefined,
    cacheKey: `burndown-${sprintId}`,
    cacheTTL: 5 * 60 * 1000, // Cache for 5 minutes (more frequent updates for active sprints)
  });

  return {
    burndownData: burndownData || [],
    loading,
    error,
    refetch
  };
};

/**
 * Hook for fetching cycle time metrics
 */
export const useCycleTimeMetricsEffect = (projectId?: number, sprintCount: number = 6) => {
  const fetchEffect = useMemo(() => {
    if (projectId === undefined) {
      return Effect.succeed(null);
    }

    return Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/analytics/cycle-time/${projectId}?sprintCount=${sprintCount}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      catch: (error) => new Error(`Failed to fetch cycle time metrics: ${String(error)}`)
    }) as Effect.Effect<CycleTimeMetrics | null, ApiError, never>;
  }, [projectId, sprintCount]);

  const {
    data: cycleTimeMetrics,
    loading,
    error,
    refetch
  } = useEffectHook<CycleTimeMetrics | null>(fetchEffect, {
    initialData: null,
    dependencies: [projectId, sprintCount],
    immediate: projectId !== undefined,
    cacheKey: `cycle-time-${projectId}-${sprintCount}`,
    cacheTTL: 15 * 60 * 1000,
  });

  return {
    cycleTimeMetrics,
    loading,
    error,
    refetch
  };
};

/**
 * Hook for fetching comprehensive dashboard analytics
 */
export const useDashboardAnalyticsEffect = (projectId?: number) => {
  const fetchEffect = useMemo(() => {
    if (projectId === undefined) {
      return Effect.succeed(null);
    }

    return Effect.tryPromise({
      try: async () => {
        const response = await fetch(`/api/analytics/dashboard/${projectId}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      catch: (error) => new Error(`Failed to fetch dashboard analytics: ${String(error)}`)
    }) as Effect.Effect<any, ApiError, never>;
  }, [projectId]);

  const {
    data: dashboardAnalytics,
    loading,
    error,
    refetch
  } = useEffectHook<any>(fetchEffect, {
    initialData: null,
    dependencies: [projectId],
    immediate: projectId !== undefined,
    cacheKey: `dashboard-${projectId}`,
    cacheTTL: 10 * 60 * 1000,
  });

  return {
    dashboardAnalytics,
    loading,
    error,
    refetch
  };
};

/**
 * Hook for analytics data export
 */
export const useAnalyticsExportEffect = () => {
  const { execute: exportAnalytics, ...state } = useAsyncEffect((
    projectId: number,
    format: 'pdf' | 'excel' | 'csv',
    data: any
  ) => {
    return Effect.tryPromise({
      try: async () => {
        // For now, simulate export process
        // In production, this would generate and download the file
        await new Promise(resolve => setTimeout(resolve, 2000));

        const filename = `analytics-${projectId}-${new Date().toISOString().split('T')[0]}.${format}`;

        // Create download
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: format === 'csv' ? 'text/csv' : 'application/json'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return { success: true, filename };
      },
      catch: (error) => new Error(`Export failed: ${String(error)}`)
    }) as Effect.Effect<{ success: boolean; filename: string }, ApiError, never>;
  });

  return {
    exportAnalytics,
    isExporting: state.loading,
    exportError: state.error,
    exportResult: state.data,
  };
};

/**
 * Hook for real-time analytics updates
 */
export const useRealTimeAnalyticsEffect = (projectId: number, enabled: boolean = false) => {
  const { execute: startRealTimeUpdates, ...state } = useAsyncEffect((
    projectId: number,
    onUpdate: (data: any) => void
  ) => {
    return Effect.tryPromise({
      try: async () => {
        // Simulate real-time updates with polling
        // In production, this would use WebSockets
        const interval = setInterval(async () => {
          try {
            const response = await fetch(`/api/analytics/dashboard/${projectId}`);
            if (response.ok) {
              const data = await response.json();
              onUpdate(data);
            }
          } catch (error) {
            console.warn('Real-time update failed:', error);
          }
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
      },
      catch: (error) => new Error(`Real-time updates failed: ${String(error)}`)
    }) as Effect.Effect<() => void, ApiError, never>;
  });

  return {
    startRealTimeUpdates,
    stopRealTimeUpdates: state.data,
    isRealTimeActive: state.loading,
    realTimeError: state.error,
  };
};

/**
 * Hook for velocity prediction calculations
 */
export const useVelocityPredictionEffect = () => {
  const calculatePrediction = useCallback((
    velocityHistory: number[],
    confidenceLevel: number = 80
  ): {
    prediction: number;
    range: [number, number];
    confidence: number;
  } => {
    if (velocityHistory.length === 0) {
      return { prediction: 0, range: [0, 0], confidence: 0 };
    }

    // Simple prediction based on weighted average (recent data weighted more)
    const weights = velocityHistory.map((_, index) => Math.pow(1.2, index));
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);

    const weightedAverage = velocityHistory.reduce((sum, velocity, index) => {
      return sum + (velocity * weights[index]);
    }, 0) / weightSum;

    // Calculate standard deviation for confidence range
    const mean = velocityHistory.reduce((sum, v) => sum + v, 0) / velocityHistory.length;
    const variance = velocityHistory.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / velocityHistory.length;
    const stdDev = Math.sqrt(variance);

    // Confidence interval based on standard deviation
    const zScore = confidenceLevel === 95 ? 1.96 : confidenceLevel === 90 ? 1.645 : 1.28; // 80%
    const margin = zScore * stdDev;

    return {
      prediction: Math.round(weightedAverage * 100) / 100,
      range: [
        Math.max(0, Math.round((weightedAverage - margin) * 100) / 100),
        Math.round((weightedAverage + margin) * 100) / 100
      ],
      confidence: Math.min(100, Math.max(0, 100 - (stdDev / mean) * 50)), // Simple confidence score
    };
  }, []);

  return {
    calculatePrediction,
  };
};