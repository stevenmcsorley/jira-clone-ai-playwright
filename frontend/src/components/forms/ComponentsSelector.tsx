/**
 * ComponentsSelector Component
 *
 * Multi-select dropdown for assigning project components to issues.
 * Integrates with the existing Components management system.
 */

import React, { useState, useRef, useEffect } from 'react';

interface Component {
  id: number;
  name: string;
  description?: string;
  leadId?: number;
  leadName?: string;
}

interface ComponentsSelectorProps {
  value: number[]; // Array of component IDs
  onChange: (componentIds: number[]) => void;
  components: Component[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  maxSelections?: number;
  className?: string;
}

export const ComponentsSelector: React.FC<ComponentsSelectorProps> = ({
  value = [],
  onChange,
  components = [],
  label = 'Components',
  placeholder = 'Select components',
  required = false,
  disabled = false,
  error,
  maxSelections,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const selectedComponents = components.filter(comp => value.includes(comp.id));
  const filteredComponents = components.filter(comp =>
    comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleComponent = (componentId: number) => {
    const isSelected = value.includes(componentId);
    let newValue: number[];

    if (isSelected) {
      newValue = value.filter(id => id !== componentId);
    } else {
      if (maxSelections && value.length >= maxSelections) {
        return; // Don't add if max selections reached
      }
      newValue = [...value, componentId];
    }

    onChange(newValue);
  };

  const handleRemoveComponent = (componentId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const newValue = value.filter(id => id !== componentId);
    onChange(newValue);
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange([]);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {maxSelections && (
            <span className="text-gray-500 text-xs ml-2">
              (max {maxSelections})
            </span>
          )}
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
        <div className="min-h-[38px] px-3 py-2 flex flex-wrap gap-1 items-center">
          {/* Selected Components */}
          {selectedComponents.map(component => (
            <span
              key={component.id}
              className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
            >
              <span className="mr-1">{component.name}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => handleRemoveComponent(component.id, e)}
                  className="hover:text-blue-600"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </span>
          ))}

          {/* Placeholder */}
          {selectedComponents.length === 0 && (
            <span className="text-gray-500">{placeholder}</span>
          )}

          {/* Clear Button */}
          {selectedComponents.length > 0 && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          {/* Dropdown Arrow */}
          <svg className="w-4 h-4 text-gray-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search components..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Component List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredComponents.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                {searchTerm ? 'No components found' : 'No components available'}
              </div>
            ) : (
              filteredComponents.map(component => {
                const isSelected = value.includes(component.id);
                const isDisabled = maxSelections && !isSelected && value.length >= maxSelections;

                return (
                  <div
                    key={component.id}
                    className={`
                      p-3 cursor-pointer border-b border-gray-50 last:border-0
                      ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onClick={() => !isDisabled && handleToggleComponent(component.id)}
                  >
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {component.name}
                          </span>
                          {isSelected && (
                            <svg className="w-4 h-4 text-blue-600 ml-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        {component.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {component.description}
                          </p>
                        )}
                        {component.leadName && (
                          <p className="text-xs text-gray-400 mt-1">
                            Lead: {component.leadName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <div className="text-xs text-gray-500">
              {selectedComponents.length} of {maxSelections || '∞'} selected
            </div>
          </div>
        </div>
      )}
    </div>
  );
};