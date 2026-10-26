import { describe, expect, it } from 'vitest'
import { dayEnd, dayStart, formatDateTime, isDay, parseApiDateTime } from '@/lib/dates'

// The tests run in Europe/Prague (see vitest.config.ts): UTC+2 in summer, UTC+1 in winter.
describe('dates', () => {
  it('recognises valid days only', () => {
    expect(isDay('2026-08-31')).toBe(true)
    expect(isDay('2026-02-30')).toBe(false)
    expect(isDay('31.8.2026')).toBe(false)
    expect(isDay(null)).toBe(false)
  })

  it('sends a day as its local start and end, converted to UTC without an offset', () => {
    expect(dayStart('2026-08-01')).toBe('2026-07-31T22:00:00.000')
    expect(dayEnd('2026-08-31')).toBe('2026-08-31T21:59:59.999')
    expect(dayStart('2026-01-15')).toBe('2026-01-14T23:00:00.000')
  })

  it('reads API date-times without an offset as UTC and shows them in local time', () => {
    expect(formatDateTime(parseApiDateTime('2026-08-20T14:00:00'))).toBe('20 Aug 2026, 16:00')
    expect(formatDateTime(parseApiDateTime('2026-08-20T14:00:00+00:00'))).toBe('20 Aug 2026, 16:00')
  })
})
