export type MoveTarget = { id: number | null; label: string }

export const sprintMoveTargets = (
  currentSprintId: number | null | undefined,
  sprints: readonly { id: number; name: string; status: string }[],
): MoveTarget[] => {
  const targets: MoveTarget[] = typeof currentSprintId === 'number' ? [{ id: null, label: 'Backlog' }] : []
  for (const { id, name, status } of sprints) {
    if (status !== 'completed' && id !== currentSprintId) {
      targets.push({ id, label: status === 'active' ? `${name} (active)` : name })
    }
  }
  return targets
}

export const moveAnnouncement = (title: string, label: string): string => {
  const characters = Array.from(title.trim())
  const displayTitle = characters.length > 60 ? characters.slice(0, 60).join('') + '…' : characters.join('')
  return `Moved "${displayTitle}" to ${label}`
}
