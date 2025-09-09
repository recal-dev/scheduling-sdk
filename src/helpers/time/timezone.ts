/**
 * Timezone utility functions for handling timezone-aware date conversions.
 * Uses native JavaScript Date API and Intl.DateTimeFormat for zero-dependency timezone support.
 */

/**
 * Converts a time (string HH:mm or number of minutes) in a specific timezone to a UTC Date object for a given date.
 *
 * @param timeStr - Time string in HH:mm format (e.g., "09:00", "14:30") or minutes from midnight (0-1439)
 * @param date - The date to apply the time to (timezone will be ignored, only year/month/day used)
 * @param timezone - IANA timezone identifier (e.g., "America/New_York", "Europe/London")
 * @returns UTC Date object representing the specified time in the given timezone
 *
 * @throws {Error} If timezone is invalid or time format is invalid
 *
 * @example
 * ```typescript
 * // 9 AM New York time on Jan 15, 2024
 * const date = new Date('2024-01-15')
 * const utcDate = convertTimeStringToUTC('09:00', date, 'America/New_York')
 * // Returns UTC date representing 9 AM EST (2 PM UTC) or 9 AM EDT (1 PM UTC) depending on DST
 * ```
 */
export function convertTimeStringToUTC(timeStr: string | number, date: Date, timezone: string): Date {
	// Parse time - handle both string and number formats
	let hours: number
	let minutes: number

	if (typeof timeStr === 'number') {
		// Handle minutes from midnight (0-1439)
		if (timeStr < 0 || timeStr >= 1440) {
			throw new Error(`Invalid time in minutes: ${timeStr}. Must be between 0 and 1439`)
		}
		hours = Math.floor(timeStr / 60)
		minutes = timeStr % 60
	} else {
		// Parse HH:mm string format
		const [hoursStr, minutesStr] = timeStr.split(':')
		hours = parseInt(hoursStr!, 10)
		minutes = parseInt(minutesStr!, 10)

		if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
			throw new Error(`Invalid time format: ${timeStr}. Expected HH:mm format (e.g., "09:00")`)
		}
	}

	try {
		// Validate timezone
		if (!isValidTimezone(timezone)) {
			throw new Error(`Invalid timezone: ${timezone}`)
		}

		// Use the approach of creating a date string with timezone info
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`

		// Create an ISO string without timezone, then determine what timezone offset applies
		const isoString = `${year}-${month}-${day}T${timeString}.000`

		// Create a test date to determine the timezone offset for this specific date/time
		const testDate = new Date(`${isoString}Z`) // Parse as UTC first

		// Use Intl.DateTimeFormat to get the offset for the target timezone on this date
		const offsetMinutes = getTimezoneOffsetMinutes(testDate, timezone)

		// Apply the offset: if timezone is UTC-5, we need to add 5 hours to get UTC
		return new Date(testDate.getTime() + offsetMinutes * 60 * 1000)
	} catch {
		throw new Error(`Invalid timezone: ${timezone}. Must be a valid IANA timezone identifier.`)
	}
}

/**
 * Gets the timezone offset in minutes for a specific date and timezone.
 * Positive values mean the timezone is ahead of UTC, negative means behind.
 */
function getTimezoneOffsetMinutes(date: Date, timezone: string): number {
	// Create two copies of the date: one in UTC, one in the target timezone
	const utcTime = date.getTime()

	// Get the date/time components as they would appear in the target timezone
	const formatter = new Intl.DateTimeFormat('en-CA', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	})

	const parts = formatter.formatToParts(date)
	const year = parseInt(parts.find(p => p.type === 'year')?.value || '0')
	const month = parseInt(parts.find(p => p.type === 'month')?.value || '1')
	const day = parseInt(parts.find(p => p.type === 'day')?.value || '1')
	const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
	const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
	const second = parseInt(parts.find(p => p.type === 'second')?.value || '0')

	// Create a new date treating those components as UTC
	const localAsUTC = new Date(Date.UTC(year, month - 1, day, hour, minute, second))

	// The difference gives us the offset
	return (utcTime - localAsUTC.getTime()) / (60 * 1000)
}

/**
 * Creates a Date object representing a specific time on a given date in a timezone.
 *
 * @param date - Base date (year/month/day will be used)
 * @param hours - Hours (0-23)
 * @param minutes - Minutes (0-59)
 * @param timezone - IANA timezone identifier
 * @returns UTC Date object representing the specified time in the given timezone
 *
 * @example
 * ```typescript
 * const date = new Date('2024-01-15')
 * const utcDate = createDateInTimezone(date, 9, 30, 'America/New_York')
 * // Returns UTC date representing 9:30 AM New York time
 * ```
 */
export function createDateInTimezone(date: Date, hours: number, minutes: number, timezone: string): Date {
	const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
	return convertTimeStringToUTC(timeStr, date, timezone)
}

/**
 * Validates that a timezone string is a valid IANA timezone identifier.
 *
 * @param timezone - Timezone string to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidTimezone('America/New_York') // true
 * isValidTimezone('EST') // false (not IANA format)
 * isValidTimezone('Invalid/Timezone') // false
 * ```
 */
export function isValidTimezone(timezone: string): boolean {
	try {
		// Basic format validation
		if (!timezone || timezone.includes(' ') || timezone.length < 3) {
			return false
		}

		// Special case for UTC
		if (timezone === 'UTC') {
			return true
		}

		// IANA timezone identifiers typically contain forward slash (e.g., "America/New_York")
		// But allow some exceptions like GMT
		if (!timezone.includes('/') && !['GMT'].includes(timezone)) {
			return false
		}

		// Try to use the timezone with Intl.DateTimeFormat
		new Intl.DateTimeFormat('en-US', { timeZone: timezone })
		return true
	} catch {
		return false
	}
}
