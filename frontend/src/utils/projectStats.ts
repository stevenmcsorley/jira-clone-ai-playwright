import type { IssueStatus } from "../types/domain.types";

interface IssueActivity {
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export const statusCounts = (issues?: readonly { status: string }[]) => {
  const counts: Record<IssueStatus | "total", number> = {
    todo: 0,
    in_progress: 0,
    code_review: 0,
    done: 0,
    total: issues?.length ?? 0,
  };

  for (const { status } of issues ?? []) {
    if (status === "todo" || status === "in_progress" || status === "code_review" || status === "done") {
      counts[status]++;
    }
  }
  return counts;
};

export const doneRatio = (issues?: readonly { status: string }[]) => {
  const { done, total } = statusCounts(issues);
  return total ? done / total : 0;
};

const millisecondsPerDay = 86_400_000;

export const updatedLabel = (dateString: string | Date, now = Date.now()): string => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";

  const elapsed = now - date.getTime();
  const minutes = Math.floor(elapsed / 60_000);
  const hours = Math.floor(elapsed / 3_600_000);
  const days = Math.floor(elapsed / millisecondsPerDay);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const utcDay = (date: string | Date | undefined) =>
  date == null ? NaN : Math.floor(new Date(date).getTime() / millisecondsPerDay);

export const activitySeries = (issues?: readonly IssueActivity[], days = 14, now = Date.now()) => {
  const series = Array.from({ length: days }, () => 0);
  const start = Math.floor(now / millisecondsPerDay) - days + 1;

  for (const { createdAt, updatedAt } of issues ?? []) {
    const createdIndex = utcDay(createdAt) - start;
    const updatedIndex = utcDay(updatedAt) - start;
    if (createdIndex >= 0 && createdIndex < days) series[createdIndex]++;
    if (updatedIndex !== createdIndex && updatedIndex >= 0 && updatedIndex < days) {
      series[updatedIndex]++;
    }
  }

  return series;
};

export const hueFromKey = (key?: string) => {
  if (!key) return 220;
  let hue = 0;
  for (const character of key) {
    hue = (hue * 31 + character.charCodeAt(0)) % 360;
  }
  return hue;
};

export const initials = (name?: string) =>
  (name?.trim().match(/\S+/g) ?? [])
    .slice(0, 2)
    .map((word) => {
      const [firstLetter] = word;
      const [uppercase] = firstLetter.toUpperCase();
      return uppercase;
    })
    .join("");

export const sparklinePoints = (values: readonly number[], width: number, height: number, pad = 2) => {
  const samples = values.map((value) => Number.isFinite(value) && value > 0 ? value : 0);
  const max = samples.reduce((peak, value) => Math.max(peak, value), 0);
  const points = samples.length === 1 ? [samples[0], samples[0]] : samples;

  return points.map((value, index) => {
    const x = pad + (index / (points.length - 1)) * (width - 2 * pad);
    const y = height - pad - (max ? value / max : 0) * (height - 2 * pad);
    return `${x},${y}`;
  }).join(" ");
};
