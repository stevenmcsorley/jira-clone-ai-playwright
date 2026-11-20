import { sparklinePoints } from "../../utils/projectStats";

interface SparklineProps {
  values: readonly number[];
}

export const Sparkline = ({ values }: SparklineProps) => {
  const changes = values.reduce((total, value) => total + value, 0);
  if (!changes) {
    return <span className="text-sm text-gray-400" title="No activity in the last 14 days">–</span>;
  }

  const points = sparklinePoints(values, 96, 24);
  const [lastX, lastY] = points.slice(points.lastIndexOf(" ") + 1).split(",");

  return (
    <svg
      className="text-gray-400"
      width={96}
      height={24}
      viewBox="0 0 96 24"
      role="img"
      aria-label={`Issue activity over the last ${values.length} days: ${changes} ${changes === 1 ? "change" : "changes"}`}
    >
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={2} fill="currentColor" />
    </svg>
  );
};
