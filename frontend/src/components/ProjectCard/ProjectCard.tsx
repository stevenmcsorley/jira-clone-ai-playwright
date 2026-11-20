import { Link } from "react-router-dom";
import type { Project } from "../../types/domain.types";
import { activitySeries, initials, statusCounts, updatedLabel } from "../../utils/projectStats";
import { ProjectDescription } from "../ProjectDescription";
import { Card } from "../ui/Card";
import { ProjectAvatar } from "./ProjectAvatar";
import { Sparkline } from "./Sparkline";
import { StatusBar } from "./StatusBar";

interface ProjectCardProps {
  project: Project;
  className?: string;
}

export const ProjectCard = ({ project, className }: ProjectCardProps) => {
  const counts = statusCounts(project.issues);
  const leadName = project.lead?.name?.trim();
  const updated = updatedLabel(project.updatedAt);
  const nameId = `project-name-${project.id}`;

  return (
    <Card
      padding={false}
      className={["relative grid min-w-0 grid-rows-[auto_auto_auto_1fr] shadow-sm transition-[translate,box-shadow] hover:shadow-md motion-safe:hover:-translate-y-0.5 lg:grid-cols-[minmax(0,8fr)_minmax(0,7fr)_minmax(0,5fr)] lg:grid-rows-[auto_1fr] lg:gap-x-6", className].filter(Boolean).join(" ")}
    >
      <Link
        to={`/projects/${project.id}`}
        data-testid={`project-card-${project.id}`}
        aria-labelledby={nameId}
        className="col-start-1 row-span-4 row-start-1 grid min-w-0 grid-rows-subgrid rounded-xl p-4 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 lg:col-span-3 lg:row-span-2 lg:grid-cols-subgrid"
      >
        <div className="flex min-w-0 items-center gap-3 lg:col-start-1 lg:row-start-1">
          <ProjectAvatar projectKey={project.key} name={project.name} />
          <div className="min-w-0">
            <h2 id={nameId} className="truncate font-semibold text-gray-900" title={project.name}>
              {project.name}
            </h2>
            <span className="inline-block max-w-full truncate rounded bg-gray-100 px-2 py-0.5 align-top text-xs font-medium text-gray-700">
              {project.key}
            </span>
          </div>
        </div>

        <div className="row-start-3 flex min-w-0 flex-col gap-3 pt-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:w-full lg:max-w-md lg:self-center lg:pt-0">
          {counts.total > 0 ? (
            <>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-gray-700">{counts.done} of {counts.total} done</p>
                <div
                  role="progressbar"
                  aria-label="Issues done"
                  aria-valuenow={counts.done}
                  aria-valuemin={0}
                  aria-valuemax={counts.total}
                  className="h-1.5 overflow-hidden rounded-full bg-gray-100"
                >
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${counts.done / counts.total * 100}%` }} />
                </div>
              </div>
              <StatusBar counts={counts} />
            </>
          ) : (
            <p className="text-sm text-gray-500">No issues yet</p>
          )}
        </div>

        <div className="row-start-4 mt-3 flex min-w-0 items-center gap-2 border-t border-gray-100 pt-3 text-xs text-gray-600 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:flex-col lg:mt-0 lg:items-end lg:justify-center lg:border-0 lg:pt-0">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 lg:max-w-full lg:flex-none">
            {leadName && (
              <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 font-medium text-blue-800">
                {initials(leadName)}
              </span>
            )}
            <span className="truncate" title={leadName}>{leadName || "No lead"}</span>
          </div>
          {counts.total > 0 && <Sparkline values={activitySeries(project.issues)} className="lg:order-first lg:h-9 lg:w-35 lg:max-w-full" />}
          {updated && (
            <time className="shrink-0" title={new Date(project.updatedAt).toLocaleString()}>
              Updated {updated}
            </time>
          )}
        </div>
      </Link>

      {/* Keep the description toggle outside the link while sharing its second grid row. */}
      <ProjectDescription
        projectId={project.id}
        description={project.description}
        className="pointer-events-none relative col-start-1 row-start-2 min-w-0 px-4 lg:pr-0 [&_button]:pointer-events-auto"
      />
    </Card>
  );
};
