/**
 * Search Effect Hook
 *
 * Integrates XState search machine with Effect.ts for optimized
 * search performance, caching, and background updates.
 */

import { useEffect, useCallback } from 'react';
import { useMachine } from '@xstate/react';
import { Effect, pipe } from 'effect';
import { searchMachine } from '../machines/search.machine';
import type { SearchResult, SearchQuery } from '../machines/search.machine';
import { useEffectHook } from './effect/useEffect';

interface SearchEffectOptions {
  debounceMs?: number;
  cacheTimeout?: number;
  enableBackground?: boolean;
  maxCacheSize?: number;
}

interface SearchAPI {
  search: (query: SearchQuery, page?: number) => Effect.Effect<{ results: SearchResult[]; totalResults: number }, Error>;
  validate: (jql: string) => Effect.Effect<{ isValid: boolean; parsedQuery?: SearchQuery }, Error>;
  autocomplete: (field: string, partial: string) => Effect.Effect<string[], Error>;
}

export const useSearchEffect = (options: SearchEffectOptions = {}) => {
  const [state, send] = useMachine(searchMachine);

  const {
    debounceMs = 300,
    cacheTimeout = 300000, // 5 minutes
    enableBackground = true,
    maxCacheSize = 50,
  } = options;

  // Create Effect-based search API
  const searchAPI: SearchAPI = {
    search: (query: SearchQuery, page = 1) =>
      pipe(
        Effect.tryPromise({
          try: () => performSearch(query, page),
          catch: (error) => new Error(`Search failed: ${error}`),
        }),
        Effect.timeout('3 seconds'),
        Effect.retry({ times: 2, delay: '1 second' }),
        Effect.withLogSpan('search-query')
      ),

    validate: (jql: string) =>
      pipe(
        Effect.tryPromise({
          try: () => validateJQL(jql),
          catch: (error) => new Error(`Validation failed: ${error}`),
        }),
        Effect.timeout('1 second'),
        Effect.withLogSpan('jql-validation')
      ),

    autocomplete: (field: string, partial: string) =>
      pipe(
        Effect.tryPromise({
          try: () => getAutocomplete(field, partial),
          catch: (error) => new Error(`Autocomplete failed: ${error}`),
        }),
        Effect.timeout('500 millis'),
        Effect.withLogSpan('autocomplete')
      ),
  };

  // Execute search with Effect.ts
  const executeSearch = useCallback(
    async (query: SearchQuery, page: number = 1) => {
      const searchEffect = pipe(
        searchAPI.search(query, page),
        Effect.tap((result) =>
          Effect.sync(() => {
            send({
              type: 'API_SUCCESS',
              data: result,
              operation: 'search',
            });
          })
        ),
        Effect.catchAll((error) =>
          Effect.sync(() => {
            send({
              type: 'API_ERROR',
              error: error.message,
              operation: 'search',
            });
          })
        )
      );

      try {
        await Effect.runPromise(searchEffect);
      } catch (error) {
        console.error('Search execution failed:', error);
      }
    },
    [send, searchAPI]
  );

  // Execute JQL validation with Effect.ts
  const executeValidation = useCallback(
    async (jql: string) => {
      const validationEffect = pipe(
        searchAPI.validate(jql),
        Effect.tap((result) =>
          Effect.sync(() => {
            if (result.isValid) {
              console.log('✅ JQL validation passed:', result.parsedQuery);
            } else {
              send({
                type: 'API_ERROR',
                error: 'Invalid JQL syntax',
                operation: 'validate',
              });
            }
          })
        ),
        Effect.catchAll((error) =>
          Effect.sync(() => {
            send({
              type: 'API_ERROR',
              error: error.message,
              operation: 'validate',
            });
          })
        )
      );

      try {
        await Effect.runPromise(validationEffect);
      } catch (error) {
        console.error('Validation execution failed:', error);
      }
    },
    [send, searchAPI]
  );

  // Execute autocomplete with Effect.ts
  const executeAutocomplete = useCallback(
    async (field: string, partial: string) => {
      const autocompleteEffect = pipe(
        searchAPI.autocomplete(field, partial),
        Effect.tap((suggestions) =>
          Effect.sync(() => {
            send({
              type: 'API_SUCCESS',
              data: { suggestions },
              operation: 'autocomplete',
            });
          })
        ),
        Effect.catchAll((error) =>
          Effect.sync(() => {
            console.warn('Autocomplete failed:', error.message);
          })
        )
      );

      try {
        await Effect.runPromise(autocompleteEffect);
      } catch (error) {
        console.error('Autocomplete execution failed:', error);
      }
    },
    [send, searchAPI]
  );

  // Note: Effect.ts integration disabled - XState machine handles API calls via invoke
  // TODO: Integrate Effect.ts properly by replacing invoke services with Effect actors

  // useEffect(() => {
  //   if (state.matches('searching') && state.context.parsedQuery) {
  //     executeSearch(state.context.parsedQuery, state.context.currentPage);
  //   }
  // }, [state.value, state.context.parsedQuery, state.context.currentPage]);

  // useEffect(() => {
  //   if (state.matches('validating') && state.context.query) {
  //     executeValidation(state.context.query);
  //   }
  // }, [state.value, state.context.query]);

  // Background cache warming for popular searches
  useEffect(() => {
    if (enableBackground && state.context.recentQueries.length > 0) {
      const popularQueries = state.context.recentQueries.slice(0, 3);

      // Warm cache for recent queries
      const warmCache = Effect.forEach(
        popularQueries,
        (jql) =>
          pipe(
            searchAPI.validate(jql),
            Effect.flatMap((validation) =>
              validation.isValid && validation.parsedQuery
                ? searchAPI.search(validation.parsedQuery)
                : Effect.succeed({ results: [], totalResults: 0 })
            ),
            Effect.catchAll(() => Effect.succeed({ results: [], totalResults: 0 }))
          ),
        { concurrency: 2 }
      );

      // Run cache warming in background
      Effect.runPromise(warmCache).catch(() => {
        // Silently handle cache warming failures
      });
    }
  }, [state.context.recentQueries.length, enableBackground]);

  // Public interface
  return {
    state,
    send,
    search: (query: string) => send({ type: 'TYPE_QUERY', query }),
    clearSearch: () => send({ type: 'CLEAR_QUERY' }),
    submitSearch: () => send({ type: 'SUBMIT_SEARCH' }),
    selectResult: (result: SearchResult) => send({ type: 'SELECT_RESULT', result }),
    loadMore: () => send({ type: 'LOAD_PAGE', page: state.context.currentPage + 1 }),
    retry: () => send({ type: 'RETRY' }),

    // Computed values
    isLoading: state.context.isLoading,
    isValidating: state.context.isValidating,
    hasError: !!state.context.error,
    hasResults: state.context.results.length > 0,
    hasMoreResults: state.context.currentPage * state.context.pageSize < state.context.totalResults,

    // Data
    query: state.context.query,
    results: state.context.results,
    totalResults: state.context.totalResults,
    error: state.context.error,
    recentQueries: state.context.recentQueries,
    searchHistory: state.context.searchHistory,
  };
};

