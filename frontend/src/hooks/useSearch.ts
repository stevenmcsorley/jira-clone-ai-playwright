/**
 * Search hook — thin React wrapper over the XState search machine,
 * which performs the API calls itself via invoke.
 */

import { useMachine } from '@xstate/react';
import { searchMachine } from '../machines/search.machine';
import type { SearchResult } from '../machines/search.machine';

export const useSearch = () => {
  const [state, send] = useMachine(searchMachine);

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
