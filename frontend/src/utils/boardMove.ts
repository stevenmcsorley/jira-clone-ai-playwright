export const BOARD_STATUSES = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "code_review", label: "Code Review" },
  { id: "done", label: "Done" },
] as const

export const moveTargets = (current: string): { id: string; label: string }[] =>
  BOARD_STATUSES.filter(({ id }) => id !== current)

export const moveAnnouncement = (title: string, label: string): string => {
  const characters = Array.from(title.trim())
  const displayTitle = characters.length > 60 ? characters.slice(0, 60).join("") + "…" : characters.join("")
  return `Moved "${displayTitle}" to ${label}`
}