// API Implementation functions (would be moved to services in real app)
async function performSearch(query: SearchQuery, page: number): Promise<{ results: SearchResult[]; totalResults: number }> {
  const response = await fetch('/api/issues/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: query.jql, projectId: query.filters?.projectId }),
  });

  if (!response.ok) {
    throw new Error(`Search API error: ${response.status}`);
  }

  const data = await response.json();

  // Map backend Issue entities to SearchResult format
  const results = data.results.map((issue: any) => ({
    id: issue.id.toString(),
    key: `${issue.project?.key || 'PROJ'}-${issue.id}`,
    title: issue.title,
    description: issue.description,
    status: issue.status,
    priority: issue.priority,
    type: issue.type,
    assignee: issue.assignee?.username,
    reporter: issue.reporter?.username,
    created: issue.createdAt,
    updated: issue.updatedAt,
  }));

  return {
    results,
    totalResults: data.totalResults,
  };
}

async function validateJQL(jql: string): Promise<{ isValid: boolean; parsedQuery?: SearchQuery }> {
  // Mock implementation - in real app would call backend validator
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    // Basic JQL validation
    const hasValidSyntax = /^[a-zA-Z0-9\s=!<>()'",-]+$/.test(jql);
    if (!hasValidSyntax) {
      return { isValid: false };
    }

    // Parse the query
    const parsedQuery: SearchQuery = {
      jql,
      filters: {},
    };

    return { isValid: true, parsedQuery };
  } catch (error) {
    return { isValid: false };
  }
}

async function getAutocomplete(field: string, partial: string): Promise<string[]> {
  // Mock implementation - in real app would call backend autocomplete API
  await new Promise(resolve => setTimeout(resolve, 150));

  const suggestions: { [key: string]: string[] } = {
    project: ['JCD', 'DEMO', 'TEST', 'MOBILE', 'WEB'],
    assignee: ['john', 'jane', 'mike', 'sarah', 'alex'],
    status: ['todo', 'in_progress', 'code_review', 'done', 'blocked'],
    priority: ['low', 'medium', 'high', 'urgent'],
    type: ['story', 'task', 'bug', 'epic', 'subtask'],
    labels: ['frontend', 'backend', 'urgent', 'blocked', 'ready'],
  };

  return (suggestions[field] || [])
    .filter(item => item.toLowerCase().includes(partial.toLowerCase()))
    .slice(0, 10);
}