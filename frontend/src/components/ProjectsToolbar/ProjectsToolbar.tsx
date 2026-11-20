import { useEffect, useRef } from "react";
import { SORT_OPTIONS } from "../../utils/projectSort";
import type { ProjectSortId } from "../../utils/projectSort";

interface ProjectsToolbarProps {
  query: string;
  sort: ProjectSortId;
  shown: number | string;
  total: number;
  onQueryChange: (query: string) => void;
  onSortChange: (sort: ProjectSortId) => void;
  className?: string;
}

export const ProjectsToolbar = ({
  query, sort, shown, total, onQueryChange, onSortChange, className,
}: ProjectsToolbarProps) => {
  const searchRef = useRef<HTMLInputElement>(null);
  const hint = SORT_OPTIONS.find(({ id }) => id === sort)?.hint;

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.defaultPrevented || event.isComposing ||
          event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

      const target = event.target;
      if (target instanceof HTMLElement &&
          (target.closest("input, textarea, select") || target.isContentEditable)) return;

      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return (
    <div className={["mb-4 space-y-2", className].filter(Boolean).join(" ")}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex min-w-0 gap-2 sm:flex-1">
          <input
            ref={searchRef}
            type="search"
            aria-label="Search projects"
            data-testid="projects-search"
            placeholder="Search projects"
            value={query}
            maxLength={100}
            onChange={(event) => onQueryChange(event.currentTarget.value)}
            className="min-h-11 min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 text-gray-900"
          />
          {query && (
            <button
              type="button"
              data-testid="projects-clear-search"
              className="min-h-11 shrink-0 rounded-md border border-gray-300 bg-white px-3 text-gray-700 hover:bg-gray-100"
              aria-label="Clear project search"
              onClick={() => {
                onQueryChange("");
                searchRef.current?.focus();
              }}
            >
              Clear
            </button>
          )}
        </div>
        <select
          aria-label="Sort projects"
          aria-describedby="projects-sort-hint"
          data-testid="projects-sort"
          title={hint}
          value={sort}
          onChange={(event) => onSortChange(event.currentTarget.value as ProjectSortId)}
          className="min-h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-900 sm:w-auto"
        >
          {SORT_OPTIONS.map(({ id, label, hint }) => (
            <option key={id} value={id} title={hint}>{label}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm text-gray-600">
        <p data-testid="projects-count" role="status">Showing {shown} of {total} projects</p>
        <p id="projects-sort-hint">{hint}</p>
      </div>
    </div>
  );
};
