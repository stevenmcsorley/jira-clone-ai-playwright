/**
 * Breadcrumb Navigation Component
 *
 * Jira-style breadcrumb navigation for better user orientation
 */

import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjects';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const { projectId, issueId } = useParams<{ projectId: string; issueId: string }>();
  const { projects } = useProjects();

  const currentProject = projects.find(p => p.id === Number(projectId));

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [];
    const path = location.pathname;

    // Always start with Projects if we're in a project context
    if (projectId && currentProject) {
      breadcrumbs.push({
        label: 'Projects',
        href: '/projects'
      });

      breadcrumbs.push({
        label: currentProject.name,
        href: `/projects/${projectId}`
      });

      // Determine current section based on path
      if (path.includes('/backlog')) {
        breadcrumbs.push({
          label: 'Backlog',
          isActive: true
        });
      } else if (path.includes('/issues') && !issueId) {
        breadcrumbs.push({
          label: 'Issues',
          isActive: true
        });
      } else if (path.includes('/issues') && issueId) {
        breadcrumbs.push({
          label: 'Issues',
          href: `/projects/${projectId}/issues`
        });
        breadcrumbs.push({
          label: `${currentProject.key}-${issueId}`,
          isActive: true
        });

        // If editing an issue
        if (path.includes('/edit')) {
          breadcrumbs[breadcrumbs.length - 1].href = `/projects/${projectId}/issues/${issueId}`;
          breadcrumbs.push({
            label: 'Edit',
            isActive: true
          });
        }
      } else if (path.includes('/reports')) {
        breadcrumbs.push({
          label: 'Reports',
          isActive: true
        });
      } else if (path.includes('/history')) {
        breadcrumbs.push({
          label: 'Sprint History',
          isActive: true
        });
      } else if (path.includes('/components')) {
        breadcrumbs.push({
          label: 'Components',
          isActive: true
        });
      } else if (path.includes('/releases')) {
        breadcrumbs.push({
          label: 'Releases',
          isActive: true
        });
      } else if (path.includes('/settings')) {
        breadcrumbs.push({
          label: 'Settings',
          isActive: true
        });
      } else if (path.includes('/search')) {
        breadcrumbs.push({
          label: 'Search Results',
          isActive: true
        });
      } else if (path.includes('/create')) {
        if (path.includes('/issues/create')) {
          breadcrumbs.push({
            label: 'Issues',
            href: `/projects/${projectId}/issues`
          });
          breadcrumbs.push({
            label: 'Create Issue',
            isActive: true
          });
        }
      } else if (path === `/projects/${projectId}`) {
        breadcrumbs.push({
          label: 'Board',
          isActive: true
        });
      }
    } else if (path === '/projects') {
      breadcrumbs.push({
        label: 'Projects',
        isActive: true
      });
    } else if (path.includes('/projects/create')) {
      breadcrumbs.push({
        label: 'Projects',
        href: '/projects'
      });
      breadcrumbs.push({
        label: 'Create Project',
        isActive: true
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs if there's only one item or none
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      className="flex items-center space-x-1 text-sm text-gray-500 px-6 py-3 bg-white border-b border-gray-200"
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg
                className="w-4 h-4 text-gray-400 mx-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}

            {item.isActive ? (
              <span
                className="font-medium text-gray-900 truncate max-w-xs"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href!}
                className="hover:text-blue-600 hover:underline transition-colors truncate max-w-xs font-medium"
                title={item.label}
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Utility hook for breadcrumb data that could be used with XState
export const useBreadcrumbData = () => {
  const location = useLocation();
  const { projectId, issueId } = useParams<{ projectId: string; issueId: string }>();
  const { projects } = useProjects();

  const currentProject = projects.find(p => p.id === Number(projectId));

  return {
    currentProject,
    currentPath: location.pathname,
    projectId,
    issueId,
    isProjectContext: !!projectId,
    isIssueContext: !!issueId
  };
};