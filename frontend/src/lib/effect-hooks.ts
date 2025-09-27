/**
 * React Hooks for Effect.ts Integration
 *
 * Custom hooks to integrate Effect.ts with React components
 */

import { useEffect, useState, useCallback } from 'react';
import { Effect } from 'effect';
import { runWithRuntime } from './effect-runtime';

// Hook for running effects in React components
export const useEffect_ = <A, E>(
  effect: Effect.Effect<A, E, never>,
  deps?: React.DependencyList
) => {
  const [state, setState] = useState<{
    data: A | null;
    error: E | null;
    loading: boolean;
  }>({ data: null, error: null, loading: false });

  useEffect(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    runWithRuntime(effect)
      .then(data => setState({ data, error: null, loading: false }))
      .catch(error => setState(prev => ({ ...prev, error, loading: false })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps ? [...deps, effect] : [effect]);

  return state;
};

// Hook for async actions
export const useEffectAction = <A, E, P = unknown>(
  effect: (params?: P) => Effect.Effect<A, E, never>
) => {
  const [state, setState] = useState<{
    data: A | null;
    error: E | null;
    loading: boolean;
  }>({ data: null, error: null, loading: false });

  const execute = useCallback(async (params?: any) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await runWithRuntime(effect(params));
      setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      setState(prev => ({ ...prev, error: error as E, loading: false }));
      throw error;
    }
  }, [effect]);

  const reset = useCallback(() => {
    setState({ data: null, error: null, loading: false });
  }, []);

  return { ...state, execute, reset };
};

// Hook for optimistic updates
export const useOptimisticEffect = <A, E>(
  optimisticValue: A,
  effect: Effect.Effect<A, E, any>,
  onRollback?: (error: E) => void
) => {
  const [state, setState] = useState<{
    data: A;
    error: E | null;
    loading: boolean;
    isOptimistic: boolean;
  }>({ data: optimisticValue, error: null, loading: true, isOptimistic: true });

  useEffect(() => {
    runWithRuntime(effect)
      .then(data => setState({
        data,
        error: null,
        loading: false,
        isOptimistic: false
      }))
      .catch(error => {
        setState(prev => ({
          ...prev,
          error,
          loading: false,
          isOptimistic: false
        }));
        onRollback?.(error);
      });
  }, [effect, onRollback]);

  return state;
};