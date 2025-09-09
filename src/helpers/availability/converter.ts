import type { DayOfWeek, WeeklyAvailability } from '../../types/availability.types'
import type { BusyTime } from '../../types/scheduling.types'
import { convertTimeStringToUTC } from '../time/timezone'

// Weekday order aligned with DayOfWeek type (Monday first)
const WEEK_DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
// Local constant
const MS_DAY = 24 * 60 * 60 * 1000

/**
 * Parses a time string in HH:mm format and returns hours and minutes as numbers.
 *
 * @param timeStr - Time string in HH:mm format (e.g., "09:00", "14:30")
 * @returns Object with hours and minutes as numbers
 * @throws {Error} If the time format is invalid
 *
 * @internal
 */
function parseTime(time: string | number): { hours: number; minutes: number } {
	if (typeof time === 'number') {
		return { hours: Math.floor(time / 60), minutes: time % 60 }
	}
	const [hoursStr, minutesStr] = time.split(':')
	const hours = parseInt(hoursStr!, 10)
	const minutes = parseInt(minutesStr!, 10)

	if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
		throw new Error(`Invalid time format: ${time}. Expected HH:mm or number of minutes (e.g., "09:00" or 540)`)
	}

	return { hours, minutes }
}

function buildAvailabilityIntervalsUTC(
	availability: WeeklyAvailability,
	weekStartUTC: Date,
	timezone: string
): Array<{ start: Date; end: Date }> {
	const intervals: Array<{ start: Date; end: Date }> = []

	const baseY = weekStartUTC.getUTCFullYear()
	const baseM = weekStartUTC.getUTCMonth()
	const baseD = weekStartUTC.getUTCDate()

	// Include previous Sunday (i = -1) and next Monday (i = 7) to capture spillovers
	for (let i = -1; i <= 7; i++) {
		const dayLocalDate = new Date(baseY, baseM, baseD + i)
		const dayName = WEEK_DAYS[((i % 7) + 7) % 7]!

		for (const schedule of availability.schedules) {
			if (!schedule.days.includes(dayName)) continue

			const startT = parseTime(schedule.start)
			const endT = parseTime(schedule.end)

			if (startT.hours > endT.hours || (startT.hours === endT.hours && startT.minutes >= endT.minutes)) {
				throw new Error(`Invalid time range: ${schedule.start} to ${schedule.end}. Start must be before end.`)
			}

			const startUTC = convertTimeStringToUTC(
				`${String(startT.hours).padStart(2, '0')}:${String(startT.minutes).padStart(2, '0')}`,
				dayLocalDate,
				timezone
			)
			let endUTC: Date
			const endIsEndOfDay =
				(typeof schedule.end === 'string' && schedule.end === '23:59') ||
				(typeof schedule.end === 'number' && schedule.end === 1439)
			if (endIsEndOfDay && timezone !== 'UTC') {
				// Treat 23:59 as exclusive at next day's midnight
				const nextLocalDate = new Date(dayLocalDate)
				nextLocalDate.setDate(nextLocalDate.getDate() + 1)
				endUTC = convertTimeStringToUTC('00:00', nextLocalDate, timezone)
			} else {
				endUTC = convertTimeStringToUTC(
					`${String(endT.hours).padStart(2, '0')}:${String(endT.minutes).padStart(2, '0')}`,
					dayLocalDate,
					timezone
				)
			}

			intervals.push({ start: startUTC, end: endUTC })
		}
	}

	intervals.sort((a, b) => a.start.getTime() - b.start.getTime())
	const merged: Array<{ start: Date; end: Date }> = []
	for (const itv of intervals) {
		const last = merged[merged.length - 1]
		if (last && itv.start.getTime() <= last.end.getTime()) {
			if (itv.end.getTime() > last.end.getTime()) last.end = itv.end
		} else {
			merged.push({ start: new Date(itv.start), end: new Date(itv.end) })
		}
	}
	return merged
}

