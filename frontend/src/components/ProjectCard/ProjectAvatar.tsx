import { initials } from "../../utils/projectStats";

interface ProjectAvatarProps {
  name: string;
  className?: string;
}

export const ProjectAvatar = ({ name, className }: ProjectAvatarProps) => (
  <span
    aria-hidden="true"
    className={["flex size-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100 text-xs font-semibold text-gray-700", className].filter(Boolean).join(" ")}
  >
    {initials(name)}
  </span>
);
