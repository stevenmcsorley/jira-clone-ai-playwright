import { useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { splitParagraphs, tidyDescription } from "../../utils/projectDescription";

interface ProjectDescriptionProps {
  projectId: string | number;
  description?: string | null;
  className?: string;
  idPrefix?: string;
  lines?: 2 | 3;
}

export const ProjectDescription = ({
  projectId,
  description,
  className,
  idPrefix = "project-description",
  lines = 3,
}: ProjectDescriptionProps) => {
  const text = tidyDescription(description);
  const descriptionId = `${idPrefix}-${projectId}`;
  const previewRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    const measure = () => {
      setTruncated(preview.scrollHeight > preview.clientHeight);
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text, expanded, lines]);

  if (!text) return null;

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setExpanded((current) => !current);
  };

  return (
    <div className={["mt-1 text-sm text-gray-500 whitespace-pre-line wrap-anywhere", className].filter(Boolean).join(" ")}>
      <div id={descriptionId} data-testid={descriptionId}>
        {expanded ? (
          <div className="space-y-1">
            {splitParagraphs(text).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p ref={previewRef} className={lines === 2 ? "line-clamp-2" : "line-clamp-3"}>{text}</p>
        )}
      </div>
      {(expanded || truncated) && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={descriptionId}
          data-testid={`${idPrefix}-toggle-${projectId}`}
          onClick={handleToggle}
          className="min-h-11 rounded px-1 text-blue-700 hover:underline focus-visible:ring-2 focus-visible:ring-blue-600 sm:min-h-0"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
};
