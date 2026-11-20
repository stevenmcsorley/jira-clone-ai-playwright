export const BoardSkeleton = ({ className }: { className?: string }) => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading project board"
    data-testid="board-loading"
    className={['min-w-0 flex-1 bg-gray-50', className].filter(Boolean).join(' ')}
  >
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6 md:py-4">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded bg-gray-200" />
          <div className="h-4 w-36 rounded bg-gray-100" />
          <div className="h-4 w-28 rounded bg-gray-100" />
        </div>
        <div className="h-9 w-full rounded-lg bg-gray-200 md:w-28" />
      </div>
      <div className="flex gap-4 overflow-x-auto px-4 py-6 md:px-6">
        {Array.from({ length: 4 }, (_, column) => (
          <div key={column} className="min-w-64 flex-1 space-y-3 rounded-lg bg-gray-100 p-3">
            <div className="h-5 w-28 rounded bg-gray-200" />
            {Array.from({ length: 3 }, (_, card) => (
              <div key={card} className="h-20 rounded-lg border border-gray-200 bg-white" />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
)