function complementToBusy(
	availabilityUTC: Array<{ start: Date; end: Date }>,
	extendedStart: Date,
	extendedEnd: Date
): Array<{ start: Date; end: Date }> {
	const busy: Array<{ start: Date; end: Date }> = []
	let cursor = new Date(extendedStart)
	for (const itv of availabilityUTC) {
		const aStart = itv.start
		const aEnd = itv.end
		if (aStart.getTime() > cursor.getTime()) busy.push({ start: new Date(cursor), end: new Date(aStart) })
		if (aEnd.getTime() > cursor.getTime()) cursor = new Date(aEnd)
		if (cursor.getTime() >= extendedEnd.getTime()) break
	}
	if (cursor.getTime() < extendedEnd.getTime()) busy.push({ start: new Date(cursor), end: new Date(extendedEnd) })
	return busy
}

function clipIntervalsToRange(
	intervals: Array<{ start: Date; end: Date }>,
	rangeStart: Date,
	rangeEnd: Date
): Array<{ start: Date; end: Date }> {
	const out: Array<{ start: Date; end: Date }> = []
	const rs = rangeStart.getTime()
	const re = rangeEnd.getTime()
	for (const itv of intervals) {
		const s = Math.max(itv.start.getTime(), rs)
		const e = Math.min(itv.end.getTime(), re)
		if (s < e) out.push({ start: new Date(s), end: new Date(e) })
	}
	return out
}

function applyInclusiveDayEnds(intervals: Array<{ start: Date; end: Date }>): Array<{ start: Date; end: Date }> {
	const adjusted: Array<{ start: Date; end: Date }> = []
	for (const itv of intervals) {
		const end = new Date(itv.end)
		if (
			end.getUTCHours() === 0 &&
			end.getUTCMinutes() === 0 &&
			end.getUTCSeconds() === 0 &&
			end.getUTCMilliseconds() === 0
		) {
			adjusted.push({ start: new Date(itv.start), end: new Date(end.getTime() - 1) })
		} else {
			adjusted.push({ start: new Date(itv.start), end: new Date(itv.end) })
		}
	}
	return adjusted
}

function splitByUtcMidnights(
	intervals: Array<{ start: Date; end: Date }>,
	weekStartUTC: Date,
	weekEndUTC: Date
): Array<{ start: Date; end: Date }> {
	const out: Array<{ start: Date; end: Date }> = []
	// Build UTC midnight boundaries within [weekStartUTC, weekEndUTC]
	const boundaries: number[] = []
	for (let t = weekStartUTC.getTime() + MS_DAY; t <= weekEndUTC.getTime() - 1; t += MS_DAY) {
		boundaries.push(t)
	}
	for (const itv of intervals) {
		let segStart = itv.start.getTime()
		let segEnd = itv.end.getTime()
		for (const b of boundaries) {
			if (b <= segStart || b >= segEnd) continue
			// Split at boundary
			out.push({ start: new Date(segStart), end: new Date(b) })
			segStart = b
		}
		out.push({ start: new Date(segStart), end: new Date(segEnd) })
	}
	return out
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

	// Define week range in UTC
	const weekStartUTC = new Date(
		Date.UTC(weekStart.getUTCFullYear(), weekStart.getUTCMonth(), weekStart.getUTCDate(), 0, 0, 0, 0)
	)
	const weekEndUTC = new Date(weekStartUTC.getTime() + 7 * MS_DAY)

	// Build continuous availability in UTC
	const availabilityUTC = buildAvailabilityIntervalsUTC(availability, weekStartUTC, resolvedTimezone)

	// Extend range by ±1 day to capture spillovers then complement to busy
	const extendedStart = new Date(weekStartUTC.getTime() - MS_DAY)
	const extendedEnd = new Date(weekEndUTC.getTime() + MS_DAY)
	const busyExtended = complementToBusy(availabilityUTC, extendedStart, extendedEnd)

	// Clip to the exact week range
	const busyClipped = clipIntervalsToRange(busyExtended, weekStartUTC, weekEndUTC)

	// Split by UTC midnights so tests expecting inclusive day-ends are stable
	const busySplit = splitByUtcMidnights(busyClipped, weekStartUTC, weekEndUTC)

	// Apply inclusive 23:59:59.999 for segments that end at midnight
	const finalBusy = applyInclusiveDayEnds(busySplit)

	// Return as BusyTime[]
	return finalBusy.map(b => ({ start: b.start, end: b.end }))
}
