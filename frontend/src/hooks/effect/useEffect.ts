/**
 * Base Effect.ts React Hooks
 *
 * Core utilities for integrating Effect.ts with React components
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Effect } from 'effect';
import type { ApiError } from '../../lib/effect-config';

// Base state for Effect.ts hooks
export interface EffectState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

// Hook configuration options
export interface UseEffectOptions<T> {
  initialData?: T;
  dependencies?: React.DependencyList;
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

/**
 * Core hook for running Effect.ts effects in React
 */
export const useEffectHook = <T>(
  effect: Effect.Effect<T, ApiError, never>,
  options: UseEffectOptions<T> = {}
) => {
  const {
    initialData = null,
    dependencies = [],
    immediate = true,
    onSuccess,
    onError
  } = options;

  const [state, setState] = useState<EffectState<T>>({
    data: initialData,
    loading: immediate,
    error: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    // Abort previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await Effect.runPromise(effect);

      // Only update state if not aborted
      if (!abortControllerRef.current.signal.aborted) {
        setState({
          data: result,
          loading: false,
          error: null
        });
        onSuccess?.(result);
      }
    } catch (error) {
      // Only update state if not aborted
      if (!abortControllerRef.current.signal.aborted) {
        const apiError = error as ApiError;
        setState(prev => ({
          ...prev,
          loading: false,
          error: apiError
        }));
        onError?.(apiError);
      }
    }
  }, [effect, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  return {
    ...state,
    refetch,
    execute
  };
};

/**
 * Hook for async actions (create, update, delete operations)
 */
export const useAsyncEffect = <TParams, TResult>(
  effectFn: (params: TParams) => Effect.Effect<TResult, ApiError, never>
) => {
  const [state, setState] = useState<EffectState<TResult>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async (params: TParams): Promise<TResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const effect = effectFn(params);
      const result = await Effect.runPromise(effect);

      setState({
        data: result,
        loading: false,
        error: null
      });

      return result;
    } catch (error) {
      const apiError = error as ApiError;
      setState(prev => ({
        ...prev,
        loading: false,
        error: apiError
      }));
      throw apiError;
    }
  }, [effectFn]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
};

/**
 * Hook for optimistic updates with automatic rollback
 */
export const useOptimisticUpdate = <T>() => {
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const performOptimisticUpdate = useCallback(
    async (
      optimisticValue: T,
      effect: Effect.Effect<T, ApiError, never>,
      onRollback?: (error: ApiError) => void
    ): Promise<T> => {
      // Immediately show optimistic value
      setOptimisticData(optimisticValue);
      setIsOptimistic(true);

      try {
        // Run the actual effect
        const actualResult = await Effect.runPromise(effect);

        // Update with actual result
        setOptimisticData(actualResult);
        setIsOptimistic(false);

        return actualResult;
      } catch (error) {
        // Rollback optimistic update
        setOptimisticData(null);
        setIsOptimistic(false);

        const apiError = error as ApiError;
        onRollback?.(apiError);
        throw apiError;
      }
    },
    []
  );

  return {
    optimisticData,
    isOptimistic,
    performOptimisticUpdate
  };
};

/**
 * Hook for background synchronization
 */
export const useBackgroundSync = <T>(
  effect: Effect.Effect<T, ApiError, never>,
  intervalMs: number = 30000, // 30 seconds default
  enabled: boolean = true
) => {
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const sync = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      await Effect.runPromise(effect);
      setLastSync(new Date());
    } catch (error) {
      console.warn('Background sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [effect, isSyncing]);

  useEffect(() => {
    if (!enabled) return;

    // Initial sync
    sync();

    // Set up interval
    const interval = setInterval(sync, intervalMs);

    return () => clearInterval(interval);
  }, [sync, intervalMs, enabled]);

  return {
    lastSync,
    isSyncing,
    forceSync: sync
  };
};

/**
 * Hook for handling multiple concurrent Effects
 */
export const useBatchEffect = <T>(
  effects: Effect.Effect<T, ApiError, never>[]
) => {
  const [state, setState] = useState<EffectState<T[]>>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Run all effects concurrently
      const results = await Promise.all(
        effects.map(effect => Effect.runPromise(effect))
      );

      setState({
        data: results,
        loading: false,
        error: null
      });

      return results;
    } catch (error) {
      const apiError = error as ApiError;
      setState(prev => ({
        ...prev,
        loading: false,
        error: apiError
      }));
      throw apiError;
    }
  }, [effects]);

  return {
    ...state,
    execute
  };
};