import { useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { splitParagraphs, tidyDescription } from "../../utils/projectDescription";

interface ProjectDescriptionProps {
  projectId: string | number;
  description?: string | null;
  className?: string;
}

export const ProjectDescription = ({
  projectId,
  description,
  className,
}: ProjectDescriptionProps) => {
  const text = tidyDescription(description);
  const descriptionId = `project-description-${projectId}`;
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
  }, [text, expanded]);

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
          <p ref={previewRef} className="line-clamp-2">{text}</p>
        )}
      </div>
      {(expanded || truncated) && (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={descriptionId}
          data-testid={`project-description-toggle-${projectId}`}
          onClick={handleToggle}
          className="min-h-11 rounded px-1 text-blue-700 hover:underline focus-visible:ring-2 focus-visible:ring-blue-600 sm:min-h-0"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
};
