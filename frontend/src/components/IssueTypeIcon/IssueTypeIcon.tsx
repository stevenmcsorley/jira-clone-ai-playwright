import type { IssueType } from '../../types/domain.types'

/**
 * Jira-style issue type glyphs: small coloured rounded squares with a white
 * symbol — replaces the emoji markers on cards and in tables.
 */
const TYPE_STYLES: Record<IssueType, { bg: string; label: string }> = {
  story: { bg: 'bg-green-500', label: 'Story' },
  task: { bg: 'bg-blue-500', label: 'Task' },
  bug: { bg: 'bg-red-500', label: 'Bug' },
  epic: { bg: 'bg-purple-500', label: 'Epic' },
}

const GLYPHS: Record<IssueType, React.ReactNode> = {
  // Bookmark
  story: (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5">
      <path d="M4 2h8a1 1 0 011 1v11l-5-3-5 3V3a1 1 0 011-1z" />
    </svg>
  ),
  // Check
  task: (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5">
      <path d="M6.5 11.2L3.3 8l-1.1 1.1 4.3 4.3 7.3-7.3-1.1-1.1z" />
    </svg>
  ),
  // Dot (Jira bug glyph)
  bug: (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5">
      <circle cx="8" cy="8" r="4" />
    </svg>
  ),
  // Lightning
  epic: (
    <svg viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5">
      <path d="M9 1L3 9h4l-1 6 6-8H8l1-6z" />
    </svg>
  ),
}

interface IssueTypeIconProps {
  type: IssueType
  className?: string
}

export const IssueTypeIcon = ({ type, className = '' }: IssueTypeIconProps) => {
  const style = TYPE_STYLES[type] ?? TYPE_STYLES.task
  return (
    <span
      title={style.label}
      className={`inline-flex items-center justify-center w-4 h-4 rounded-[3px] text-white shrink-0 ${style.bg} ${className}`}
    >
      {GLYPHS[type] ?? GLYPHS.task}
    </span>
  )
}
