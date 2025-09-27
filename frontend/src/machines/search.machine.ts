/**
 * Search State Machine
 *
 * Manages JQL search state with debounced input, query validation,
 * results pagination, and search history using XState.
 */

import { setup, assign, fromPromise } from 'xstate';

export interface SearchResult {
  id: number;
  type: 'issue' | 'project' | 'user';
  title: string;
  subtitle?: string;
  description?: string;
  key?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  project?: string;
  score: number;
}

export interface SearchQuery {
  jql: string;
  filters: {
    project?: string[];
    assignee?: string[];
    status?: string[];
    priority?: string[];
    type?: string[];
    labels?: string[];
    dateRange?: {
      field: 'created' | 'updated' | 'due';
      start?: Date;
      end?: Date;
    };
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface SearchContext {
  query: string;
  parsedQuery: SearchQuery | null;
  results: SearchResult[];
  totalResults: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  isValidating: boolean;
  error?: string;
  searchHistory: string[];
  recentQueries: string[];
  suggestions: string[];
  autocompleteOptions: {
    fields: string[];
    operators: string[];
    values: { [field: string]: string[] };
  };
  debounceDelay: number;
  cacheResults: Map<string, { results: SearchResult[]; timestamp: number; totalResults: number }>;
}

export type SearchEvents =
  | { type: 'TYPE_QUERY'; query: string }
  | { type: 'CLEAR_QUERY' }
  | { type: 'SUBMIT_SEARCH' }
  | { type: 'VALIDATE_QUERY' }
  | { type: 'LOAD_PAGE'; page: number }
  | { type: 'SELECT_RESULT'; result: SearchResult }
  | { type: 'SAVE_TO_HISTORY'; query: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'REQUEST_AUTOCOMPLETE'; field: string; partial: string }
  | { type: 'API_SUCCESS'; data: any; operation: string }
  | { type: 'API_ERROR'; error: string; operation: string }
  | { type: 'CACHE_HIT'; results: SearchResult[]; totalResults: number }
  | { type: 'DEBOUNCE_COMPLETE' }
  | { type: 'RETRY' };

export const searchMachine = setup({
  types: {
    context: {} as SearchContext,
    events: {} as SearchEvents,
  },
  guards: {
    hasQuery: ({ context }) => context.query && context.query.trim().length > 0,
    isValidJQL: ({ context }) => context.parsedQuery !== null && !context.error,
    hasResults: ({ context }) => context.results.length > 0,
    hasMorePages: ({ context }) =>
      context.currentPage * context.pageSize < context.totalResults,
    isCacheValid: ({ context }) => {
      const cached = context.cacheResults.get(context.query);
      if (!cached) return false;
      const isExpired = Date.now() - cached.timestamp > 300000; // 5 minutes
      return !isExpired;
    },
    shouldDebounce: ({ context }) => context.debounceDelay > 0,
  },
  actions: {
    // Query management
    setQuery: assign(({ event }) => {
      const query = (event as { type: 'TYPE_QUERY'; query: string }).query;
      console.log('🎯 Setting query:', query);
      return {
        query,
        error: undefined,
      };
    }),
    clearQuery: assign({
      query: '',
      parsedQuery: null,
      results: [],
      totalResults: 0,
      currentPage: 1,
      error: undefined,
    }),
    parseQuery: assign(({ context }) => {
      try {
        console.log('🔧 Parsing query:', context.query);
        const result = parseJQLQuery(context.query);
        console.log('✅ Parse result:', result);
        return {
          parsedQuery: result,
        };
      } catch (error) {
        console.error('❌ Parse error:', error);
        return {
          parsedQuery: null,
        };
      }
    }),

    // Loading states
    setLoading: assign({ isLoading: true, error: undefined }),
    clearLoading: assign({ isLoading: false }),
    setValidating: assign({
      isValidating: true
    }),
    clearValidating: assign({
      isValidating: false
    }),
    setError: assign(({ event }) => ({
      error: (event as { type: 'API_ERROR'; error: string }).error,
      isLoading: false,
      isValidating: false,
    })),

    // Results management
    setResults: assign(({ event }) => ({
      results: (event as any).output?.results || (event as any).results || [],
      totalResults: (event as any).output?.totalResults || (event as any).totalResults || 0,
      currentPage: 1,
      isLoading: false,
    })),
    appendResults: assign(({ context, event }) => ({
      results: [
        ...context.results,
        ...((event as any).output?.results || (event as any).results || []),
      ],
      currentPage: context.currentPage + 1,
      isLoading: false,
    })),
    setPage: assign(({ event }) => ({
      currentPage: (event as { type: 'LOAD_PAGE'; page: number }).page,
    })),

    // Cache management
    cacheResults: assign(({ context }) => ({
      cacheResults: (() => {
        const newCache = new Map(context.cacheResults);
        newCache.set(context.query, {
          results: context.results,
          totalResults: context.totalResults,
          timestamp: Date.now(),
        });
        // Keep only last 50 cached queries
        if (newCache.size > 50) {
          const firstKey = newCache.keys().next().value;
          newCache.delete(firstKey);
        }
        return newCache;
      })()
    })),
    loadFromCache: assign(({ event }) => ({
      results: (event as { type: 'CACHE_HIT'; results: SearchResult[] }).results,
      totalResults: (event as { type: 'CACHE_HIT'; totalResults: number }).totalResults,
      isLoading: false,
    })),

    // History management
    addToHistory: assign(({ context }) => {
      const query = context.query;
      const history = context.searchHistory.filter(q => q !== query);
      const recent = context.recentQueries.filter(q => q !== query);
      return {
        searchHistory: [query, ...history].slice(0, 20), // Keep last 20
        recentQueries: [query, ...recent].slice(0, 5), // Keep last 5
      };
    }),
    clearHistory: assign({
      searchHistory: [],
      recentQueries: [],
    }),

    // Autocomplete
    setSuggestions: assign(({ event }) => ({
      suggestions: (event as any).data?.suggestions || (event as any).suggestions || [],
    })),
    updateAutocompleteOptions: assign(({ event }) => {
      const field = (event as any).field || 'project';
      const values = (event as any).values || [];
      return {
        autocompleteOptions: {
          fields: ['project', 'assignee', 'status', 'priority', 'type', 'labels', 'created', 'updated', 'due'],
          operators: ['=', '!=', 'IN', 'NOT IN', '>', '<', '>=', '<=', '~', 'IS EMPTY', 'IS NOT EMPTY'],
          values: { [field]: values },
        },
      };
    }),

    // Side effects
    notifySearchPerformed: (context, event) => {
      console.log('🔍 Search performed:', context.query, `(${context.totalResults} results)`);
    },
    logQueryValidation: (context, event) => {
      console.log('✅ JQL query validated:', context.parsedQuery);
      console.log('🎯 Moving to checkingCache state');
    },
    logCacheHit: (context, event) => {
      console.log('⚡ Cache hit for query:', context.query);
    },
  },
  actors: {
    searchAPI: fromPromise(({ input }: { input: { query: string } }) => {
      console.log('🔍 Search API called with query:', input.query);
      return fetch('/api/issues/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: input.query,
        }),
      })
      .then(response => {
        console.log('📡 Search API response status:', response.status);
        if (!response.ok) {
          throw new Error(`Search API error: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('📊 Search API response data:', data);
        const results = data.results.map((issue: any) => ({
          id: issue.id,
          type: 'issue',
          title: issue.title,
          subtitle: issue.key || `ISSUE-${issue.id}`,
          description: issue.description,
          key: issue.key || `ISSUE-${issue.id}`,
          status: issue.status,
          priority: issue.priority,
          assignee: issue.assignee?.username,
          project: issue.project?.name,
          score: 1,
        }));
        console.log('✅ Mapped search results:', results);
        return {
          results,
          totalResults: data.totalResults,
        };
      })
      .catch(error => {
        console.error('❌ Search API error:', error);
        throw error;
      });
    }),
    validateJQLAPI: (context, event) => {
      return new Promise<{ isValid: boolean; parsedQuery?: SearchQuery }>((resolve, reject) => {
        setTimeout(() => {
          try {
            console.log('🔍 Validating JQL query:', context.query);
            // Always consider queries as valid - let backend handle validation
            const isValid = context.query.trim().length > 0;
            const parsedQuery: SearchQuery = {
              jql: context.query,
              filters: {},
            };
            console.log('✅ JQL validation result:', { isValid, parsedQuery });

            if (isValid) {
              resolve({ isValid, parsedQuery });
            } else {
              reject(new Error('Empty query'));
            }
          } catch (error) {
            console.error('❌ Validation error:', error);
            reject(error);
          }
        }, 100);
      });
    },
    autocompleteAPI: () => {
      return new Promise<string[]>((resolve) => {
        setTimeout(() => {
          const mockSuggestions = generateAutocompleteSuggestions('project', '');
          resolve(mockSuggestions);
        }, 150);
      });
    },
  },
}).createMachine({
  id: 'search',
  initial: 'idle',
  context: {
    query: '',
    parsedQuery: null,
    results: [],
    totalResults: 0,
    currentPage: 1,
    pageSize: 20,
    isLoading: false,
    isValidating: false,
    searchHistory: [],
    recentQueries: [],
    suggestions: [],
    autocompleteOptions: {
      fields: [],
      operators: [],
      values: {},
    },
    debounceDelay: 300,
    cacheResults: new Map(),
  },
  states: {
    idle: {
      on: {
        TYPE_QUERY: {
          target: 'debouncing',
          actions: ['setQuery'],
        },
        CLEAR_QUERY: {
          actions: ['clearQuery'],
        },
        SELECT_RESULT: {
          actions: ['addToHistory'],
        },
      },
    },

    debouncing: {
      after: {
        300: [
          {
            target: 'validating',
            guard: 'hasQuery',
          },
          {
            target: 'idle',
          }
        ],
      },
      on: {
        TYPE_QUERY: {
          target: 'debouncing',
          actions: ['setQuery'],
          reenter: true,
        },
        CLEAR_QUERY: {
          target: 'idle',
          actions: ['clearQuery'],
        },
      },
    },

    validating: {
      entry: [
        () => console.log('🚀 Entering validating state'),
        'setValidating',
        'parseQuery'
      ],
      always: [
        {
          target: 'checkingCache',
          actions: [
            () => console.log('🎯 Validation passed, moving to checkingCache'),
            'clearValidating',
            'logQueryValidation'
          ],
          guard: ({ context }) => {
            console.log('🔍 Checking if query is valid:', context.query);
            return context.query && context.query.trim().length > 0;
          }
        },
        {
          target: 'error',
          actions: [
            () => console.log('❌ Validation failed'),
            assign({
              error: 'Invalid JQL syntax',
              isLoading: false,
              isValidating: false,
            })
          ]
        }
      ],
      on: {
        TYPE_QUERY: {
          target: 'debouncing',
          actions: ['setQuery'],
        },
      },
    },

    checkingCache: {
      entry: () => console.log('🔍 Checking cache for query'),
      always: [
        {
          target: 'loadingFromCache',
          guard: 'isCacheValid',
          actions: () => console.log('✅ Cache hit! Loading from cache')
        },
        {
          target: 'searching',
          actions: () => console.log('🚀 No cache hit, proceeding to search API')
        },
      ],
    },

    loadingFromCache: {
      entry: [
        assign(({ context }) => {
          const cached = context.cacheResults.get(context.query);
          return {
            results: cached ? cached.results : [],
            totalResults: cached ? cached.totalResults : 0,
            isLoading: false,
          };
        }),
        'logCacheHit'
      ],
      always: {
        target: 'results',
      },
    },

    searching: {
      entry: [
        () => console.log('🔎 Entering searching state'),
        'setLoading'
      ],
      invoke: {
        src: 'searchAPI',
        input: ({ context }) => ({ query: context.query }),
        onDone: {
          target: 'results',
          actions: [
            () => console.log('✅ Search API succeeded'),
            'setResults',
            'cacheResults',
            'addToHistory',
            'notifySearchPerformed',
          ],
        },
        onError: {
          target: 'error',
          actions: [
            ({ event }) => console.error('❌ Search API failed:', event),
            assign({
              error: 'Search failed. Please try again.',
              isLoading: false,
              isValidating: false,
            })
          ],
        },
      },
      on: {
        TYPE_QUERY: {
          target: 'debouncing',
          actions: ['setQuery'],
        },
      },
    },

    results: {
      on: {
        TYPE_QUERY: {
          target: 'debouncing',
          actions: ['setQuery'],
        },
        LOAD_PAGE: {
          target: 'loadingMore',
          actions: ['setPage'],
          guard: 'hasMorePages',
        },
        SELECT_RESULT: {
          actions: ['addToHistory'],
        },
        SUBMIT_SEARCH: {
          target: 'searching',
        },
      },
    },

    loadingMore: {
      entry: ['setLoading'],
      invoke: {
        src: 'searchAPI',
        input: ({ context }) => ({ query: context.query }),
        onDone: {
          target: 'results',
          actions: ['appendResults'],
        },
        onError: {
          target: 'results',
          actions: [
            ({ event }) => console.error('❌ Load more failed:', event),
            assign({
              error: 'Failed to load more results',
              isLoading: false,
            })
          ],
        },
      },
    },

    error: {
      on: {
        TYPE_QUERY: {
          target: 'debouncing',
          actions: ['setQuery'],
        },
        RETRY: {
          target: 'searching',
          guard: 'hasQuery',
        },
        CLEAR_QUERY: {
          target: 'idle',
          actions: ['clearQuery'],
        },
      },
    },
  },
});

// JQL Parser (simplified implementation)
function parseJQLQuery(jql: string): SearchQuery {
  const query: SearchQuery = {
    jql,
    filters: {},
  };

  if (!jql || jql.trim().length === 0) {
    return query;
  }

  // Basic parsing - just store the JQL for now
  // The backend will do the actual parsing
  const cleanJql = jql.toLowerCase().trim();

  // Extract project filter
  const projectMatch = cleanJql.match(/project\s*[=]\s*([a-zA-Z0-9-_]+)/i);
  if (projectMatch) {
    query.filters.project = [projectMatch[1]];
  }

  // Extract assignee filter
  const assigneeMatch = cleanJql.match(/assignee\s*[=]\s*([a-zA-Z0-9-_]+)/i);
  if (assigneeMatch) {
    query.filters.assignee = [assigneeMatch[1]];
  }

  // Extract status IN filter
  const statusInMatch = cleanJql.match(/status\s+IN\s*\(([^)]+)\)/i);
  if (statusInMatch) {
    query.filters.status = statusInMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
  }

  // Extract single status filter
  const statusMatch = cleanJql.match(/status\s*[=]\s*([a-zA-Z0-9_-]+)/i);
  if (statusMatch && !statusInMatch) {
    query.filters.status = [statusMatch[1]];
  }

  return query;
}

// Mock data generators
function generateMockSearchResults(query: string, page: number): { results: SearchResult[]; totalResults: number } {
  const totalResults = Math.floor(Math.random() * 100) + 10;
  const pageSize = 20;
  const startIndex = (page - 1) * pageSize;

  const results: SearchResult[] = [];
  for (let i = 0; i < Math.min(pageSize, totalResults - startIndex); i++) {
    const id = startIndex + i + 1;
    results.push({
      id,
      type: 'issue',
      title: `Issue matching "${query}"`,
      subtitle: `JCD-${id + 100}`,
      description: `This issue matches your search query: ${query}`,
      key: `JCD-${id + 100}`,
      status: ['todo', 'in_progress', 'done'][Math.floor(Math.random() * 3)],
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      assignee: ['john', 'jane', 'mike'][Math.floor(Math.random() * 3)],
      project: 'Jira Clone Development',
      score: Math.random(),
    });
  }

  return { results, totalResults };
}

function generateAutocompleteSuggestions(field: string, partial: string): string[] {
  const suggestions: { [key: string]: string[] } = {
    project: ['JCD', 'DEMO', 'TEST'],
    assignee: ['john', 'jane', 'mike', 'sarah'],
    status: ['todo', 'in_progress', 'code_review', 'done'],
    priority: ['low', 'medium', 'high', 'urgent'],
    type: ['story', 'task', 'bug', 'epic'],
  };

  return (suggestions[field] || [])
    .filter(item => item.toLowerCase().includes(partial.toLowerCase()))
    .slice(0, 10);
}