import type { statusCounts } from "../../utils/projectStats";

const statuses = [
  { key: "todo", label: "To do", color: "bg-gray-400" },
  { key: "in_progress", label: "In progress", color: "bg-blue-500" },
  { key: "code_review", label: "In review", color: "bg-purple-500" },
  { key: "done", label: "Done", color: "bg-green-500" },
] as const;

interface StatusBarProps {
  counts: ReturnType<typeof statusCounts>;
  className?: string;
}

export const StatusBar = ({ counts, className }: StatusBarProps) => (
  <div className={["space-y-2", className].filter(Boolean).join(" ")}>
    <div className="flex h-2 overflow-hidden rounded-full bg-gray-100" aria-hidden="true">
      {statuses.map(({ key, label, color }) => counts[key] > 0 && (
        <span
          key={key}
          className={color}
          style={{ width: `${counts[key] / counts.total * 100}%` }}
          title={`${label}: ${counts[key]}`}
        />
      ))}
    </div>
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
      {statuses.map(({ key, label, color }) => (
        <li key={key} className="flex items-center gap-1">
          <span aria-hidden="true" className={`size-2 rounded-full ${color}`} />
          {label} <span className="font-medium tabular-nums text-gray-900">{counts[key]}</span>
        </li>
      ))}
    </ul>
  </div>
);
