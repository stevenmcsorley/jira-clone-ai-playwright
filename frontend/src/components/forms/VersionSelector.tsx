/**
 * VersionSelector Component
 *
 * Dropdown for selecting fix versions and affected versions.
 * Integrates with the existing Release/Version management system.
 */

import React, { useState, useRef, useEffect } from 'react';

interface Version {
  id: number;
  name: string;
  description?: string;
  releaseDate?: string;
  status: 'unreleased' | 'released' | 'archived';
  issueCount?: number;
}

interface VersionSelectorProps {
  value?: number; // Selected version ID
  onChange: (versionId: number | undefined) => void;
  versions: Version[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  showOnlyUnreleased?: boolean;
  className?: string;
  variant?: 'fix' | 'affects'; // Fix version or affects version
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  value,
  onChange,
  versions = [],
  label,
  placeholder = 'Select version',
  required = false,
  disabled = false,
  error,
  showOnlyUnreleased = false,
  className = '',
  variant = 'fix',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Default label based on variant
  const defaultLabel = variant === 'fix' ? 'Fix Version' : 'Affects Version';
  const finalLabel = label || defaultLabel;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const selectedVersion = versions.find(v => v.id === value);

  // Filter versions based on criteria
  const filteredVersions = versions.filter(version => {
    // Filter by release status if specified
    if (showOnlyUnreleased && version.status !== 'unreleased') {
      return false;
    }

    // Filter by search term
    if (searchTerm) {
      return version.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             version.description?.toLowerCase().includes(searchTerm.toLowerCase());
    }

    return true;
  });

  // Group versions by status
  const groupedVersions = {
    unreleased: filteredVersions.filter(v => v.status === 'unreleased'),
    released: filteredVersions.filter(v => v.status === 'released'),
    archived: filteredVersions.filter(v => v.status === 'archived'),
  };

  const handleSelectVersion = (versionId: number) => {
    onChange(versionId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange(undefined);
  };

  const getStatusColor = (status: Version['status']) => {
    switch (status) {
      case 'unreleased': return 'text-blue-600';
      case 'released': return 'text-green-600';
      case 'archived': return 'text-gray-500';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: Version['status']) => {
    switch (status) {
      case 'unreleased':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'released':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'archived':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
            <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const formatReleaseDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Label */}
      {finalLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {finalLabel}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Field */}
      <div
        className={`
          relative border rounded-md cursor-pointer focus-within:ring-2 focus-within:ring-blue-500
          ${error ? 'border-red-300' : 'border-gray-300'}
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
        `}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <div className="px-3 py-2 flex items-center">
          {selectedVersion ? (
            <div className="flex items-center flex-1">
              <span className={`mr-2 ${getStatusColor(selectedVersion.status)}`}>
                {getStatusIcon(selectedVersion.status)}
              </span>
              <span className="text-gray-900">{selectedVersion.name}</span>
              {selectedVersion.releaseDate && (
                <span className="text-gray-500 text-sm ml-2">
                  ({formatReleaseDate(selectedVersion.releaseDate)})
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-500 flex-1">{placeholder}</span>
          )}

          <div className="flex items-center space-x-1">
            {selectedVersion && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search versions..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Version List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredVersions.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                {searchTerm ? 'No versions found' : 'No versions available'}
              </div>
            ) : (
              <>
                {/* Unreleased Versions */}
                {groupedVersions.unreleased.length > 0 && (
                  <div>
                    <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Unreleased
                    </div>
                    {groupedVersions.unreleased.map(version => (
                      <div
                        key={version.id}
                        className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50"
                        onClick={() => handleSelectVersion(version.id)}
                      >
                        <div className="flex items-center">
                          <span className={`mr-2 ${getStatusColor(version.status)}`}>
                            {getStatusIcon(version.status)}
                          </span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {version.name}
                            </div>
                            {version.description && (
                              <div className="text-xs text-gray-500 mt-1">
                                {version.description}
                              </div>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              {version.issueCount || 0} issues
                            </div>
                          </div>
                          {value === version.id && (
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Released Versions */}
                {groupedVersions.released.length > 0 && !showOnlyUnreleased && (
                  <div>
                    <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Released
                    </div>
                    {groupedVersions.released.map(version => (
                      <div
                        key={version.id}
                        className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50"
                        onClick={() => handleSelectVersion(version.id)}
                      >
                        <div className="flex items-center">
                          <span className={`mr-2 ${getStatusColor(version.status)}`}>
                            {getStatusIcon(version.status)}
                          </span>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {version.name}
                            </div>
                            {version.releaseDate && (
                              <div className="text-xs text-gray-500 mt-1">
                                Released {formatReleaseDate(version.releaseDate)}
                              </div>
                            )}
                          </div>
                          {value === version.id && (
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};