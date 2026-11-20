import { activitySeries, doneRatio, statusCounts } from "./projectStats";

export const SORT_OPTIONS = [
  { id: "updated", label: "Recently updated", hint: "Show the most recently updated projects first." },
  { id: "created", label: "Newest projects", hint: "Show the most recently created projects first." },
  { id: "issue-added", label: "Recently added to", hint: "Show projects with the newest issues first." },
  { id: "active", label: "Most active (14 days)", hint: "Show projects with the most issue activity over the last 14 days first." },
  { id: "open", label: "Most open work", hint: "Show projects with the most unfinished issues first." },
  { id: "closest", label: "Closest to done", hint: "Show projects with the highest share of completed issues first." },
  { id: "name", label: "Name A to Z", hint: "Show projects in alphabetical order by name." },
] as const;

export type ProjectSortId = typeof SORT_OPTIONS[number]["id"];

interface ListState {
  q: string;
  sort: ProjectSortId;
}

interface SearchableProject {
  name: string;
  key?: string;
  description?: string | null;
  lead?: { name?: string } | null;
}

interface SortableProject {
  id: number;
  name: string;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  issues?: readonly { status: string; createdAt?: string | Date; updatedAt?: string | Date }[];
}

const timestamp = (date?: string | Date | null) => {
  const value = date == null ? NaN : new Date(date).getTime();
  return Number.isFinite(value) ? value : -Infinity;
};

const sortScore = (project: SortableProject, sortId: string, now: number) => {
  const { issues } = project;
  switch (sortId) {
    case "created":
      return timestamp(project.createdAt);
    case "issue-added":
      return (issues ?? []).reduce((latest, issue) => Math.max(latest, timestamp(issue.createdAt)), -Infinity);
    case "active":
      return activitySeries(issues, 14, now).reduce((total, count) => total + count, 0);
    case "open": {
      const { total, done } = statusCounts(issues);
      return total - done;
    }
    case "closest":
      return issues?.length ? doneRatio(issues) : -Infinity;
    case "name":
      return 0;
    default:
      return timestamp(project.updatedAt);
  }
};

const nameOrder = new Intl.Collator(undefined, { sensitivity: "accent" });

export const sortProjects = <T extends SortableProject>(projects: readonly T[], sortId: string, now = Date.now()): T[] =>
  projects.map((project) => ({
    project,
    score: sortScore(project, sortId, now),
    issueCount: project.issues?.length ?? 0,
  })).sort((a, b) =>
    (b.score - a.score) ||
    (sortId === "closest" ? b.issueCount - a.issueCount : 0) ||
    (sortId === "issue-added" ? Number(b.issueCount > 0) - Number(a.issueCount > 0) : 0) ||
    nameOrder.compare(a.project.name, b.project.name) ||
    a.project.id - b.project.id
  ).map(({ project }) => project);

export const filterProjects = <T extends SearchableProject>(projects: readonly T[], query: string): T[] => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [...projects];

  const terms = normalized.split(/\s+/);
  return projects.filter(({ name, key, description, lead }) => {
    const fields = [name, key, description, lead?.name].map((field) => field?.toLowerCase());
    return terms.every((term) => fields.some((field) => field?.includes(term)));
  });
};

const isSortId = (value?: string | null): value is ProjectSortId =>
  SORT_OPTIONS.some(({ id }) => id === value);

export const parseListState = (search: string, storedSort?: string | null): ListState => {
  const params = new URLSearchParams(search);
  const sort = params.get("sort");
  return {
    q: (params.get("q") ?? "").trim().slice(0, 100),
    sort: isSortId(sort) ? sort : isSortId(storedSort) ? storedSort : "updated",
  };
};

export const listStateToSearch = ({ q, sort }: ListState): string => {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (sort !== "updated") params.set("sort", sort);
  return params.size ? `?${params}` : "";
};
