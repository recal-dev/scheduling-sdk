/**
 * Represents a day of the week as a lowercase string.
 * Used for specifying which days availability schedules apply to.
 *
 * @example
 * ```typescript
 * const workDays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
 * const weekendDays: DayOfWeek[] = ['saturday', 'sunday']
 * ```
 */
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export const workDays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

export const weekendDays: DayOfWeek[] = ['saturday', 'sunday']

/**
 * Defines availability schedule for specific days of the week.
 * Multiple schedules can be used for the same day to create breaks.
 *
 * @example
 * ```typescript
 * // Regular work schedule
 * const workSchedule: DaySchedule = {
 *   days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
 *   start: '09:00',
 *   end: '17:00'
 * }
 *
 * // Schedule with lunch break (implicit break 12:00-13:00)
 * const morningSchedule: DaySchedule = { days: ['monday'], start: '09:00', end: '12:00' }
 * const afternoonSchedule: DaySchedule = { days: ['monday'], start: '13:00', end: '17:00' }
 * ```
 */
export interface DaySchedule {
	/** Array of days this schedule applies to. Must contain at least one valid day. */
	days: DayOfWeek[]
	/** Start time in 24-hour HH:mm format (e.g., "09:00", "14:30"). */
	start: string
	/** End time in 24-hour HH:mm format (e.g., "17:00", "23:30"). Must be after start time. */
	end: string
}

/**
 * Defines a weekly availability pattern with multiple schedules.
 * Represents when time slots are available for scheduling.
 *
 * Note: Timezone is now specified at the scheduler level, not here.
 *
 * @example
 * ```typescript
 * // Business hours with different weekend schedule
 * const availability: WeeklyAvailability = {
 *   schedules: [
 *     { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '09:00', end: '17:00' },
 *     { days: ['saturday'], start: '10:00', end: '14:00' }
 *   ]
 * }
 *
 * // Doctor schedule with lunch breaks
 * const doctorAvailability: WeeklyAvailability = {
 *   schedules: [
 *     { days: ['monday', 'wednesday', 'friday'], start: '08:00', end: '12:00' },
 *     { days: ['monday', 'wednesday', 'friday'], start: '13:00', end: '17:00' },
 *     { days: ['tuesday', 'thursday'], start: '14:00', end: '20:00' }
 *   ]
 * }
 * ```
 */
export interface WeeklyAvailability {
	/** Array of availability schedules. Must contain at least one schedule. */
	schedules: DaySchedule[]
}
