/**
 * Global Search Component
 *
 * Jira-style omnisearch bar with keyboard shortcuts, recent items,
 * and command palette functionality using XState and Effect.ts.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useSearchEffect } from '../../hooks/useSearchEffect';

interface GlobalSearchProps {
  onNavigate?: (path: string) => void;
  className?: string;
}

interface SearchItem {
  id: string;
  type: 'issue' | 'project' | 'user' | 'command';
  title: string;
  subtitle?: string;
  description?: string;
  key?: string;
  path?: string;
  icon?: string;
  score: number;
}

interface RecentItem {
  id: string;
  type: 'issue' | 'project';
  title: string;
  key?: string;
  path: string;
  lastVisited: Date;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  onNavigate,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { search, query, isLoading, results } = useSearchEffect({
    debounceMs: 200,
    enableBackground: false,
  });

  // Global keyboard shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }

      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSelectedIndex(0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Load recent items from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentItems');
    if (stored) {
      try {
        const items = JSON.parse(stored);
        setRecentItems(items.slice(0, 10)); // Keep only last 10
      } catch (error) {
        console.warn('Failed to parse recent items:', error);
      }
    }
  }, []);

  // Transform search results to SearchItems
  useEffect(() => {
    if (results.length > 0) {
      const searchItems: SearchItem[] = results.map(result => ({
        id: result.id.toString(),
        type: result.type as 'issue' | 'project' | 'user',
        title: result.title,
        subtitle: result.subtitle,
        description: result.description,
        key: result.key,
        path: getItemPath(result.type, result.id),
        score: result.score,
      }));

      // Add command suggestions if query matches
      if (query.toLowerCase().includes('create')) {
        searchItems.unshift({
          id: 'cmd-create-issue',
          type: 'command',
          title: 'Create Issue',
          description: 'Create a new issue in the current project',
          path: '/issues/create',
          icon: '➕',
          score: 1,
        });
      }

      if (query.toLowerCase().includes('dashboard')) {
        searchItems.unshift({
          id: 'cmd-dashboard',
          type: 'command',
          title: 'Go to Dashboard',
          description: 'View your personalized dashboard',
          path: '/dashboard',
          icon: '📊',
          score: 1,
        });
      }

      setSearchResults(searchItems);
      setSelectedIndex(0);
    } else {
      setSearchResults([]);
    }
  }, [results, query]);

  const handleSearch = (searchQuery: string) => {
    search(searchQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query ? searchResults : recentItems;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (items.length > 0) {
          handleItemSelect(items[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(0);
        break;
    }
  };

  const handleItemSelect = (item: SearchItem | RecentItem) => {
    const path = 'path' in item ? item.path || getItemPath(item.type, item.id) : getItemPath(item.type, item.id);

    // Add to recent items if it's a navigation
    if (item.type === 'issue' || item.type === 'project') {
      addToRecentItems({
        id: item.id,
        type: item.type,
        title: item.title,
        key: 'key' in item ? item.key : undefined,
        path,
        lastVisited: new Date(),
      });
    }

    // Navigate
    if (onNavigate && path) {
      onNavigate(path);
    }

    setIsOpen(false);
    setSelectedIndex(0);
  };

  const addToRecentItems = (item: RecentItem) => {
    const updated = [
      item,
      ...recentItems.filter(r => r.id !== item.id),
    ].slice(0, 10);

    setRecentItems(updated);
    localStorage.setItem('recentItems', JSON.stringify(updated));
  };

  const getItemPath = (type: string, id: string | number): string => {
    switch (type) {
      case 'issue': return `/issues/${id}`;
      case 'project': return `/projects/${id}`;
      case 'user': return `/users/${id}`;
      default: return '/';
    }
  };

  const getItemIcon = (type: string): string => {
    switch (type) {
      case 'issue': return '🎫';
      case 'project': return '📁';
      case 'user': return '👤';
      case 'command': return '⚡';
      default: return '📄';
    }
  };

  const renderSearchResult = (item: SearchItem, index: number) => {
    return (
      <div
        key={item.id}
        onClick={() => handleItemSelect(item)}
        className={`
          p-3 cursor-pointer transition-colors border-l-4
          ${index === selectedIndex
            ? 'bg-blue-50 border-blue-500'
            : 'border-transparent hover:bg-gray-50'
          }
        `}
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">{item.icon || getItemIcon(item.type)}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {item.title}
              </h4>
              {item.key && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  {item.key}
                </span>
              )}
              <span className="text-xs text-gray-500 capitalize">
                {item.type}
              </span>
            </div>
            {item.description && (
              <p className="text-xs text-gray-500 mt-1 truncate">
                {item.description}
              </p>
            )}
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    );
  };

  const renderRecentItem = (item: RecentItem, index: number) => {
    return (
      <div
        key={item.id}
        onClick={() => handleItemSelect(item)}
        className={`
          p-3 cursor-pointer transition-colors border-l-4
          ${index === selectedIndex
            ? 'bg-blue-50 border-blue-500'
            : 'border-transparent hover:bg-gray-50'
          }
        `}
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getItemIcon(item.type)}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {item.title}
              </h4>
              {item.key && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  {item.key}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(item.lastVisited).toLocaleDateString()}
            </p>
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`
          flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 bg-gray-100
          rounded-md hover:bg-gray-200 transition-colors ${className}
        `}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Search...</span>
        <kbd className="hidden sm:inline-block px-2 py-1 text-xs bg-white border border-gray-300 rounded">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen pt-16 px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-25" onClick={() => setIsOpen(false)}></div>

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="block w-full pl-10 pr-3 py-3 border-none text-lg placeholder-gray-500 focus:outline-none focus:ring-0"
                placeholder="Search issues, projects, or type a command..."
                autoComplete="off"
              />
              {isLoading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="w-5 h-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div ref={resultsRef} className="max-h-80 overflow-y-auto">
            {query ? (
              // Search Results
              searchResults.length > 0 ? (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                    Search Results
                  </div>
                  {searchResults.map((item, index) => renderSearchResult(item, index))}
                </div>
              ) : query.length > 0 && !isLoading ? (
                <div className="p-8 text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No results found</h3>
                  <p className="text-xs text-gray-500">Try searching for issues, projects, or users</p>
                </div>
              ) : null
            ) : (
              // Recent Items
              <div>
                {recentItems.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                      Recent Items
                    </div>
                    {recentItems.map((item, index) => renderRecentItem(item, index))}
                  </>
                )}

                {/* Quick Actions */}
                <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-t">
                  Quick Actions
                </div>
                <div className="space-y-1">
                  {[
                    { id: 'create', title: 'Create Issue', icon: '➕', path: '/issues/create' },
                    { id: 'dashboard', title: 'Dashboard', icon: '📊', path: '/dashboard' },
                    { id: 'projects', title: 'All Projects', icon: '📁', path: '/projects' },
                    { id: 'settings', title: 'Settings', icon: '⚙️', path: '/settings' },
                  ].map((action, index) => (
                    <div
                      key={action.id}
                      onClick={() => handleItemSelect({
                        id: action.id,
                        type: 'command' as const,
                        title: action.title,
                        path: action.path,
                        score: 1,
                        icon: action.icon,
                      })}
                      className={`
                        p-3 cursor-pointer transition-colors border-l-4
                        ${index + recentItems.length === selectedIndex
                          ? 'bg-blue-50 border-blue-500'
                          : 'border-transparent hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{action.icon}</span>
                        <span className="text-sm font-medium text-gray-900">{action.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Esc</kbd>
                  <span>Close</span>
                </div>
              </div>
              <div className="text-gray-400">
                Global Search
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};