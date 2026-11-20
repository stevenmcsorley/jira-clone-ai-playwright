export type Crumb = { label: string; href?: string; isActive?: boolean };

export const buildBreadcrumbs = ({
  pathname: path,
  projectId,
  issueId,
  project
}: {
  pathname: string;
  projectId?: string;
  issueId?: string;
  project?: { name: string; key: string } | null;
}): Crumb[] => {
  const breadcrumbs: Crumb[] = [];

  // Always start with Projects if we're in a project context
  if (projectId && project) {
    breadcrumbs.push({
      label: 'Projects',
      href: '/projects'
    });

    breadcrumbs.push({
      label: project.name,
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
        label: `${project.key}-${issueId}`,
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
      // Handle specific report pages
      if (path.includes('/reports/burndown')) {
        breadcrumbs.push({
          label: 'Reports',
          href: `/projects/${projectId}/reports`
        });
        breadcrumbs.push({
          label: 'Burndown Chart',
          isActive: true
        });
      } else if (path.includes('/reports/burnup')) {
        breadcrumbs.push({
          label: 'Reports',
          href: `/projects/${projectId}/reports`
        });
        breadcrumbs.push({
          label: 'Burnup Report',
          isActive: true
        });
      } else if (path.includes('/reports/velocity')) {
        breadcrumbs.push({
          label: 'Reports',
          href: `/projects/${projectId}/reports`
        });
        breadcrumbs.push({
          label: 'Velocity Report',
          isActive: true
        });
      } else if (path.includes('/reports/cumulative-flow')) {
        breadcrumbs.push({
          label: 'Reports',
          href: `/projects/${projectId}/reports`
        });
        breadcrumbs.push({
          label: 'Cumulative Flow Diagram',
          isActive: true
        });
      } else if (path.includes('/reports/cycle-time')) {
        breadcrumbs.push({
          label: 'Reports',
          href: `/projects/${projectId}/reports`
        });
        breadcrumbs.push({
          label: 'Cycle Time Report',
          isActive: true
        });
      } else {
        // Main reports page
        breadcrumbs.push({
          label: 'Reports',
          isActive: true
        });
      }
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

export const visibleCrumbIndexes = (count: number, maxMobile = 2): number[] => {
  const start = Math.max(0, count - maxMobile);
  return Array.from({ length: count - start }, (_, index) => start + index);
};
