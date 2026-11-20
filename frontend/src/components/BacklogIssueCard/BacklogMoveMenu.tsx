import { useId, useLayoutEffect, useRef, useState } from 'react'
import type { DragEvent, KeyboardEvent, SyntheticEvent } from 'react'
import { createPortal } from 'react-dom'
import type { MoveTarget } from '../../utils/sprintMove'
import { nextFocusIndex } from '../../utils/focusCycle'

interface BacklogMoveMenuProps {
  issue: { id: number; title: string; key?: string | null }
  targets: MoveTarget[]
  onMove: (target: MoveTarget) => void
  className?: string
}

const stopPropagation = (event: SyntheticEvent) => event.stopPropagation()
const preventDrag = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
}

export const BacklogMoveMenu = ({ issue, targets, onMove, className }: BacklogMoveMenuProps) => {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerId = useId()
  const menuId = useId()
  const canMove = targets.length > 0

  useLayoutEffect(() => {
    if (!open || !canMove) return
    const trigger = triggerRef.current
    const menu = menuRef.current
    if (!trigger || !menu) return

    const positionMenu = () => {
      const anchor = trigger.getBoundingClientRect()
      if (anchor.width === 0) {
        setOpen(false)
        return
      }
      const width = menu.offsetWidth
      const height = menu.offsetHeight
      const right = Math.max(width + 16, Math.min(anchor.right, window.innerWidth - 16))
      const below = anchor.bottom + 4
      const top = below + height <= window.innerHeight - 8 ? below : Math.max(8, anchor.top - height - 4)
      menu.style.right = `${window.innerWidth - right}px`
      menu.style.top = `${top}px`
    }

    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menu.contains(event.target) && !trigger.contains(event.target)) {
        setOpen(false)
      }
    }

    positionMenu()
    menu.querySelector('button')?.focus({ preventScroll: true })
    document.addEventListener('pointerdown', closeOutside, true)
    window.addEventListener('resize', positionMenu)
    window.addEventListener('scroll', positionMenu, true)
    return () => {
      document.removeEventListener('pointerdown', closeOutside, true)
      window.removeEventListener('resize', positionMenu)
      window.removeEventListener('scroll', positionMenu, true)
    }
  }, [open, canMove])

  if (!canMove) return null

  const closeAndFocusTrigger = () => {
    setOpen(false)
    triggerRef.current?.focus({ preventScroll: true })
  }

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (event.key === 'Escape') {
      event.preventDefault()
      closeAndFocusTrigger()
    } else if (event.key === 'Tab') {
      closeAndFocusTrigger()
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const items = Array.from(event.currentTarget.querySelectorAll('button'))
      const index = items.findIndex(item => item === document.activeElement)
      items[nextFocusIndex(index, items.length, event.key === 'ArrowUp')]?.focus()
    }
  }

  return (
    <div
      className={className}
      onClick={stopPropagation}
      onPointerDown={stopPropagation}
      onPointerUp={stopPropagation}
      onPointerMove={stopPropagation}
      onPointerCancel={stopPropagation}
      onDragStart={preventDrag}
      onDrag={stopPropagation}
      onDragEnd={stopPropagation}
      onDragEnter={stopPropagation}
      onDragLeave={stopPropagation}
      onDragOver={stopPropagation}
      onDrop={preventDrag}
    >
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Move issue ${issue.key ?? issue.id}`}
        data-testid={`backlog-move-menu-${issue.id}`}
        className="flex min-h-7 max-md:min-h-11 max-md:min-w-11 cursor-pointer items-center justify-center gap-1 rounded bg-gray-100 px-1.5 text-xs text-gray-700 hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-blue-500"
        onMouseDown={event => {
          // A mouse gesture starting on the button must not drag the parent card.
          event.preventDefault()
          event.stopPropagation()
        }}
        onClick={() => setOpen(value => !value)}
        onKeyDown={event => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            event.stopPropagation()
            setOpen(true)
          }
        }}
      >
        <span aria-hidden="true">⇄</span>
        <span className="hidden whitespace-nowrap sm:inline">Move to</span>
      </button>
      {open && createPortal(
        <div className="pointer-events-none fixed inset-0 z-20">
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-labelledby={triggerId}
            className="pointer-events-auto absolute right-0 z-20 w-52 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
            onKeyDown={handleMenuKeyDown}
          >
            {targets.map(target => (
              <button
                key={target.id ?? 'backlog'}
                type="button"
                role="menuitem"
                tabIndex={-1}
                data-testid={`backlog-move-to-${target.id ?? 'backlog'}`}
                className="block w-full cursor-pointer px-4 py-2 text-left wrap-anywhere text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-100"
                onClick={() => {
                  closeAndFocusTrigger()
                  onMove(target)
                }}
              >
                {target.label}
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
