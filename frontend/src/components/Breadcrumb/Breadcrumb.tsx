/**
 * Breadcrumb Navigation Component
 *
 * Jira-style breadcrumb navigation for better user orientation
 */

import { Link, useLocation, useParams } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjects';
import { buildBreadcrumbs, visibleCrumbIndexes } from '../../utils/breadcrumbs';

const labelClassName = 'truncate max-w-[9rem] sm:max-w-[14rem] md:max-w-xs';

export const Breadcrumb = () => {
  const { currentPath, projectId, issueId, currentProject } = useBreadcrumbData();
  const breadcrumbs = buildBreadcrumbs({ pathname: currentPath, projectId, issueId, project: currentProject });

  // Don't show breadcrumbs if there's only one item or none
  if (breadcrumbs.length <= 1) {
    return null;
  }

  const mobileIndexes = visibleCrumbIndexes(breadcrumbs.length);

  return (
    <nav
      className="flex items-center space-x-1 text-sm text-gray-500 min-w-0 overflow-hidden px-4 md:px-6 py-3 bg-white border-b border-gray-200"
      aria-label="Breadcrumb"
      data-testid="breadcrumb"
    >
      <ol className="flex min-w-0 flex-nowrap items-center gap-1">
        {breadcrumbs.map((item, index) => (
          <li
            key={index}
            className={`flex min-w-0 items-center ${mobileIndexes.includes(index) ? '' : 'max-md:hidden'}`}
            data-testid="breadcrumb-item"
          >
            {index > 0 && (
              <svg
                className={`w-4 h-4 shrink-0 text-gray-400 mx-2 ${index === mobileIndexes[0] ? 'max-md:hidden' : ''}`}
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
                className={`font-medium text-gray-900 ${labelClassName}`}
                title={item.label}
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href!}
                className={`hover:text-blue-600 hover:underline transition-colors font-medium max-md:inline-flex max-md:min-h-11 max-md:items-center ${labelClassName}`}
                title={item.label}
              >
                <span className="truncate">{item.label}</span>
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
