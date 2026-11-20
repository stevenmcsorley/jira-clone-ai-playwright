import { Card } from "../ui/Card";

export const ProjectsSkeleton = ({ className }: { className?: string }) => (
  <div role="status" aria-busy="true" className={className}>
    <span className="sr-only">Loading projects…</span>
    {Array.from({ length: 6 }, (_, index) => (
      <Card key={index} padding={false} className="shadow-sm">
        <div aria-hidden="true" className="space-y-3 p-4 motion-safe:animate-pulse">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-28 rounded bg-gray-200" />
              <div className="h-4 w-12 rounded bg-gray-100" />
            </div>
          </div>
          <div className="h-4 w-4/5 rounded bg-gray-100" />
          <div className="h-4 w-20 rounded bg-gray-200" />
          <div className="h-1.5 rounded-full bg-gray-100" />
          <div className="h-5 rounded bg-gray-100" />
          <div className="flex justify-between border-t border-gray-100 pt-3">
            <div className="h-6 w-20 rounded bg-gray-100" />
            <div className="h-6 w-16 rounded bg-gray-100" />
          </div>
        </div>
      </Card>
    ))}
  </div>
);
