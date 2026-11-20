export const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'low': return '↓'
    case 'medium': return '→'
    case 'high': return '↑'
    case 'urgent': return '⇈'
    default: return '→'
  }
}

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'text-green-600'
    case 'medium': return 'text-yellow-600'
    case 'high': return 'text-orange-600'
    case 'urgent': return 'text-red-600'
    default: return 'text-yellow-600'
  }
}
