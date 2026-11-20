import { useEffect, useMemo, useState } from "react";
import { Link, useNavigationType, useSearchParams } from "react-router-dom";
import { ProjectCard } from "../../components/ProjectCard";
import { ProjectsSkeleton } from "../../components/ProjectsToolbar/ProjectsSkeleton";
import { ProjectsToolbar } from "../../components/ProjectsToolbar/ProjectsToolbar";
import { Button } from "../../components/ui/Button";
import { useProjects } from "../../hooks/useProjects";
import { filterProjects, listStateToSearch, parseListState, sortProjects } from "../../utils/projectSort";
import type { ProjectSortId } from "../../utils/projectSort";

// Scope shared header adjustments to the Projects page.
const mobileHeader =
  "max-sm:[header:has(~_&)>div]:flex-wrap max-sm:[header:has(~_&)>div]:gap-2 max-md:[header:has(~_&)_[data-testid=create-project-button]]:min-h-11";

const projectGrid = "grid grid-cols-1 gap-4";
const sortStorageKey = "ossicone.projects.sort";

const readStoredSort = () => {
  try {
    return localStorage.getItem(sortStorageKey);
  } catch {
    return null;
  }
};

export const ProjectsList = () => {
  const { projects, loading, error, refetch } = useProjects();
  const [params, setParams] = useSearchParams();
  const [storedSort, setStoredSort] = useState(readStoredSort);
  const navigationType = useNavigationType();
  const { sort } = parseListState(params.toString(), storedSort);
  const urlQuery = (params.get("q") ?? "").trimStart().slice(0, 100);
  const [searchText, setSearchText] = useState(urlQuery);
  const q = searchText.trim();

  // Router transitions may finish after the next keystroke. Only sync the
  // input from navigation that did not come from typing in this field.
  useEffect(() => {
    if (navigationType !== "REPLACE") setSearchText(urlQuery);
  }, [navigationType, urlQuery]);
  const sortedProjects = useMemo(() => sortProjects(projects, sort), [projects, sort]);
  const visibleProjects = filterProjects(sortedProjects, q);

  const changeQuery = (query: string) => {
    setSearchText(query);
    const search = new URLSearchParams(listStateToSearch({ q: query, sort }));
    if (sort === "updated" && parseListState("", storedSort).sort !== "updated") {
      search.set("sort", sort);
    }
    setParams(search, { replace: true });
  };

  const changeSort = (nextSort: ProjectSortId) => {
    setStoredSort(nextSort);
    try {
      localStorage.setItem(sortStorageKey, nextSort);
    } catch {
      // The URL and in-memory preference still work when storage is unavailable.
    }
    setParams(listStateToSearch({ q: searchText, sort: nextSort }));
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${mobileHeader}`}>
      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
              <p className="mt-2 text-gray-600">
                Choose a project to view its kanban board and manage issues.
              </p>
            </div>
            <Link to="/projects/create">
              <Button className="max-md:min-h-11" data-testid="create-project-button">
                Create Project
              </Button>
            </Link>
          </div>
        </div>

        {loading && <ProjectsSkeleton className={projectGrid} />}

        {!loading && error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-white p-4">
            <p className="mb-3 text-gray-900">Could not load projects. Please try again.</p>
            <Button data-testid="projects-retry" onClick={() => void refetch()}>Try again</Button>
          </div>
        )}

        {!loading && !error && (
          <ProjectsToolbar
            query={searchText}
            sort={sort}
            shown={visibleProjects.length}
            total={projects.length}
            onQueryChange={changeQuery}
            onSortChange={changeSort}
          />
        )}

        {!loading && !error && visibleProjects.length > 0 && (
          <div className={projectGrid}>
            {visibleProjects.map((project) => <ProjectCard key={project.id} project={project} />)}
          </div>
        )}

        {!loading && !error && projects.length > 0 && visibleProjects.length === 0 && (
          <div className="py-12 text-center">
            <p className="mb-4 wrap-anywhere text-gray-900">No projects match "{q}"</p>
            <Button onClick={() => changeQuery("")}>Clear search</Button>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="py-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No projects yet
            </h3>
            <p className="mb-4 text-gray-600">
              Get started by creating your first project.
            </p>
            <Link to="/projects/create">
              <Button>Create Your First Project</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};
