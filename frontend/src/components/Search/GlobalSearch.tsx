/**
 * Global Search Component
 *
 * Jira-style omnisearch bar with keyboard shortcuts, recent items,
 * and an inline suggestions dropdown (no full-screen modal overlay).
 *
 * The search endpoint returns raw issue entities that carry `projectId`
 * (and a `project` relation), so results can build the correct issue
 * detail route: /projects/:projectId/issues/:issueId.
 */

import React, { useState, useRef, useEffect } from 'react';
import { IssueTypeIcon } from '../IssueTypeIcon';
import { formatRelativeTime } from '../../utils/relativeTime';
import type { IssueType } from '../../types/domain.types';

interface GlobalSearchProps {
  onNavigate?: (path: string) => void;
  className?: string;
}

interface SearchItem {
  id: string;
  type: 'issue' | 'project' | 'user' | 'command';
  issueType?: IssueType;
  title: string;
  subtitle?: string;
  description?: string;
  key?: string;
  path?: string;
  icon?: string;
  projectId?: number;
  score: number;
}

interface RecentItem {
  id: string;
  type: 'issue' | 'project';
  issueType?: IssueType;
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
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const closeDropdown = () => {
    setIsOpen(false);
    setSelectedIndex(0);
  };

  // Global keyboard shortcut (Ctrl+K / Cmd+K) + Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      }

      if (e.key === 'Escape' && isOpen) {
        closeDropdown();
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close the inline dropdown when clicking outside of it
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

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

  // Debounced search — fetch raw issues (which carry projectId) directly so
  // results can navigate to /projects/:projectId/issues/:issueId.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsLoading(false);
      setSelectedIndex(0);
      return;
    }

    let ignore = false;
    setIsLoading(true);

    const handle = setTimeout(async () => {
      try {
        const response = await fetch('/api/issues/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmed }),
        });

        if (!response.ok) {
          throw new Error(`Search API error: ${response.status}`);
        }

        const data = await response.json();
        if (ignore) return;

        const items: SearchItem[] = (data.results ?? []).map((issue: any) => {
          const projectId: number | undefined =
            issue.projectId ?? issue.project?.id;
          const key = issue.key ?? (issue.project?.key ? `${issue.project.key}-${issue.id}` : `#${issue.id}`);
          return {
            id: String(issue.id),
            type: 'issue' as const,
            issueType: issue.type as IssueType,
            title: issue.title,
            subtitle: key,
            description: issue.description,
            key,
            projectId,
            path: getItemPath('issue', issue.id, projectId),
            score: 1,
          };
        });

        setSearchResults(items);
        setSelectedIndex(0);
      } catch (error) {
        if (!ignore) {
          console.warn('Search failed:', error);
          setSearchResults([]);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(handle);
    };
  }, [query]);

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
        if (items.length > 0 && selectedIndex < items.length) {
          handleItemSelect(items[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeDropdown();
        inputRef.current?.blur();
        break;
    }
  };

  const handleItemSelect = (item: SearchItem | RecentItem) => {
    const projectId = 'projectId' in item ? item.projectId : undefined;
    const path =
      ('path' in item && item.path) ||
      getItemPath(item.type, item.id, projectId);

    // Add to recent items if it's a navigation
    if (item.type === 'issue' || item.type === 'project') {
      addToRecentItems({
        id: item.id,
        type: item.type,
        issueType: 'issueType' in item ? item.issueType : undefined,
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

    // Close the dropdown and drop focus after selecting
    closeDropdown();
    inputRef.current?.blur();
  };

  const addToRecentItems = (item: RecentItem) => {
    const updated = [
      item,
      ...recentItems.filter(r => r.id !== item.id),
    ].slice(0, 10);

    setRecentItems(updated);
    localStorage.setItem('recentItems', JSON.stringify(updated));
  };

  const getItemPath = (
    type: string,
    id: string | number,
    projectId?: number,
  ): string => {
    switch (type) {
      case 'issue':
        // Real route is /projects/:projectId/issues/:issueId
        return projectId != null
          ? `/projects/${projectId}/issues/${id}`
          : '/projects';
      case 'project':
        return `/projects/${id}`;
      case 'user':
        // No /users/:id route exists — land on the users list
        return '/users';
      default:
        return '/';
    }
  };

  const TypeIcon = ({ item }: { item: SearchItem | RecentItem }) => {
    if (item.type === 'issue') {
      return <IssueTypeIcon type={('issueType' in item && item.issueType) || 'task'} />;
    }
    if (item.type === 'project') {
      return (
        <span className="w-5 h-5 rounded-[4px] bg-indigo-500 text-white inline-flex items-center justify-center shrink-0">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
        </span>
      );
    }
    return (
      <span className="w-5 h-5 rounded-full bg-gray-400 text-white inline-flex items-center justify-center shrink-0">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      </span>
    );
  };

  const ResultRow = ({ item, index, meta }: { item: SearchItem | RecentItem; index: number; meta?: string }) => {
    const selected = index === selectedIndex;
    return (
      <button
        type="button"
        onClick={() => handleItemSelect(item)}
        onMouseEnter={() => setSelectedIndex(index)}
        className={`w-full flex items-center gap-3 px-3 py-2 mx-0 rounded-md text-left transition-colors ${
          selected ? 'bg-blue-50' : 'hover:bg-gray-50'
        }`}
      >
        <TypeIcon item={item} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {item.key && (
              <span className="text-xs font-medium text-gray-400 shrink-0">{item.key}</span>
            )}
            <span className="text-sm text-gray-900 truncate">{item.title}</span>
          </div>
          {meta && <p className="text-xs text-gray-400 truncate mt-0.5">{meta}</p>}
        </div>
        <svg
          className={`w-4 h-4 shrink-0 ${selected ? 'text-blue-400' : 'text-transparent'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input (always visible in the header) */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="block w-full pl-9 pr-3 py-2 text-sm bg-gray-100 rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          placeholder="Search issues, projects, people…"
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Inline suggestions dropdown — no full-screen overlay/backdrop */}
      {isOpen && (
        <div
          ref={resultsRef}
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-md shadow-lg border border-gray-200 max-h-[70vh] overflow-y-auto"
        >
          {query ? (
            // Search Results
            searchResults.length > 0 ? (
              <div className="p-2">
                <div className="px-2 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  Results
                </div>
                {searchResults.map((item, index) => (
                  <ResultRow key={item.id} item={item} index={index} meta={item.description || undefined} />
                ))}
              </div>
            ) : query.length > 0 && !isLoading ? (
              <div className="px-6 py-10 text-center">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-sm font-medium text-gray-900">No results for “{query}”</h3>
                <p className="text-xs text-gray-400 mt-1">Search across issues, projects and people</p>
              </div>
            ) : null
          ) : recentItems.length > 0 ? (
            // Recent Items
            <div className="p-2">
              <div className="px-2 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                Recent
              </div>
              {recentItems.map((item, index) => (
                <ResultRow key={item.id} item={item} index={index} meta={formatRelativeTime(item.lastVisited)} />
              ))}
            </div>
          ) : (
            // Empty prompt
            <div className="px-6 py-10 text-center">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm text-gray-500">Search issues, projects and people</p>
              <p className="text-xs text-gray-400 mt-1">Start typing to see results</p>
            </div>
          )}

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
      )}
    </div>
  );
};
