import { Link } from "react-router-dom";
import type { Project } from "../../types/domain.types";
import { tidyDescription } from "../../utils/projectDescription";
import { activitySeries, displayName, formatUpdated, initials, statusCounts } from "../../utils/projectStats";
import { ProjectAvatar } from "./ProjectAvatar";
import { Sparkline } from "./Sparkline";
import { StatusBar } from "./StatusBar";

export const projectListClass = "overflow-hidden rounded-xl border border-gray-200 bg-white";
export const projectColumns = "lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1.5fr)_7rem_minmax(0,1.2fr)_6.5rem] lg:gap-x-6 lg:items-center";

export const ProjectListHeader = () => (
  <div className={`hidden border-b border-gray-200 bg-gray-50 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-gray-500 lg:grid lg:px-5 ${projectColumns}`}>
    <span>Project</span>
    <span>Progress</span>
    <span>Activity</span>
    <span>Lead</span>
    <span className="text-right">Updated</span>
  </div>
);

interface ProjectCardProps {
  project: Project;
  className?: string;
}

export const ProjectCard = ({ project, className }: ProjectCardProps) => {
  const counts = statusCounts(project.issues);
  const description = tidyDescription(project.description).replace(/\s+/g, " ");
  const leadName = displayName(project.lead);
  const updated = formatUpdated(project.updatedAt);
  const nameId = `project-name-${project.id}`;

  return (
    <Link
      to={`/projects/${project.id}`}
      data-testid={`project-card-${project.id}`}
      aria-labelledby={nameId}
      className={[`grid min-h-11 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-3 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 lg:min-h-16 lg:px-5 ${projectColumns}`, className].filter(Boolean).join(" ")}
    >
      <div className="contents lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-x-3">
        <ProjectAvatar name={project.name} className="col-start-1 row-start-1 lg:row-span-2" />
        <div className="col-start-2 row-start-1 flex min-w-0 items-center gap-2">
          <h2 id={nameId} className="truncate text-sm font-medium text-gray-900" title={project.name}>
            {project.name}
          </h2>
          <span className="max-w-1/3 shrink-0 truncate rounded border border-gray-200 px-1.5 font-mono text-[11px] font-medium uppercase text-gray-500">
            {project.key}
          </span>
        </div>
        {description && (
          <p className="col-span-3 truncate text-sm text-gray-500 lg:col-span-1 lg:col-start-2" title={description}>
            {description}
          </p>
        )}
      </div>

      <div className="col-span-3 min-w-0 lg:col-span-1">
        {counts.total > 0 ? (
          <>
            <div className="mb-1 flex justify-between text-xs tabular-nums text-gray-600">
              <span>{counts.done} of {counts.total}</span>
              <span>{Math.round(counts.done / counts.total * 100)}%</span>
            </div>
            <StatusBar counts={counts} />
          </>
        ) : (
          <p className="text-sm text-gray-400">No issues yet</p>
        )}
      </div>

      <div className="hidden lg:block">
        <Sparkline values={activitySeries(project.issues)} />
      </div>

      <div className="hidden min-w-0 items-center gap-2 lg:flex">
        {leadName ? (
          <>
            <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700">
              {initials(leadName).slice(0, 1)}
            </span>
            <span className="truncate text-sm text-gray-700" title={leadName}>{leadName}</span>
          </>
        ) : (
          <span className="text-sm text-gray-400">Unassigned</span>
        )}
      </div>

      {updated && (
        <time className="col-start-3 row-start-1 text-right text-sm tabular-nums text-gray-500 lg:col-start-5"
          title={new Date(project.updatedAt).toLocaleString()}>
          {updated}
        </time>
      )}
    </Link>
  );
};
