/**
 * Project Components Management Page
 *
 * Jira-style component management for organizing issues
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useProjects } from '../../hooks/useProjects';

interface Component {
  id: number;
  name: string;
  description?: string;
  leadId?: number;
  leadName?: string;
  issueCount: number;
  createdAt: string;
}

export const Components: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects } = useProjects();

  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newComponent, setNewComponent] = useState({
    name: '',
    description: '',
    leadId: undefined as number | undefined
  });

  const currentProject = projects.find(p => p.id === Number(projectId));

  // Check if create modal should be open from URL params
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
      // Remove the parameter to clean up URL
      setSearchParams(params => {
        params.delete('create');
        return params;
      });
    }
  }, [searchParams, setSearchParams]);

  // Mock data for now - would fetch from API
  useEffect(() => {
    const mockComponents: Component[] = [
      {
        id: 1,
        name: 'Frontend',
        description: 'React frontend components and UI',
        leadId: 1,
        leadName: 'John Doe',
        issueCount: 12,
        createdAt: '2024-01-15'
      },
      {
        id: 2,
        name: 'Backend',
        description: 'Node.js backend services and APIs',
        leadId: 1,
        leadName: 'John Doe',
        issueCount: 8,
        createdAt: '2024-01-10'
      },
      {
        id: 3,
        name: 'Database',
        description: 'Database migrations and schema',
        leadId: undefined,
        leadName: undefined,
        issueCount: 3,
        createdAt: '2024-01-05'
      }
    ];

    setTimeout(() => {
      setComponents(mockComponents);
      setLoading(false);
    }, 500);
  }, []);

  const handleCreateComponent = () => {
    if (!newComponent.name.trim()) return;

    const component: Component = {
      id: Date.now(),
      name: newComponent.name,
      description: newComponent.description || undefined,
      leadId: newComponent.leadId,
      leadName: newComponent.leadId ? 'John Doe' : undefined,
      issueCount: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setComponents([...components, component]);
    setNewComponent({ name: '', description: '', leadId: undefined });
    setShowCreateModal(false);
  };

  const handleDeleteComponent = (id: number) => {
    if (confirm('Are you sure you want to delete this component? Issues will remain but lose their component assignment.')) {
      setComponents(components.filter(c => c.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading components...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Components</h1>
            <p className="text-gray-600 mt-1">
              Organize issues by component areas in {currentProject?.name}
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Component
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {components.length === 0 ? (
            // Empty State
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No components yet</h3>
              <p className="text-gray-600 mb-4">
                Components help organize issues by functional areas of your project.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create your first component
              </Button>
            </div>
          ) : (
            // Components List
            <div className="space-y-4">
              {components.map((component) => (
                <div key={component.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {component.name}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {component.issueCount} {component.issueCount === 1 ? 'issue' : 'issues'}
                        </span>
                      </div>

                      {component.description && (
                        <p className="text-gray-600 mb-3">{component.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          <span>Lead: {component.leadName || 'Unassigned'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <span>Created: {new Date(component.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm">
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteComponent(component.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Component Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Create Component</h2>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={newComponent.name}
                  onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Frontend, Backend, Database"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newComponent.description}
                  onChange={(e) => setNewComponent({ ...newComponent, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe this component..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewComponent({ name: '', description: '', leadId: undefined });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateComponent}
                disabled={!newComponent.name.trim()}
              >
                Create Component
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};