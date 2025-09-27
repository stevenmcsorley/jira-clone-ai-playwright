/**
 * Advanced Search Page
 *
 * Full-featured search interface with JQL editor, query builder,
 * saved filters, and search results.
 */

import React, { useState } from 'react';
import { JQLSearch, QueryBuilder } from '../components/Search';
import { SavedFilters } from '../components/Dashboard';
import { useSearchEffect } from '../hooks/useSearchEffect';

export const Search: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'builder' | 'filters' | 'dashboard'>('search');
  const { search, query, results, isLoading, clearSearch } = useSearchEffect();

  const handleResultSelect = (result: any) => {
    console.log('Selected result:', result);
    // Navigate to the result
    if (result.type === 'issue') {
      window.location.href = `/projects/11/issues/${result.id}`;
    } else if (result.type === 'project') {
      window.location.href = `/projects/${result.id}`;
    }
  };

  const handleQueryChange = (newQuery: string) => {
    search(newQuery);
  };

  const tabs = [
    { id: 'search', label: 'JQL Search', icon: '🔍' },
    { id: 'builder', label: 'Query Builder', icon: '🔧' },
    { id: 'filters', label: 'Saved Filters', icon: '💾' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Search</h1>
          <p className="text-gray-600">
            Search issues with JQL, build visual queries, manage saved filters, and view your dashboard
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'search' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">JQL Search</h2>
                <JQLSearch
                  onResultSelect={handleResultSelect}
                  onQueryChange={handleQueryChange}
                  placeholder="Enter JQL query... (e.g., project = JCD AND status = todo)"
                  showAdvancedMode={true}
                  className="mb-6"
                />
              </div>

              {/* Quick Examples */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Examples:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'project = JCD AND assignee = john',
                    'status IN (todo, in_progress)',
                    'priority = high AND created >= -7d',
                    'assignee IS EMPTY',
                    'labels = urgent OR priority = urgent',
                    'updated >= -24h',
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => handleQueryChange(example)}
                      className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <code className="text-sm text-blue-600">{example}</code>
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              {query && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Search Results {results.length > 0 && `(${results.length})`}
                    </h3>
                    {query && (
                      <button
                        onClick={clearSearch}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : results.length > 0 ? (
                    <div className="space-y-3">
                      {results.map((result) => (
                        <div
                          key={result.id}
                          onClick={() => handleResultSelect(result)}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{result.title}</h4>
                              {result.subtitle && (
                                <p className="text-sm text-gray-600 mt-1">{result.subtitle}</p>
                              )}
                              {result.description && (
                                <p className="text-sm text-gray-500 mt-2">{result.description}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {result.key && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {result.key}
                                </span>
                              )}
                              <span className="text-xs text-gray-500 capitalize">
                                {result.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-500 mb-2">No results found</div>
                      <p className="text-sm text-gray-400">
                        Try adjusting your search query or check for typos
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'builder' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Visual Query Builder</h2>
              <p className="text-gray-600 mb-6">
                Build JQL queries visually without needing to know the syntax
              </p>
              <QueryBuilder
                onQueryChange={(query) => {
                  console.log('Built query:', query);
                  if (query.jql) {
                    search(query.jql);
                  }
                }}
              />
            </div>
          )}

          {activeTab === 'filters' && (
            <div className="p-6">
              <SavedFilters
                filters={[]} // Would be loaded from the dashboard machine
                onSaveFilter={(filter) => console.log('Save filter:', filter)}
                onUpdateFilter={(id, updates) => console.log('Update filter:', id, updates)}
                onDeleteFilter={(id) => console.log('Delete filter:', id)}
                onFilterSelect={(filter) => {
                  console.log('Select filter:', filter);
                  search(filter.jql);
                  setActiveTab('search');
                }}
              />
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="p-6">
              <div className="text-center py-12 text-gray-500">
                <h3 className="text-lg font-medium mb-2">Dashboard Coming Soon</h3>
                <p>The personalized dashboard feature is currently being optimized and will be available soon.</p>
              </div>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">🚀 How to Use Advanced Search</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">JQL Search:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Use advanced JQL syntax for precise queries</li>
                <li>• Get real-time validation and autocomplete</li>
                <li>• Switch between simple and advanced modes</li>
                <li>• Access search history and recent queries</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Global Search:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Press <kbd className="bg-blue-200 px-1 rounded">Ctrl+K</kbd> anywhere for quick search</li>
                <li>• Search across issues, projects, and users</li>
                <li>• Access recent items and quick actions</li>
                <li>• Use keyboard navigation (arrows + enter)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};