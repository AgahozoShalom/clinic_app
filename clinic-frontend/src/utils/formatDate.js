import { format, parseISO } from 'date-fns'

export const formatDate = (dateString, formatStr = 'MMM d, yyyy') => {
  if (!dateString) return ''
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
    return format(date, formatStr)
  } catch (error) {
    return dateString
  }
}

export const formatRelative = (dateString) => {
  if (!dateString) return ''
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString
    const now = new Date()
    const diffInHours = Math.abs(now - date) / 36e5
    if (diffInHours < 24) {
      return format(date, 'h:mm a')
    }
    return format(date, 'MMM d')
  } catch (error) {
    return dateString
  }
}
