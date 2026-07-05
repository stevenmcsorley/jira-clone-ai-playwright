import { useState, useRef, useEffect, useId } from 'react'
import type { ReactNode } from 'react'

interface CollapsibleCardProps {
  title: string
  count?: number
  defaultOpen?: boolean
  alwaysOpen?: boolean
  headerActions?: ReactNode
  /** Optional test id; the card, toggle and body get `${testId}`, `${testId}-toggle`, `${testId}-body`. */
  testId?: string
  children: ReactNode
}

/**
 * Shared card shell that collapses when its section is empty.
 *
 * Open state initialises once from `defaultOpen`. Because the section's item
 * count arrives from an async fetch (0 while loading), a section starts
 * collapsed and this component auto-expands it the moment `count` transitions
 * from 0/undefined to a positive number — unless the user has manually toggled
 * it, in which case their choice is preserved (tracked via `userToggled`).
 */
export const CollapsibleCard = ({
  title,
  count,
  defaultOpen = true,
  alwaysOpen = false,
  headerActions,
  testId,
  children,
}: CollapsibleCardProps) => {
  const [open, setOpen] = useState(defaultOpen)
  const userToggled = useRef(false)
  const prevCount = useRef(count)
  const bodyId = useId()

  // Auto-expand when data arrives (count 0/undefined -> >0), unless the user
  // has already made a manual choice. We never auto-collapse: a section the
  // user opened to add the first item stays open.
  useEffect(() => {
    if (!userToggled.current) {
      const prev = prevCount.current
      if ((prev === undefined || prev === 0) && count !== undefined && count > 0) {
        setOpen(true)
      }
    }
    prevCount.current = count
  }, [count])

  const handleToggle = () => {
    userToggled.current = true
    setOpen(prev => !prev)
  }

  const isOpen = alwaysOpen || open

  const badge =
    count !== undefined ? (
      <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
        {count}
      </span>
    ) : null

  const titleBlock = (
    <div className="flex items-center gap-2">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {badge}
    </div>
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200" data-testid={testId}>
      {alwaysOpen ? (
        <div className="flex w-full items-center justify-between px-6 py-4">
          {titleBlock}
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      ) : (
        <div className="flex w-full items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={handleToggle}
            className="flex flex-1 items-center gap-2 text-left"
            aria-expanded={isOpen}
            aria-controls={bodyId}
            data-testid={testId ? `${testId}-toggle` : undefined}
          >
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            {titleBlock}
          </button>
          {headerActions && (
            <div
              className="flex items-center gap-2"
              onClick={e => e.stopPropagation()}
            >
              {headerActions}
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div id={bodyId} className="px-6 pb-6" data-testid={testId ? `${testId}-body` : undefined}>
          {children}
        </div>
      )}
    </div>
  )
}
