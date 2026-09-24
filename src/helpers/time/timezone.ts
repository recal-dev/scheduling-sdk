/**
 * Timezone utility functions for handling timezone-aware date conversions.
 * Uses native JavaScript Date API and Intl.DateTimeFormat for zero-dependency timezone support.
 */

import type { BusyTime } from '../../types/scheduling.types'
import { MS_PER_HOUR, MS_PER_MINUTE } from '../../utils/constants'
import { mergeBusyTimes } from '../busy-time/merge'

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
const offsetFormatters = new Map<string, Intl.DateTimeFormat>()

/**
 * One formatter per timezone, kept rather than rebuilt.
 *
 * Constructing an `Intl.DateTimeFormat` costs orders of magnitude more than using one, and
 * resolving a window bisects for offset changes, so this runs thousands of times per week
 * converted.
 */
function offsetFormatter(timezone: string): Intl.DateTimeFormat {
	const cached = offsetFormatters.get(timezone)
	if (cached) return cached
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
	offsetFormatters.set(timezone, formatter)
	return formatter
}

function getTimezoneOffsetMinutes(date: Date, timezone: string): number {
	// Create two copies of the date: one in UTC, one in the target timezone
	const utcTime = date.getTime()

	const parts = offsetFormatter(timezone).formatToParts(date)
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

/**
 * The spans of constant UTC offset covering `[from, to)`, each change located by bisection.
 *
 * Transitions land on a whole minute, so bisecting to the minute is exact rather than the
 * approximation sampling at a fixed resolution would give.
 */
function offsetSegments(
	from: number,
	to: number,
	timezone: string
): Array<{ from: number; to: number; offset: number }> {
	const segments: Array<{ from: number; to: number; offset: number }> = []
	let segmentStart = from
	let cursor = from
	let offset = getTimezoneOffsetMinutes(new Date(cursor), timezone)

	while (cursor < to) {
		const probe = Math.min(cursor + MS_PER_HOUR, to)
		if (getTimezoneOffsetMinutes(new Date(probe), timezone) === offset) {
			cursor = probe
			continue
		}

		let low = cursor
		let high = probe
		while (high - low > MS_PER_MINUTE) {
			const mid = low + Math.floor((high - low) / 2)
			if (getTimezoneOffsetMinutes(new Date(mid), timezone) === offset) low = mid
			else high = mid
		}
		segments.push({ from: segmentStart, to: high, offset })
		segmentStart = high
		cursor = high
		offset = getTimezoneOffsetMinutes(new Date(cursor), timezone)
	}

	segments.push({ from: segmentStart, to, offset })
	return segments
}

/**
 * The instants on a local date whose wall-clock time falls inside `[startMinutes, endMinutes)`.
 *
 * A weekly pattern names times on the host's clock, not instants, so a window is a *set* of
 * moments rather than a pair of resolved endpoints. The difference shows only on the two days a
 * year a zone changes offset, and there it is the whole point:
 *
 * - a wall time the clock skips is absent from the set, so a window containing a spring-forward
 *   loses exactly the missing hour instead of running an hour past its stated end;
 * - a wall time the clock repeats occurs twice, so such a window is returned as two intervals.
 *
 * Resolving two endpoints separately can express neither: it always yields one interval whose
 * length is the wall duration, whatever the day actually held.
 *
 * `endMinutes` may be 1440, meaning midnight at the end of the local date.
 *
 * @throws {Error} when the timezone is not a valid IANA identifier
 */
export function resolveWallWindow(
	year: number,
	month: number,
	day: number,
	startMinutes: number,
	endMinutes: number,
	timezone: string
): BusyTime[] {
	if (!isValidTimezone(timezone)) {
		throw new Error(`Invalid timezone: ${timezone}. Must be a valid IANA timezone identifier.`)
	}

	const dayStartAsUTC = Date.UTC(year, month, day)
	// Wide enough for any real offset, plus a transition on either side of the date.
	const searchFrom = dayStartAsUTC - 26 * MS_PER_HOUR
	const searchTo = dayStartAsUTC + 50 * MS_PER_HOUR

	const found: BusyTime[] = []
	for (const segment of offsetSegments(searchFrom, searchTo, timezone)) {
		// `offset` is the minutes to add to a wall time to reach UTC.
		const start = Math.max(dayStartAsUTC + (startMinutes + segment.offset) * MS_PER_MINUTE, segment.from)
		const end = Math.min(dayStartAsUTC + (endMinutes + segment.offset) * MS_PER_MINUTE, segment.to)
		if (start < end) found.push({ start: new Date(start), end: new Date(end) })
	}

	return mergeBusyTimes(found)
}
