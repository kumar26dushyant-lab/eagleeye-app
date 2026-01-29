// Simplified Time Window Logic for Daily Briefs
// Full calendar days (00:00 - 23:59) with timezone support
// "Dynamic work hours" approach - no assumptions about workday times

export interface TimeWindow {
  start: Date
  end: Date
  label: string
  daysCovered: number
  timezone: string
}

// Common timezone offsets (hours from UTC)
export const TIMEZONE_OFFSETS: Record<string, number> = {
  // Americas
  'America/Los_Angeles': -8,   // PST
  'America/Denver': -7,        // MST
  'America/Chicago': -6,       // CST
  'America/New_York': -5,      // EST
  'America/Sao_Paulo': -3,     // BRT
  
  // Europe & Africa
  'Europe/London': 0,          // GMT
  'Europe/Paris': 1,           // CET
  'Europe/Berlin': 1,          // CET
  'Africa/Cairo': 2,           // EET
  
  // Asia & Pacific
  'Asia/Dubai': 4,             // GST
  'Asia/Kolkata': 5.5,         // IST (India)
  'Asia/Singapore': 8,         // SGT
  'Asia/Tokyo': 9,             // JST
  'Australia/Sydney': 11,      // AEDT
  
  // Default
  'UTC': 0
}

/**
 * Detect timezone based on geolocation or browser
 * Falls back to UTC if detection fails
 */
export function detectTimezone(): string {
  try {
    // Use browser's Intl API for timezone detection
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (detected && TIMEZONE_OFFSETS[detected] !== undefined) {
      return detected
    }
    // Return detected even if not in our list - JS handles it
    return detected || 'UTC'
  } catch {
    return 'UTC'
  }
}

/**
 * Get start of day (00:00:00) in user's timezone
 */
function getStartOfDay(date: Date, timezone: string): Date {
  // Create date string in timezone, then parse back
  const dateStr = date.toLocaleDateString('en-CA', { timeZone: timezone }) // YYYY-MM-DD format
  const [year, month, day] = dateStr.split('-').map(Number)
  
  // Create UTC date at midnight, then adjust for timezone
  const offset = TIMEZONE_OFFSETS[timezone] ?? 0
  const utcMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
  utcMidnight.setUTCHours(utcMidnight.getUTCHours() - offset)
  
  return utcMidnight
}

/**
 * Get end of day (23:59:59.999) in user's timezone
 */
function getEndOfDay(date: Date, timezone: string): Date {
  const startOfDay = getStartOfDay(date, timezone)
  const endOfDay = new Date(startOfDay)
  endOfDay.setUTCHours(endOfDay.getUTCHours() + 23, 59, 59, 999)
  return endOfDay
}

/**
 * Get a full calendar day time window
 * Simple approach: 00:00 to 23:59 in user's timezone
 * 
 * @param daysAgo - 0 for today, 1 for yesterday, etc.
 * @param timezone - User's timezone (auto-detected if not provided)
 */
export function getTimeWindow(
  daysAgo: number = 0,
  timezone: string = detectTimezone()
): TimeWindow {
  const now = new Date()
  const targetDate = new Date(now)
  targetDate.setDate(targetDate.getDate() - daysAgo)
  
  const start = getStartOfDay(targetDate, timezone)
  const end = daysAgo === 0 ? now : getEndOfDay(targetDate, timezone)
  
  // Generate label
  let label: string
  if (daysAgo === 0) {
    label = 'Today'
  } else if (daysAgo === 1) {
    label = 'Yesterday'
  } else {
    label = `Last ${daysAgo + 1} days`
  }
  
  return {
    start,
    end,
    label,
    daysCovered: daysAgo + 1,
    timezone
  }
}

/**
 * Get time window spanning multiple days
 * 
 * @param days - Number of days to include (1 = today only, 3 = last 3 days, etc.)
 * @param timezone - User's timezone
 */
export function getMultiDayWindow(
  days: number = 1,
  timezone: string = detectTimezone()
): TimeWindow {
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - (days - 1))
  
  const start = getStartOfDay(startDate, timezone)
  
  let label: string
  if (days === 1) {
    label = 'Today'
  } else if (days === 7) {
    label = 'Last 7 days'
  } else {
    label = `Last ${days} days`
  }
  
  return {
    start,
    end: now,
    label,
    daysCovered: days,
    timezone
  }
}

/**
 * Get time window presets for UI
 */
export function getTimeWindowPresets(timezone: string = detectTimezone()): Array<{
  id: string
  label: string
  days: number
  window: TimeWindow
}> {
  return [
    { id: 'today', label: 'Today', days: 1, window: getMultiDayWindow(1, timezone) },
    { id: 'yesterday', label: 'Yesterday', days: 1, window: getTimeWindow(1, timezone) },
    { id: '3days', label: 'Last 3 days', days: 3, window: getMultiDayWindow(3, timezone) },
    { id: 'week', label: 'Last 7 days', days: 7, window: getMultiDayWindow(7, timezone) },
  ]
}

/**
 * Format time window for display
 */
export function formatTimeWindow(window: TimeWindow): string {
  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    timeZone: window.timezone
  })
  
  if (window.daysCovered <= 1) {
    return window.label
  }
  
  return `${formatDate(window.start)} - ${formatDate(window.end)}`
}

/**
 * Format timezone for display
 */
export function formatTimezone(timezone: string): string {
  const shortNames: Record<string, string> = {
    'America/Los_Angeles': 'PT',
    'America/Denver': 'MT', 
    'America/Chicago': 'CT',
    'America/New_York': 'ET',
    'America/Sao_Paulo': 'BRT',
    'Europe/London': 'GMT',
    'Europe/Paris': 'CET',
    'Europe/Berlin': 'CET',
    'Africa/Cairo': 'EET',
    'Asia/Dubai': 'GST',
    'Asia/Kolkata': 'IST',
    'Asia/Singapore': 'SGT',
    'Asia/Tokyo': 'JST',
    'Australia/Sydney': 'AEDT',
    'UTC': 'UTC'
  }
  
  return shortNames[timezone] || timezone.split('/').pop() || timezone
}

/**
 * Check if we should show "no updates" vs "quiet period"
 */
export function interpretEmptyResults(window: TimeWindow): {
  message: string
  suggestion: string
} {
  if (window.daysCovered < 1) {
    return {
      message: "No updates yet today.",
      suggestion: "Check back later, or view yesterday's updates"
    }
  }
  
  if (window.daysCovered === 1) {
    return {
      message: "No significant updates in the last 24 hours.",
      suggestion: "Things are calm! Focus on deep work."
    }
  }
  
  return {
    message: `No updates in the last ${window.daysCovered} days.`,
    suggestion: "Your connected tools may be quiet, or check integrations."
  }
}
