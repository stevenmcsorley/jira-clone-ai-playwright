import { Card } from "../ui/Card";

export const ProjectsSkeleton = ({ className }: { className?: string }) => (
  <div role="status" aria-busy="true" className={className}>
    <span className="sr-only">Loading projects…</span>
    {Array.from({ length: 6 }, (_, index) => (
      <Card key={index} padding={false} className="shadow-sm">
        <div aria-hidden="true" className="grid gap-3 p-4 motion-safe:animate-pulse lg:grid-cols-[minmax(0,8fr)_minmax(0,7fr)_minmax(0,5fr)] lg:items-center lg:gap-x-6">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-gray-200" />
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-gray-200" />
                <div className="h-4 w-12 rounded bg-gray-100" />
              </div>
            </div>
            <div className="h-10 w-4/5 rounded bg-gray-100" />
          </div>
          <div className="w-full space-y-3 lg:max-w-md">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-1.5 rounded-full bg-gray-100" />
            <div className="h-5 rounded bg-gray-100" />
          </div>
          <div className="flex items-center gap-2 border-t border-gray-100 pt-3 lg:flex-col lg:items-end lg:border-0 lg:pt-0">
            <div className="mr-auto h-6 w-20 rounded bg-gray-100 lg:mr-0" />
            <div className="h-6 w-20 rounded bg-gray-100 lg:order-first lg:h-9 lg:w-35" />
            <div className="h-4 w-16 rounded bg-gray-100" />
          </div>
        </div>
      </Card>
    ))}
  </div>
);
