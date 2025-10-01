import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useProjects } from "../../hooks/useProjects";

export const ProjectsList = () => {
  const { projects, loading } = useProjects();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="px-6 py-8 mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
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

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Recent projects
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="block px-6 py-4 transition-colors duration-150 hover:bg-gray-50"
                data-testid={`project-card-${project.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-blue-600 rounded">
                      <span className="text-sm font-medium text-white">
                        {project.key}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900">
                          {project.name}
                        </h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {project.key}
                        </span>
                      </div>

                      {project.description && (
                        <p className="mt-1 text-sm text-gray-500">
                          {project.description}
                        </p>
                      )}

                      <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
                        <span>Software project</span>
                        <span>•</span>
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-4 h-4 mr-1 bg-blue-100 rounded-full">
                            <span className="text-xs font-medium text-blue-700">
                              {project.lead?.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </span>
                          </div>
                          <span>{project.lead?.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="text-right">
                      <div className="font-medium">
                        {project.issues?.length || 0}
                      </div>
                      <div className="text-xs">issues</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs">Last updated</div>
                      <div className="font-medium">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

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
