/**
 * Saved Filters Component
 *
 * Manage saved JQL filters with favorites, sharing,
 * and organization features.
 */

import React, { useState } from 'react';
import type { SavedFilter } from '../../machines/dashboard.machine';
import type { SearchQuery } from '../../machines/search.machine';

interface SavedFiltersProps {
  filters: SavedFilter[];
  onSaveFilter: (filter: Omit<SavedFilter, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateFilter: (filterId: number, updates: Partial<SavedFilter>) => void;
  onDeleteFilter: (filterId: number) => void;
  onFilterSelect: (filter: SavedFilter) => void;
  className?: string;
}

export const SavedFilters: React.FC<SavedFiltersProps> = ({
  filters,
  onSaveFilter,
  onUpdateFilter,
  onDeleteFilter,
  onFilterSelect,
  className = '',
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<SavedFilter | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = ['all', 'personal', 'team', 'recent'];
  const filteredFilters = categoryFilter === 'all'
    ? filters
    : filters.filter(f => f.category === categoryFilter);

  const favoriteFilters = filters.filter(f => f.isFavorite);

  const handleToggleFavorite = (filterId: number) => {
    const filter = filters.find(f => f.id === filterId);
    if (filter) {
      onUpdateFilter(filterId, { isFavorite: !filter.isFavorite });
    }
  };

  const handleSaveNewFilter = (formData: any) => {
    const newFilter: Omit<SavedFilter, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name,
      description: formData.description,
      jql: formData.jql,
      query: { jql: formData.jql, filters: {} },
      isPublic: formData.isPublic,
      isFavorite: formData.isFavorite,
      createdBy: 1, // Current user
      category: formData.category,
      color: formData.color,
    };

    onSaveFilter(newFilter);
    setIsCreateModalOpen(false);
  };

  const renderFilterCard = (filter: SavedFilter) => {
    return (
      <div
        key={filter.id}
        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onFilterSelect(filter)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: filter.color || '#3B82F6' }}
            ></div>
            <h3 className="font-medium text-gray-900">{filter.name}</h3>
            {filter.isPublic && (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(filter.id);
              }}
              className="p-1 text-gray-400 hover:text-yellow-500"
            >
              <svg
                className={`w-4 h-4 ${filter.isFavorite ? 'text-yellow-500 fill-current' : ''}`}
                fill={filter.isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingFilter(filter);
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFilter(filter.id);
              }}
              className="p-1 text-gray-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {filter.description && (
          <p className="text-sm text-gray-600 mb-2">{filter.description}</p>
        )}

        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 block">
          {filter.jql}
        </code>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center space-x-2">
            {filter.category && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                {filter.category}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {new Date(filter.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    );
  };

  const renderCreateModal = () => {
    if (!isCreateModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveNewFilter({
                  name: formData.get('name'),
                  description: formData.get('description'),
                  jql: formData.get('jql'),
                  category: formData.get('category'),
                  color: formData.get('color'),
                  isPublic: formData.get('isPublic') === 'on',
                  isFavorite: formData.get('isFavorite') === 'on',
                });
              }}
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create Saved Filter</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Filter Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="My Custom Filter"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Optional description..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      JQL Query
                    </label>
                    <textarea
                      name="jql"
                      rows={3}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="project = JCD AND assignee = currentUser()"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        name="category"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="personal">Personal</option>
                        <option value="team">Team</option>
                        <option value="recent">Recent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color
                      </label>
                      <select
                        name="color"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="#3B82F6">Blue</option>
                        <option value="#10B981">Green</option>
                        <option value="#F59E0B">Yellow</option>
                        <option value="#EF4444">Red</option>
                        <option value="#8B5CF6">Purple</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input type="checkbox" name="isFavorite" className="mr-2" />
                      <span className="text-sm text-gray-700">Add to favorites</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" name="isPublic" className="mr-2" />
                      <span className="text-sm text-gray-700">Share with team</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save Filter
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Saved Filters</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create Filter
        </button>
      </div>

      {/* Favorites Section */}
      {favoriteFilters.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">⭐ Favorites</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {favoriteFilters.map(renderFilterCard)}
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center space-x-4 mb-4">
        <span className="text-sm font-medium text-gray-700">Category:</span>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setCategoryFilter(category)}
            className={`
              px-3 py-1 text-sm rounded-full transition-colors
              ${categoryFilter === category
                ? 'bg-blue-100 text-blue-800'
                : 'text-gray-600 hover:bg-gray-100'
              }
            `}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* All Filters */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredFilters.map(renderFilterCard)}
      </div>

      {filteredFilters.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saved filters</h3>
          <p className="text-gray-500 mb-4">Create your first saved filter to get started</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Filter
          </button>
        </div>
      )}

      {renderCreateModal()}
    </div>
  );
};