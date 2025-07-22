import type { DayOfWeek, WeeklyAvailability } from '../../types/availability.types'
import type { BusyTime } from '../../types/scheduling.types'
import { convertTimeStringToUTC } from '../time/timezone'

const DAY_MAP: Record<DayOfWeek, number> = {
	sunday: 0,
	monday: 1,
	tuesday: 2,
	wednesday: 3,
	thursday: 4,
	friday: 5,
	saturday: 6,
}

/**
 * Parses a time string in HH:mm format and returns hours and minutes as numbers.
 *
 * @param timeStr - Time string in HH:mm format (e.g., "09:00", "14:30")
 * @returns Object with hours and minutes as numbers
 * @throws {Error} If the time format is invalid
 *
 * @internal
 */
function parseTimeString(timeStr: string): { hours: number; minutes: number } {
	const [hoursStr, minutesStr] = timeStr.split(':')
	const hours = parseInt(hoursStr!, 10)
	const minutes = parseInt(minutesStr!, 10)

	if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
		throw new Error(`Invalid time format: ${timeStr}. Expected HH:mm format (e.g., "09:00")`)
	}

	return { hours, minutes }
}

/**
 * Generates busy times in the availability's native timezone without any conversions.
 * This avoids cross-day boundary issues since all processing stays in the same timezone.
 *
 * @param availability - The weekly availability pattern
 * @param weekStartInTimezone - Monday of week in the availability timezone
 * @returns Array of busy times in the availability timezone
 *
 * @internal
 */
function generateBusyTimesInNativeTimezone(
	availability: WeeklyAvailability,
	weekStartInTimezone: Date,
	timezone: string
): Array<{ start: Date; end: Date }> {
	const busyTimes: Array<{ start: Date; end: Date }> = []

	// For each day of the week, build busy times (no timezone conversion needed!)
	// Include the day before ONLY if needed for timezone spillover into Monday
	const startOffset = timezone !== 'UTC' ? -1 : 0 // Only include previous day for non-UTC timezones
	for (let dayOffset = startOffset; dayOffset < 7; dayOffset++) {
		const currentDay = new Date(
			Date.UTC(
				weekStartInTimezone.getFullYear(),
				weekStartInTimezone.getMonth(),
				weekStartInTimezone.getDate() + dayOffset
			)
		)
		const dayOfWeek = currentDay.getUTCDay()

		// Find all availability schedules for this day
		const daySchedules: Array<{ start: Date; end: Date }> = []

		for (const schedule of availability.schedules) {
			const startTime = parseTimeString(schedule.start)
			const endTime = parseTimeString(schedule.end)

			if (
				startTime.hours > endTime.hours ||
				(startTime.hours === endTime.hours && startTime.minutes >= endTime.minutes)
			) {
				throw new Error(`Invalid time range: ${schedule.start} to ${schedule.end}. Start must be before end.`)
			}

			for (const dayName of schedule.days) {
				if (DAY_MAP[dayName] === dayOfWeek) {
					// Create dates in the native timezone (no conversion!)
					const startDate = new Date(
						Date.UTC(
							currentDay.getUTCFullYear(),
							currentDay.getUTCMonth(),
							currentDay.getUTCDate(),
							startTime.hours,
							startTime.minutes
						)
					)

					const endDate = new Date(
						Date.UTC(
							currentDay.getUTCFullYear(),
							currentDay.getUTCMonth(),
							currentDay.getUTCDate(),
							endTime.hours,
							endTime.minutes
						)
					)

					daySchedules.push({ start: startDate, end: endDate })
				}
			}
		}

		// Sort schedules by start time
		daySchedules.sort((a, b) => a.start.getTime() - b.start.getTime())

		// Create start and end of day in the native timezone (no system timezone dependency)
		const dayStart = new Date(
			Date.UTC(currentDay.getUTCFullYear(), currentDay.getUTCMonth(), currentDay.getUTCDate(), 0, 0, 0, 0)
		)
		const dayEnd = new Date(
			Date.UTC(currentDay.getUTCFullYear(), currentDay.getUTCMonth(), currentDay.getUTCDate(), 23, 59, 59, 999)
		)

		if (daySchedules.length === 0) {
			// No availability, entire day is busy
			busyTimes.push({ start: dayStart, end: dayEnd })
			continue
		}

		// Add busy time from start of day to first available period
		if (daySchedules[0]!.start.getTime() > dayStart.getTime()) {
			busyTimes.push({ start: dayStart, end: daySchedules[0]!.start })
		}

		// Add busy times between available periods
		for (let i = 0; i < daySchedules.length - 1; i++) {
			const currentEnd = daySchedules[i]!.end
			const nextStart = daySchedules[i + 1]!.start

			if (currentEnd.getTime() < nextStart.getTime()) {
				busyTimes.push({ start: currentEnd, end: nextStart })
			}
		}

		// Add busy time from last available period to end of day
		const lastSchedule = daySchedules[daySchedules.length - 1]!
		if (lastSchedule.end.getTime() < dayEnd.getTime()) {
			busyTimes.push({ start: lastSchedule.end, end: dayEnd })
		}
	}

	return busyTimes
}

