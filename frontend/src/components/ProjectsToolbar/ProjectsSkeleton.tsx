import { ProjectListHeader, projectColumns, projectListClass } from "../ProjectCard";

export const ProjectsSkeleton = ({ className }: { className?: string }) => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading projects"
    data-testid="projects-loading"
    className={[projectListClass, className].filter(Boolean).join(" ")}
  >
    <ProjectListHeader />
    <div className="divide-y divide-gray-200">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} aria-hidden="true" className={`grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5 px-4 py-3 motion-safe:animate-pulse lg:px-5 ${projectColumns}`}>
          <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 lg:gap-3">
            <div className="size-9 shrink-0 rounded-lg bg-gray-200" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-4 w-28 max-w-full rounded bg-gray-200" />
              <div className="hidden h-3 w-4/5 rounded bg-gray-100 lg:block" />
            </div>
          </div>
          <div className="col-span-2 h-4 w-4/5 rounded bg-gray-100 lg:hidden" />
          <div className="col-span-2 space-y-1 lg:col-span-1">
            <div className="flex justify-between">
              <div className="h-4 w-14 rounded bg-gray-200" />
              <div className="h-4 w-8 rounded bg-gray-200" />
            </div>
            <div className="h-1.5 rounded-full bg-gray-200" />
          </div>
          <div className="hidden h-6 w-24 rounded bg-gray-100 lg:block" />
          <div className="hidden min-w-0 items-center gap-2 lg:flex">
            <div className="size-6 shrink-0 rounded-full bg-gray-200" />
            <div className="h-4 w-16 rounded bg-gray-100" />
          </div>
          <div className="col-start-2 row-start-1 h-4 w-16 justify-self-end rounded bg-gray-100 lg:col-start-5" />
        </div>
      ))}
    </div>
  </div>
);
