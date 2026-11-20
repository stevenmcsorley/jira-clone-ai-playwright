import { Link } from "react-router-dom";
import { ProjectCard } from "../../components/ProjectCard";
import { Button } from "../../components/ui/Button";
import { useProjects } from "../../hooks/useProjects";

// Allow the shared header controls to wrap on narrow Projects screens.
const wrapMobileHeader =
  "max-sm:[header:has(~_&)>div]:flex-wrap max-sm:[header:has(~_&)>div]:gap-2";

export const ProjectsList = () => {
  const { projects, loading } = useProjects();

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gray-50 ${wrapMobileHeader}`}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${wrapMobileHeader}`}>
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
              <Button data-testid="create-project-button">
                Create Project
              </Button>
            </Link>
          </div>
        </div>

        {projects.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
          </div>
        )}

        {projects.length === 0 && (
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
