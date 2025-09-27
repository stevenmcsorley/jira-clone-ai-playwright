/**
 * Release Management Page
 *
 * Jira-style version and release planning
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useProjects } from '../../hooks/useProjects';

interface Release {
  id: number;
  name: string;
  description?: string;
  releaseDate?: string;
  status: 'unreleased' | 'released' | 'archived';
  issueCount: number;
  completedIssues: number;
  createdAt: string;
}

export const Releases: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects } = useProjects();

  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRelease, setNewRelease] = useState({
    name: '',
    description: '',
    releaseDate: ''
  });

  const currentProject = projects.find(p => p.id === Number(projectId));

  // Check if create modal should be open from URL params
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
      setSearchParams(params => {
        params.delete('create');
        return params;
      });
    }
  }, [searchParams, setSearchParams]);

  // Mock data for now - would fetch from API
  useEffect(() => {
    const mockReleases: Release[] = [
      {
        id: 1,
        name: 'v1.0.0 - Initial Release',
        description: 'First stable release with core features',
        releaseDate: '2024-02-15',
        status: 'released',
        issueCount: 25,
        completedIssues: 25,
        createdAt: '2024-01-01'
      },
      {
        id: 2,
        name: 'v1.1.0 - Navigation Update',
        description: 'Enhanced navigation and UX improvements',
        releaseDate: '2024-03-01',
        status: 'unreleased',
        issueCount: 12,
        completedIssues: 8,
        createdAt: '2024-02-16'
      },
      {
        id: 3,
        name: 'v1.2.0 - Sprint Features',
        description: 'Advanced sprint management and analytics',
        status: 'unreleased',
        issueCount: 18,
        completedIssues: 3,
        createdAt: '2024-02-20'
      }
    ];

    setTimeout(() => {
      setReleases(mockReleases);
      setLoading(false);
    }, 500);
  }, []);

  const handleCreateRelease = () => {
    if (!newRelease.name.trim()) return;

    const release: Release = {
      id: Date.now(),
      name: newRelease.name,
      description: newRelease.description || undefined,
      releaseDate: newRelease.releaseDate || undefined,
      status: 'unreleased',
      issueCount: 0,
      completedIssues: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setReleases([release, ...releases]);
    setNewRelease({ name: '', description: '', releaseDate: '' });
    setShowCreateModal(false);
  };

  const handleReleaseVersion = (id: number) => {
    setReleases(releases.map(r =>
      r.id === id ? { ...r, status: 'released' as const, releaseDate: new Date().toISOString().split('T')[0] } : r
    ));
  };

  const getStatusColor = (status: Release['status']) => {
    switch (status) {
      case 'released': return 'bg-green-100 text-green-800';
      case 'unreleased': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading releases...</p>
        </div>
      </div>
    );
  }

  const unreleasedVersions = releases.filter(r => r.status === 'unreleased');
  const releasedVersions = releases.filter(r => r.status === 'released');

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Releases</h1>
            <p className="text-gray-600 mt-1">
              Plan and track version releases for {currentProject?.name}
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create Version
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Unreleased Versions */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Unreleased Versions ({unreleasedVersions.length})
            </h2>

            {unreleasedVersions.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600">No unreleased versions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unreleasedVersions.map((release) => (
                  <div key={release.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {release.name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(release.status)}`}>
                            {release.status}
                          </span>
                        </div>

                        {release.description && (
                          <p className="text-gray-600 mb-4">{release.description}</p>
                        )}

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Issues: {release.completedIssues}/{release.issueCount}
                            </span>
                            <span className="text-sm text-gray-500">
                              {getProgressPercentage(release.completedIssues, release.issueCount)}% complete
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${getProgressPercentage(release.completedIssues, release.issueCount)}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {release.releaseDate && (
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              <span>Release: {new Date(release.releaseDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span>Created: {new Date(release.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm">
                          Edit
                        </Button>
                        {release.completedIssues === release.issueCount && release.issueCount > 0 && (
                          <Button
                            size="sm"
                            onClick={() => handleReleaseVersion(release.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Release
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Released Versions */}
          <section>
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Released Versions ({releasedVersions.length})
            </h2>

            {releasedVersions.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-600">No released versions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {releasedVersions.map((release) => (
                  <div key={release.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-gray-900">{release.name}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(release.status)}`}>
                          Released
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {release.issueCount} issues • Released {new Date(release.releaseDate!).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Create Release Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Create Version</h2>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Version Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={newRelease.name}
                  onChange={(e) => setNewRelease({ ...newRelease, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., v1.2.0, Sprint 5 Release"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={newRelease.description}
                  onChange={(e) => setNewRelease({ ...newRelease, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe this release..."
                />
              </div>

              <div>
                <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Release Date
                </label>
                <input
                  type="date"
                  id="releaseDate"
                  value={newRelease.releaseDate}
                  onChange={(e) => setNewRelease({ ...newRelease, releaseDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewRelease({ name: '', description: '', releaseDate: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRelease}
                disabled={!newRelease.name.trim()}
              >
                Create Version
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};