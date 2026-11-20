import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigationType, useSearchParams } from "react-router-dom";
import { Pagination } from "../../components/Pagination";
import { ProjectCard, ProjectListHeader, projectListClass } from "../../components/ProjectCard";
import { ProjectsSkeleton } from "../../components/ProjectsToolbar/ProjectsSkeleton";
import { ProjectsToolbar } from "../../components/ProjectsToolbar/ProjectsToolbar";
import { Button } from "../../components/ui/Button";
import { useProjects } from "../../hooks/useProjects";
import { paginate } from "../../utils/pagination";
import { filterProjects, listStateToSearch, parseListState, sortProjects } from "../../utils/projectSort";
import type { ProjectSortId } from "../../utils/projectSort";

// Scope shared header adjustments to the Projects page.
const mobileHeader =
  "max-sm:[header:has(~_&)>div]:flex-wrap max-sm:[header:has(~_&)>div]:gap-2";

const PROJECTS_PAGE_SIZE = 12;
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
  const { sort, page: requestedPage } = parseListState(params.toString(), storedSort);
  const listRef = useRef<HTMLDivElement>(null);
  const urlQuery = (params.get("q") ?? "").trimStart().slice(0, 100);
  const [searchText, setSearchText] = useState(urlQuery);
  const q = searchText.trim();

  // Router transitions may finish after the next keystroke. Only sync the
  // input from navigation that did not come from typing in this field.
  useEffect(() => {
    if (navigationType !== "REPLACE") setSearchText(urlQuery);
  }, [navigationType, urlQuery]);
  const sortedProjects = useMemo(() => sortProjects(projects, sort), [projects, sort]);
  const filteredProjects = useMemo(() => filterProjects(sortedProjects, q), [sortedProjects, q]);
  const { items: visibleProjects, page, pageCount, start, end, total } =
    paginate(filteredProjects, requestedPage, PROJECTS_PAGE_SIZE);

  useEffect(() => {
    const urlPage = params.get("page");
    const canonicalPage = page === 1 ? null : String(page);
    if (loading || error || q !== urlQuery.trim() || urlPage === canonicalPage) return;

    const search = new URLSearchParams(params);
    if (canonicalPage === null) search.delete("page");
    else search.set("page", canonicalPage);
    setParams(search, { replace: true });
  }, [loading, error, page, params, q, urlQuery, setParams]);

  const changePage = (nextPage: number) => {
    if (nextPage === page) return;
    const search = new URLSearchParams(params);
    if (nextPage === 1) search.delete("page");
    else search.set("page", String(nextPage));
    setParams(search);
    listRef.current?.scrollIntoView?.({ block: "start" });
  };

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
              <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
              <p className="mt-2 text-gray-600">
                Pick a project to open its board.
              </p>
            </div>
            <Link to="/projects/create">
              <Button className="max-md:min-h-11" data-testid="create-project-button">
                Create Project
              </Button>
            </Link>
          </div>
        </div>

        {loading && <ProjectsSkeleton />}

        {!loading && error && (
          <div role="alert" className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-gray-900">Could not load projects. Please try again.</p>
            <Button data-testid="projects-retry" onClick={() => void refetch()}>Try again</Button>
          </div>
        )}

        {!loading && !error && (
          <ProjectsToolbar
            query={searchText}
            sort={sort}
            shown={pageCount > 1 ? `${start}-${end}` : total}
            total={projects.length}
            onQueryChange={changeQuery}
            onSortChange={changeSort}
          />
        )}

        {!loading && !error && visibleProjects.length > 0 && (
          <>
            <div ref={listRef} className={projectListClass}>
              <ProjectListHeader />
              <div className="divide-y divide-gray-200">
                {visibleProjects.map((project) => <ProjectCard key={project.id} project={project} />)}
              </div>
            </div>
            <Pagination page={page} pageCount={pageCount} onPageChange={changePage} className="mt-4" />
          </>
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
          </div>
        )}
      </main>
    </div>
  );
};
