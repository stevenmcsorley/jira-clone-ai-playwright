import { progressSegments } from "../../utils/projectStats";
import type { statusCounts } from "../../utils/projectStats";

interface StatusBarProps {
  counts: ReturnType<typeof statusCounts>;
}

export const StatusBar = ({ counts }: StatusBarProps) => {
  const { done, review, progress } = progressSegments(counts);
  const label = `${counts.done} done, ${counts.code_review} in review, ${counts.in_progress} in progress, ${counts.todo} to do`;

  return (
    <div role="img" aria-label={label} title={label} className="flex h-1.5 overflow-hidden rounded-full bg-gray-200">
      <span className="bg-green-500" style={{ width: `${done}%` }} />
      <span className="bg-purple-500" style={{ width: `${review}%` }} />
      <span className="bg-blue-500" style={{ width: `${progress}%` }} />
    </div>
  );
};
