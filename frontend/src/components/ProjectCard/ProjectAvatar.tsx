import { hueFromKey } from "../../utils/projectStats";

interface ProjectAvatarProps {
  projectKey: string;
  className?: string;
}

export const ProjectAvatar = ({ projectKey, className }: ProjectAvatarProps) => (
  <span
    aria-hidden="true"
    className={["flex size-10 shrink-0 items-center justify-center rounded-lg px-1 text-xs font-semibold text-white", className].filter(Boolean).join(" ")}
    style={{ backgroundColor: `hsl(${hueFromKey(projectKey)} 60% 38%)` }}
    title={projectKey}
  >
    <span className="truncate">{projectKey}</span>
  </span>
);
