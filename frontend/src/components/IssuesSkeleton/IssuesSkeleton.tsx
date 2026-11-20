export const IssuesSkeleton = () => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading issues"
    data-testid="issues-loading"
    className="space-y-3 motion-safe:animate-pulse"
  >
    <div className="grid grid-cols-2 gap-3 rounded-lg bg-white p-3 md:flex" aria-hidden="true">
      <div className="col-span-2 h-11 rounded bg-gray-200 md:h-8 md:w-48" />
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="h-11 rounded bg-gray-200 md:h-8 md:w-24" />
      ))}
    </div>
    {Array.from({ length: 6 }, (_, index) => (
      <div key={index} className="space-y-3 rounded-lg bg-white p-4 xl:space-y-0" aria-hidden="true">
        <div className="h-3 w-1/4 rounded bg-gray-200 xl:hidden" />
        <div className="h-4 w-3/4 rounded bg-gray-200 xl:w-full" />
        <div className="h-8 w-1/2 rounded bg-gray-200 xl:hidden" />
      </div>
    ))}
  </div>
)
