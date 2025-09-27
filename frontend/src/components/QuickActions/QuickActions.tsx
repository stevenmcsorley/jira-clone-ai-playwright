/**
 * Quick Actions Menu Component
 *
 * Jira-style quick actions dropdown for common tasks
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../ui/Button';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
  divider?: boolean;
}

export const QuickActions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const quickActions: QuickAction[] = [
    {
      id: 'create-issue',
      label: 'Create Issue',
      description: 'Create a new issue in current project',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      ),
      action: () => {
        if (projectId) {
          navigate(`/projects/${projectId}/issues/create`);
        }
        setIsOpen(false);
      },
      shortcut: '⌘ I'
    },
    {
      id: 'create-epic',
      label: 'Create Epic',
      description: 'Create a new epic to group related issues',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
        </svg>
      ),
      action: () => {
        if (projectId) {
          navigate(`/projects/${projectId}/issues/create?type=epic`);
        }
        setIsOpen(false);
      },
      shortcut: '⌘ E'
    },
    {
      id: 'create-sprint',
      label: 'Create Sprint',
      description: 'Start a new sprint for your team',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      ),
      action: () => {
        if (projectId) {
          navigate(`/projects/${projectId}/backlog?create-sprint=true`);
        }
        setIsOpen(false);
      },
      shortcut: '⌘ S',
      divider: true
    },
    {
      id: 'create-project',
      label: 'Create Project',
      description: 'Start a new project',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      ),
      action: () => {
        navigate('/projects/create');
        setIsOpen(false);
      },
      shortcut: '⌘ P'
    },
    {
      id: 'create-component',
      label: 'Create Component',
      description: 'Add a new component to organize issues',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      ),
      action: () => {
        if (projectId) {
          navigate(`/projects/${projectId}/components?create=true`);
        }
        setIsOpen(false);
      },
      shortcut: '⌘ C'
    },
    {
      id: 'create-version',
      label: 'Create Version',
      description: 'Plan a new release version',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.934 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732L9.854 7.2l1.179-4.456A1 1 0 0112 2z" clipRule="evenodd" />
        </svg>
      ),
      action: () => {
        if (projectId) {
          navigate(`/projects/${projectId}/releases?create=true`);
        }
        setIsOpen(false);
      },
      shortcut: '⌘ V'
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !isOpen) {
        const action = quickActions.find(a =>
          a.shortcut === `⌘ ${e.key.toUpperCase()}`
        );
        if (action) {
          e.preventDefault();
          action.action();
        }
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, quickActions]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Plus Button */}
      <Button
        variant="primary"
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 p-0 rounded-full flex items-center justify-center"
        title="Quick actions (+ )"
      >
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-45' : ''
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100 mb-2">
              Quick Actions
            </div>

            {quickActions.map((action, index) => (
              <React.Fragment key={action.id}>
                <button
                  onClick={action.action}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-500 group-hover:text-gray-700">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">
                        {action.label}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {action.description}
                      </div>
                    </div>
                    {action.shortcut && (
                      <kbd className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded border font-mono">
                        {action.shortcut}
                      </kbd>
                    )}
                  </div>
                </button>

                {/* Divider */}
                {action.divider && index < quickActions.length - 1 && (
                  <div className="my-2 border-t border-gray-100" />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-2 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              Use keyboard shortcuts for quick access
            </div>
          </div>
        </div>
      )}
    </div>
  );
};