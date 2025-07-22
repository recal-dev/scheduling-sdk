import type { DayOfWeek, WeeklyAvailability } from '../types/availability.types.ts'

const VALID_DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

/**
 * Checks if a time string matches the required HH:mm format.
 *
 * @param time - Time string to validate
 * @returns True if the format is valid (HH:mm with valid hours and minutes)
 *
 * @internal
 */
function isValidTimeFormat(time: string): boolean {
	const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
	return timeRegex.test(time)
}

/**
 * Converts a time string to total minutes from midnight.
 *
 * @param time - Time string in HH:mm format
 * @returns Total minutes from midnight (e.g., "14:30" returns 870)
 *
 * @internal
 */
function parseTime(time: string): number {
	const parts = time.split(':').map(Number)
	const hours = parts[0] ?? 0
	const minutes = parts[1] ?? 0
	return hours * 60 + minutes
}

/**
 * Validates a WeeklyAvailability object for correctness and consistency.
 *
 * Performs comprehensive validation including:
 * - Object structure validation
 * - Schedule array validation
 * - Day name validation
 * - Time format validation (HH:mm)
 * - Time range validation (start < end)
 * - Overlap detection between schedules on the same day
 * - Optional timezone format validation
 *
 * @param availability - The availability object to validate (can be undefined)
 *
 * @throws {Error} With descriptive message if validation fails
 *
 * @example
 * ```typescript
 * // Valid availability passes without error
 * const validAvailability = {
 *   schedules: [
 *     { days: ['monday', 'tuesday'], start: '09:00', end: '17:00' }
 *   ],
 *   timezone: 'America/New_York'
 * }
 * validateWeeklyAvailability(validAvailability) // No error
 *
 * // Invalid availability throws descriptive error
 * const invalidAvailability = {
 *   schedules: [
 *     { days: ['monday'], start: '17:00', end: '09:00' } // End before start!
 *   ]
 * }
 * validateWeeklyAvailability(invalidAvailability)
 * // Throws: "Schedule at index 0: start time (17:00) must be before end time (09:00)"
 * ```
 *
 * @example
 * ```typescript
 * // Use in error handling
 * try {
 *   validateWeeklyAvailability(userInput)
 *   const scheduler = new AvailabilityScheduler(userInput)
 * } catch (error) {
 *   console.error('Invalid availability:', error.message)
 *   // Show user-friendly error message
 *   showError(`Availability configuration error: ${error.message}`)
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Undefined availability is valid (optional parameter)
 * validateWeeklyAvailability(undefined) // No error
 * validateWeeklyAvailability() // No error
 *
 * // Null or other types are invalid
 * validateWeeklyAvailability(null) // Throws error
 * validateWeeklyAvailability("invalid") // Throws error
 * ```
 */
export function validateWeeklyAvailability(availability?: WeeklyAvailability): void {
	if (availability === undefined) {
		return
	}
	if (typeof availability !== 'object' || availability === null) {
		throw new Error('Availability must be an object')
	}

	if (!Array.isArray(availability.schedules)) {
		throw new Error('Availability.schedules must be an array')
	}

	if (availability.schedules.length === 0) {
		throw new Error('Availability.schedules cannot be empty')
	}

	// Note: Timezone validation has been moved to AvailabilityScheduler constructor

	// Validate each schedule
	for (let i = 0; i < availability.schedules.length; i++) {
		const schedule = availability.schedules[i]!

		if (!schedule || typeof schedule !== 'object') {
			throw new Error(`Schedule at index ${i} must be an object`)
		}

		// Validate days array
		if (!Array.isArray(schedule.days)) {
			throw new Error(`Schedule at index ${i}: days must be an array`)
		}

		// Allow empty days array - it results in no availability (all time busy)

		for (const day of schedule.days) {
			if (!VALID_DAYS.includes(day)) {
				throw new Error(`Schedule at index ${i}: invalid day "${day}". Valid days: ${VALID_DAYS.join(', ')}`)
			}
		}

		// Check for duplicate days within the same schedule
		const uniqueDays = new Set(schedule.days)
		if (uniqueDays.size !== schedule.days.length) {
			throw new Error(`Schedule at index ${i}: duplicate days found`)
		}

		// Validate start time format
		if (typeof schedule.start !== 'string' || !isValidTimeFormat(schedule.start)) {
			throw new Error(`Schedule at index ${i}: start must be in HH:mm format (e.g., "09:00")`)
		}

		// Validate end time format
		if (typeof schedule.end !== 'string' || !isValidTimeFormat(schedule.end)) {
			throw new Error(`Schedule at index ${i}: end must be in HH:mm format (e.g., "17:00")`)
		}

		// Validate time range
		const startMinutes = parseTime(schedule.start)
		const endMinutes = parseTime(schedule.end)

		if (startMinutes >= endMinutes) {
			throw new Error(
				`Schedule at index ${i}: start time (${schedule.start}) must be before end time (${schedule.end})`
			)
		}
	}

	// Check for overlapping schedules on the same day
	const daySchedules = new Map<DayOfWeek, Array<{ start: number; end: number; index: number }>>()

	for (let i = 0; i < availability.schedules.length; i++) {
		const schedule = availability.schedules[i]!
		const startMinutes = parseTime(schedule.start)
		const endMinutes = parseTime(schedule.end)

		for (const day of schedule.days) {
			if (!daySchedules.has(day)) {
				daySchedules.set(day, [])
			}

			const existing = daySchedules.get(day)!

			// Check for overlaps with existing schedules for this day
			for (const existingSchedule of existing) {
				if (startMinutes < existingSchedule.end && existingSchedule.start < endMinutes) {
					throw new Error(
						`Overlapping schedules found for ${day}: schedule ${i} (${schedule.start}-${schedule.end}) overlaps with schedule ${existingSchedule.index}`
					)
				}
			}

			existing.push({ start: startMinutes, end: endMinutes, index: i })
		}
	}
}
