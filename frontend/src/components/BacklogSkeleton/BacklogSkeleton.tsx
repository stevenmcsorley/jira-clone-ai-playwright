export const BacklogSkeleton = ({ className }: { className?: string }) => (
  <div
    role="status"
    aria-busy="true"
    aria-label="Loading backlog"
    data-testid="backlog-loading"
    className={['min-w-0 flex-1 bg-gray-50 motion-safe:animate-pulse', className].filter(Boolean).join(' ')}
  >
    <div className="border-b border-gray-200 bg-white px-4 py-3 md:px-6 md:py-4">
      <div className="h-8 w-48 max-w-full rounded bg-gray-200" />
    </div>
    <div className="space-y-6 px-4 py-4 md:px-6 md:py-6">
      {[0, 1].map(sprint => (
        <div key={sprint} className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 md:px-6 md:py-4">
            <div className="h-6 w-36 rounded bg-gray-200" />
          </div>
          <div className="space-y-3 p-3 md:p-6">
            {[0, 1, 2].map(row => (
              <div key={row} className="h-16 rounded bg-gray-100 xl:h-12" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)