/**
 * Converts a weekly availability pattern into busy times for a specific week.
 *
 * This function inverts the availability concept: it takes available time periods
 * and generates busy times for all the unavailable periods. For example, if you're
 * available Monday 9-17, it creates busy times for Monday 0-9 and 17-24, plus
 * all day Tuesday through Sunday.
 *
 * Automatically chooses between legacy per-day processing and timezone-aware
 * week-wide processing based on whether cross-day boundary issues are possible.
 *
 * @param availability - The weekly availability pattern to convert
 * @param weekStart - The Monday date for the week to process (MUST be a Monday)
 * @param timezone - IANA timezone identifier for processing availability times
 *
 * @returns Array of busy times representing unavailable periods for that week
 *
 * @throws {Error} If weekStart is not a Monday (getDay() !== 1)
 * @throws {Error} If availability contains invalid time formats or ranges
 * @throws {Error} If timezone is invalid
 *
 * @example
 * ```typescript
 * const availability = {
 *   schedules: [
 *     { days: ['monday', 'wednesday', 'friday'], start: '09:00', end: '17:00' },
 *     { days: ['tuesday', 'thursday'], start: '10:00', end: '16:00' }
 *   ],
 *   timezone: 'America/New_York'
 * }
 *
 * const mondayDate = new Date('2024-01-01T00:00:00Z') // Must be Monday
 * const busyTimes = weeklyAvailabilityToBusyTimes(availability, mondayDate)
 *
 * // Returns busy times for:
 * // - Monday: 00:00-14:00, 22:00-23:59 (9 AM - 5 PM NY time converted to UTC)
 * // - Tuesday: 00:00-15:00, 21:00-23:59 (10 AM - 4 PM NY time converted to UTC)
 * // etc.
 * ```
 *
 * @example
 * ```typescript
 * // Override timezone at call time
 * const busyTimes = weeklyAvailabilityToBusyTimes(availability, mondayDate, 'Europe/London')
 * // Uses London time regardless of availability.timezone
 * ```
 */
export function weeklyAvailabilityToBusyTimes(
	availability: WeeklyAvailability,
	weekStart: Date,
	timezone?: string
): BusyTime[] {
	if (weekStart.getDay() !== 1) {
		throw new Error('weekStart must be a Monday (getDay() === 1)')
	}

	// Use the provided timezone with fallbacks: provided > env var > UTC
	const resolvedTimezone = timezone || process.env.SCHEDULING_TIMEZONE || 'UTC'

	// Convert weekStart to represent the same calendar date in the availability timezone
	// This avoids all cross-day boundary issues by working in the availability's native timezone
	const weekStartInTimezone = new Date(
		Date.UTC(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate())
	)

	// Generate busy times in the availability's native timezone (no cross-day issues!)
	const busyTimesInTimezone = generateBusyTimesInNativeTimezone(availability, weekStartInTimezone, resolvedTimezone)

	// For UTC timezone, no conversion needed
	if (resolvedTimezone === 'UTC') {
		return busyTimesInTimezone
	}

	// For non-UTC timezones, convert busy times to UTC using the existing timezone utility
	const busyTimesUTC: BusyTime[] = []
	for (const busyTime of busyTimesInTimezone) {
		// Use convertTimeStringToUTC with the original date to avoid circular conversion issues
		const startTimeStr = `${String(busyTime.start.getUTCHours()).padStart(2, '0')}:${String(busyTime.start.getUTCMinutes()).padStart(2, '0')}`
		const endTimeStr = `${String(busyTime.end.getUTCHours()).padStart(2, '0')}:${String(busyTime.end.getUTCMinutes()).padStart(2, '0')}`

		// Create new Date with just the calendar date (year/month/day) for timezone conversion
		const startDate = new Date(
			busyTime.start.getUTCFullYear(),
			busyTime.start.getUTCMonth(),
			busyTime.start.getUTCDate()
		)
		const endDate = new Date(busyTime.end.getUTCFullYear(), busyTime.end.getUTCMonth(), busyTime.end.getUTCDate())

		const startUTC = convertTimeStringToUTC(startTimeStr, startDate, resolvedTimezone)
		const endUTC = convertTimeStringToUTC(endTimeStr, endDate, resolvedTimezone)

		busyTimesUTC.push({ start: startUTC, end: endUTC })
	}

	return busyTimesUTC
}
