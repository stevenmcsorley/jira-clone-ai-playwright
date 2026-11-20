import { sparklinePoints } from "../../utils/projectStats";

interface SparklineProps {
  values: readonly number[];
  className?: string;
}

export const Sparkline = ({ values, className }: SparklineProps) => {
  const changes = values.reduce((total, value) => total + value, 0);

  return (
    <svg
      className={["shrink-0 text-blue-600", className].filter(Boolean).join(" ")}
      width={80}
      height={24}
      viewBox="0 0 80 24"
      role="img"
      aria-label={`Issue activity over the last ${values.length} days: ${changes} ${changes === 1 ? "change" : "changes"}`}
    >
      <polyline
        points={sparklinePoints(values, 80, 24)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};
