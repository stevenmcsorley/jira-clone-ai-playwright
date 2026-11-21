export const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'low': return 'Low'
    case 'medium': return 'Medium'
    case 'high': return 'High'
    case 'urgent': return 'Urgent'
    default: return 'Medium'
  }
}

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low': return 'text-gray-500'
    case 'medium': return 'text-gray-600'
    case 'high': return 'text-gray-900'
    case 'urgent': return 'text-red-600'
    default: return 'text-gray-600'
  }
}
