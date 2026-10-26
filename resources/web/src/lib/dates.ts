const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isDay(value: string | null | undefined): value is string {
  if (!value || !DAY_PATTERN.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function localDay(day: string, hours: number, minutes: number, seconds: number, ms: number): Date {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year, month - 1, date, hours, minutes, seconds, ms)
}

// The backend compares against UTC values stored without an offset, so it gets them in the same form.
function toApiDateTime(date: Date): string {
  return date.toISOString().replace('Z', '')
}

/** The first moment of a day in the user's time zone, as an API date-time. */
export function dayStart(day: string): string {
  return toApiDateTime(localDay(day, 0, 0, 0, 0))
}

/** The last moment of a day in the user's time zone, as an API date-time. */
export function dayEnd(day: string): string {
  return toApiDateTime(localDay(day, 23, 59, 59, 999))
}

/** Reads an API date-time; one without an offset is UTC. */
export function parseApiDateTime(value: string): Date {
  const hasOffset = /(Z|[+-]\d{2}:?\d{2})$/.test(value)
  return new Date(hasOffset ? value : `${value}Z`)
}

const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDateTime(date: Date): string {
  return dateTimeFormat.format(date)
}
