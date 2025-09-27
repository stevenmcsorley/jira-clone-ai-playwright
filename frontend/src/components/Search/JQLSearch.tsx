/**
 * JQL Search Component
 *
 * Advanced search interface with JQL syntax support, autocomplete,
 * and real-time validation using XState search machine.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { searchMachine } from '../../machines/search.machine';
import type { SearchResult } from '../../machines/search.machine';

interface JQLSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
  className?: string;
  showAdvancedMode?: boolean;
}

export const JQLSearch: React.FC<JQLSearchProps> = ({
  onResultSelect,
  onQueryChange,
  placeholder = 'Search issues... (e.g., project = JCD AND status = todo)',
  className = '',
  showAdvancedMode = true,
}) => {
  const [state, send] = useMachine(searchMachine);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [showDropdownState, setShowDropdownState] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdownState(false);
        setSelectedResultIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show dropdown when there are results or suggestions
  useEffect(() => {
    const shouldShow = (state.matches('results') && state.context.results.length > 0) ||
                      (state.context.query.trim().length === 0 && state.context.recentQueries.length > 0);
    setShowDropdownState(shouldShow);
  }, [state.value, state.context.results.length, state.context.query, state.context.recentQueries.length]);

  // Handle query changes
  const handleQueryChange = (query: string) => {
    send({ type: 'TYPE_QUERY', query });
    onQueryChange?.(query);
    setSelectedResultIndex(-1);
    setShowDropdownState(true); // Show dropdown when typing
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        if (showDropdownState && state.context.results.length > 0) {
          e.preventDefault();
          setSelectedResultIndex(prev =>
            prev < state.context.results.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        if (showDropdownState && state.context.results.length > 0) {
          e.preventDefault();
          setSelectedResultIndex(prev => prev > 0 ? prev - 1 : -1);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (showDropdownState && selectedResultIndex >= 0 && state.context.results.length > 0) {
          const result = state.context.results[selectedResultIndex];
          handleResultSelect(result);
        } else if (state.context.query.trim()) {
          send({ type: 'SUBMIT_SEARCH' });
          setShowDropdownState(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        if (showDropdownState) {
          setShowDropdownState(false);
          setSelectedResultIndex(-1);
        } else {
          send({ type: 'CLEAR_QUERY' });
        }
        break;
    }
  };

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    send({ type: 'SELECT_RESULT', result });
    onResultSelect?.(result);
    setSelectedResultIndex(-1);
    setShowDropdownState(false); // Close dropdown after selection
  };

  // JQL syntax highlighting (basic implementation)
  const getJQLHighlighted = (query: string) => {
    return query
      .replace(/(project|assignee|status|priority|type|labels|created|updated|due)/gi,
        '<span class="text-blue-600 font-medium">$1</span>')
      .replace(/(=|!=|IN|NOT IN|>|<|>=|<=|~|IS EMPTY|IS NOT EMPTY)/gi,
        '<span class="text-purple-600">$1</span>')
      .replace(/(AND|OR|NOT)/gi,
        '<span class="text-orange-600 font-bold">$1</span>');
  };

  // Render search suggestions
  const renderSuggestions = () => {
    if (state.context.recentQueries.length === 0) return null;

    return (
      <div className="border-t border-gray-100 p-2">
        <div className="text-xs font-medium text-gray-500 mb-2">Recent searches:</div>
        {state.context.recentQueries.map((query, index) => (
          <button
            key={index}
            onClick={() => handleQueryChange(query)}
            className="block w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
          >
            {query}
          </button>
        ))}
      </div>
    );
  };

  // Render search results
  const renderResults = () => {
    if (!state.matches('results') || state.context.results.length === 0) return null;

    return (
      <div className="border-t border-gray-100 max-h-64 overflow-y-auto">
        {state.context.results.map((result, index) => (
          <div
            key={result.id}
            onClick={() => handleResultSelect(result)}
            className={`
              p-3 border-b border-gray-50 cursor-pointer transition-colors
              ${index === selectedResultIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{result.title}</span>
                  {result.key && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {result.key}
                    </span>
                  )}
                </div>
                {result.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {result.description}
                  </p>
                )}
                <div className="flex items-center space-x-3 mt-2">
                  {result.status && (
                    <span className={`
                      text-xs px-2 py-1 rounded-full
                      ${result.status === 'done' ? 'bg-green-100 text-green-800' : ''}
                      ${result.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${result.status === 'todo' ? 'bg-gray-100 text-gray-800' : ''}
                    `}>
                      {result.status.replace('_', ' ')}
                    </span>
                  )}
                  {result.priority && (
                    <span className={`
                      text-xs px-2 py-1 rounded-full
                      ${result.priority === 'high' ? 'bg-red-100 text-red-800' : ''}
                      ${result.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${result.priority === 'low' ? 'bg-green-100 text-green-800' : ''}
                    `}>
                      {result.priority}
                    </span>
                  )}
                  {result.assignee && (
                    <span className="text-xs text-gray-500">
                      @{result.assignee}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}

        {state.context.totalResults > state.context.results.length && (
          <div className="p-3 text-center">
            <button
              onClick={() => send({ type: 'LOAD_PAGE', page: state.context.currentPage + 1 })}
              disabled={state.context.isLoading}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {state.context.isLoading ? 'Loading...' : `Load more (${state.context.totalResults - state.context.results.length} remaining)`}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        {isAdvancedMode ? (
          // Advanced JQL Editor
          <div className="relative">
            <textarea
              ref={inputRef}
              value={state.context.query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                const shouldShow = (state.matches('results') && state.context.results.length > 0) ||
                                  (state.context.query.trim().length === 0 && state.context.recentQueries.length > 0);
                setShowDropdownState(shouldShow);
              }}
              placeholder={placeholder}
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              rows={3}
            />
            {/* JQL Syntax Overlay (would implement with Monaco editor in real app) */}
            <div className="absolute top-2 right-2 flex space-x-1">
              {state.context.isValidating && (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
              )}
              {state.context.error && (
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {state.context.parsedQuery && !state.context.error && (
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        ) : (
          // Simple Search Input
          <input
            ref={inputRef as any}
            type="text"
            value={state.context.query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              const shouldShow = (state.matches('results') && state.context.results.length > 0) ||
                                (state.context.query.trim().length === 0 && state.context.recentQueries.length > 0);
              setShowDropdownState(shouldShow);
            }}
            placeholder={placeholder}
            className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}

        {/* Search Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {state.context.isLoading && (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          )}
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Advanced Mode Toggle */}
      {showAdvancedMode && (
        <div className="flex justify-between items-center mt-2">
          <button
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {isAdvancedMode ? 'Simple search' : 'Advanced JQL search'}
          </button>

          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {state.context.totalResults > 0 && (
              <span>{state.context.totalResults} results</span>
            )}
            {state.context.query && (
              <button
                onClick={() => send({ type: 'CLEAR_QUERY' })}
                className="text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {state.context.error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {state.context.error}
          {state.matches('error') && (
            <button
              onClick={() => send({ type: 'RETRY' })}
              className="ml-2 text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Dropdown */}
      {showDropdownState && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden"
        >
          {state.matches('results') && state.context.results.length > 0 ? (
            renderResults()
          ) : state.context.query.trim().length === 0 ? (
            renderSuggestions()
          ) : null}
        </div>
      )}

      {/* JQL Help */}
      {isAdvancedMode && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          <div className="font-medium mb-1">JQL Examples:</div>
          <div className="space-y-1">
            <div><code>project = JCD AND status = todo</code></div>
            <div><code>assignee = john AND priority IN (high, urgent)</code></div>
            <div><code>created {'>='} -7d AND type = bug</code></div>
          </div>
        </div>
      )}
    </div>
  );
};