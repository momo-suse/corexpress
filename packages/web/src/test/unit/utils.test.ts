import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyComponentStyles, formatTimeAgo } from '@/lib/utils'

// ── formatTimeAgo ─────────────────────────────────────────────────────────────

// Minimal translator stub — returns the key + interpolated count
const t = (key: string, opts?: { count: number }): string =>
  opts !== undefined ? `${key}:${opts.count}` : key

describe('formatTimeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns justNow for dates less than 60 seconds ago', () => {
    vi.setSystemTime(new Date('2025-01-01T12:00:30Z'))
    expect(formatTimeAgo('2025-01-01T12:00:00Z', t)).toBe('common.time.justNow')
  })

  it('returns minutesAgo for 1 minute ago', () => {
    vi.setSystemTime(new Date('2025-01-01T12:01:00Z'))
    expect(formatTimeAgo('2025-01-01T12:00:00Z', t)).toBe('common.time.minutesAgo:1')
  })

  it('returns minutesAgo for 59 minutes ago', () => {
    vi.setSystemTime(new Date('2025-01-01T12:59:00Z'))
    expect(formatTimeAgo('2025-01-01T12:00:00Z', t)).toBe('common.time.minutesAgo:59')
  })

  it('returns hoursAgo for 1 hour ago', () => {
    vi.setSystemTime(new Date('2025-01-01T13:00:00Z'))
    expect(formatTimeAgo('2025-01-01T12:00:00Z', t)).toBe('common.time.hoursAgo:1')
  })

  it('returns hoursAgo for 23 hours ago', () => {
    vi.setSystemTime(new Date('2025-01-02T11:00:00Z'))
    expect(formatTimeAgo('2025-01-01T12:00:00Z', t)).toBe('common.time.hoursAgo:23')
  })

  it('returns daysAgo for 1 day ago', () => {
    vi.setSystemTime(new Date('2025-01-02T12:00:00Z'))
    expect(formatTimeAgo('2025-01-01T12:00:00Z', t)).toBe('common.time.daysAgo:1')
  })

  it('returns daysAgo for 6 days ago', () => {
    vi.setSystemTime(new Date('2025-01-07T12:00:00Z'))
    expect(formatTimeAgo('2025-01-01T12:00:00Z', t)).toBe('common.time.daysAgo:6')
  })

  it('returns weeksAgo for 1 week ago', () => {
    vi.setSystemTime(new Date('2025-01-08T12:00:00Z'))
    expect(formatTimeAgo('2025-01-01T12:00:00Z', t)).toBe('common.time.weeksAgo:1')
  })

  it('returns weeksAgo for 3 weeks ago', () => {
    vi.setSystemTime(new Date('2025-01-22T12:00:00Z'))
    expect(formatTimeAgo('2025-01-01T12:00:00Z', t)).toBe('common.time.weeksAgo:3')
  })

  it('returns monthsAgo for 1 month ago', () => {
    vi.setSystemTime(new Date('2025-02-01T12:00:00Z'))
    expect(formatTimeAgo('2025-01-01T12:00:00Z', t)).toBe('common.time.monthsAgo:1')
  })

  it('returns monthsAgo for 11 months ago', () => {
    vi.setSystemTime(new Date('2025-12-01T12:00:00Z'))
    expect(formatTimeAgo('2025-01-01T12:00:00Z', t)).toBe('common.time.monthsAgo:11')
  })

  it('returns yearsAgo for 1 year ago', () => {
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
    expect(formatTimeAgo('2025-01-01T12:00:00Z', t)).toBe('common.time.yearsAgo:1')
  })

  it('returns yearsAgo for multiple years ago', () => {
    vi.setSystemTime(new Date('2028-01-01T12:00:00Z'))
    expect(formatTimeAgo('2025-01-01T12:00:00Z', t)).toBe('common.time.yearsAgo:3')
  })
})

// ── applyComponentStyles ──────────────────────────────────────────────────────

describe('applyComponentStyles', () => {
  it('returns empty object when no textColor is present', () => {
    expect(applyComponentStyles({})).toEqual({})
  })

  it('returns empty object when styles only contain background', () => {
    expect(applyComponentStyles({ background: '#ffffff' })).toEqual({})
  })

  it('maps textColor to css color property', () => {
    expect(applyComponentStyles({ textColor: '#ff0000' })).toEqual({ color: '#ff0000' })
  })

  it('ignores background even when textColor is also present', () => {
    const result = applyComponentStyles({ textColor: '#333', background: '#fff' })
    expect(result).toEqual({ color: '#333' })
    expect(result).not.toHaveProperty('background')
  })

  it('handles hex shorthand colors', () => {
    expect(applyComponentStyles({ textColor: '#abc' })).toEqual({ color: '#abc' })
  })
})
