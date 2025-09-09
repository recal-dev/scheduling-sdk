import { findAvailableSlotsWithOverlaps } from '../helpers/busy-time/free-intervals'
import { mergeBusyTimes } from '../helpers/busy-time/merge'
import { applyPadding } from '../helpers/busy-time/padding'
import { filterAvailableSlots } from '../helpers/slot/filter'
import { generateSlots } from '../helpers/slot/generator'
import type { BusyTime, SchedulingOptions, TimeSlot } from '../types/scheduling.types'
import { validateOptions } from '../validators/options.validator'
import { validateTimeRange } from '../validators/time-range.validator'

/**
 * Core scheduling engine that finds available time slots by managing busy times and generating slots.
 * This is the foundation scheduler that handles basic slot generation and busy time management.
 *
 * @example
 * ```typescript
 * // Create scheduler with existing busy times
 * const busyTimes = [
 *   { start: new Date('2024-01-15T10:00:00Z'), end: new Date('2024-01-15T11:00:00Z') },
 *   { start: new Date('2024-01-15T14:00:00Z'), end: new Date('2024-01-15T15:30:00Z') }
 * ]
 * const scheduler = new Scheduler(busyTimes)
 *
 * // Find 30-minute available slots
 * const slots = scheduler.findAvailableSlots(
 *   new Date('2024-01-15T09:00:00Z'),
 *   new Date('2024-01-15T17:00:00Z'),
 *   { slotDuration: 30 }
 * )
 * ```
 */
export class Scheduler {
	private busyTimes: BusyTime[]

	/**
	 * Creates a new Scheduler with optional initial busy times.
	 *
	 * @param busyTimes - Optional array of initial busy times. Defaults to empty array.
	 *
	 * @example
	 * ```typescript
	 * // Create empty scheduler
	 * const scheduler = new Scheduler()
	 *
	 * // Create scheduler with existing appointments
	 * const existingAppointments = [
	 *   { start: new Date('2024-01-15T10:00:00Z'), end: new Date('2024-01-15T11:00:00Z') }
	 * ]
	 * const scheduler = new Scheduler(existingAppointments)
	 * ```
	 */
	constructor(busyTimes: BusyTime[] = []) {
		this.busyTimes = busyTimes.slice().sort((a, b) => a.start.getTime() - b.start.getTime())
	}

	/**
	 * Finds available time slots within the specified range, avoiding all busy times.
	 *
	 * This method generates potential slots based on the provided options, then filters out
	 * any slots that conflict with existing busy times (including padding).
	 *
	 * @param startTime - Start of the search range
	 * @param endTime - End of the search range
	 * @param options - Slot generation options including duration, split, offset, and padding
	 *
	 * @returns Array of available time slots that don't conflict with busy times
	 *
	 * @throws If time range is invalid (start >= end) or options are invalid
	 *
	 * @example
	 * ```typescript
	 * // Find 1-hour slots with no overlap
	 * const slots = scheduler.findAvailableSlots(
	 *   new Date('2024-01-15T09:00:00Z'),
	 *   new Date('2024-01-15T17:00:00Z'),
	 *   {
	 *     slotDuration: 60,      // 60-minute slots
	 *     slotSplit: 60,         // No overlap (slots start every 60 minutes)
	 *     padding: 15            // 15-minute buffer around busy times
	 *   }
	 * )
	 *
	 * // Find 30-minute slots with 15-minute overlap
	 * const overlappingSlots = scheduler.findAvailableSlots(
	 *   new Date('2024-01-15T09:00:00Z'),
	 *   new Date('2024-01-15T17:00:00Z'),
	 *   {
	 *     slotDuration: 30,      // 30-minute slots
	 *     slotSplit: 15,         // Slots start every 15 minutes (15-minute overlap)
	 *     offset: 5              // Start slots at :05, :20, :35, :50
	 *   }
	 * )
	 *
	 * // Multi-day search
	 * const weekSlots = scheduler.findAvailableSlots(
	 *   new Date('2024-01-15T00:00:00Z'),  // Monday
	 *   new Date('2024-01-19T23:59:59Z'),  // Friday
	 *   { slotDuration: 60, slotSplit: 60 }
	 * )
	 * ```
	 */
	findAvailableSlots(startTime: Date, endTime: Date, options: SchedulingOptions): TimeSlot[] {
		// Validate inputs
		validateTimeRange(startTime, endTime)
		validateOptions(options)

		const { slotDuration, padding = 0, slotSplit = slotDuration, offset = 0, maxOverlaps } = options

		// Apply padding and merge busy times
		const paddedBusyTimes = applyPadding(this.busyTimes, padding)
		const mergedBusyTimes = mergeBusyTimes(paddedBusyTimes)

		// Use K-overlaps algorithm if maxOverlaps is specified
		if (maxOverlaps !== undefined) {
			// Find free time periods with K-overlaps algorithm
			const freeSlots = findAvailableSlotsWithOverlaps(startTime, endTime, mergedBusyTimes, maxOverlaps)

			// Apply slot generation constraints to free periods
			return this.applySlotConstraintsToFreeTime(freeSlots, {
				slotDuration,
				slotSplit,
				offset,
			})
		}

		// Traditional approach for backward compatibility
		// Generate potential slots
		const slots = generateSlots(startTime, endTime, {
			slotDurationMinutes: slotDuration,
			slotSplitMinutes: slotSplit,
			offsetMinutes: offset,
		})

		// Filter available slots
		return filterAvailableSlots(slots, mergedBusyTimes)
	}

	/**
	 * Adds a single busy time to the scheduler.
	 * The busy time will be automatically sorted with existing busy times.
	 *
	 * @param busyTime - The busy time period to add
	 *
	 * @example
	 * ```typescript
	 * // Add a 1-hour meeting
	 * scheduler.addBusyTime({
	 *   start: new Date('2024-01-15T14:00:00Z'),
	 *   end: new Date('2024-01-15T15:00:00Z')
	 * })
	 *
	 * // Add a multi-hour block
	 * scheduler.addBusyTime({
	 *   start: new Date('2024-01-15T09:00:00Z'),
	 *   end: new Date('2024-01-15T12:00:00Z')
	 * })
	 * ```
	 */
	addBusyTime(busyTime: BusyTime): void {
		this.busyTimes.push(busyTime)
		this.busyTimes.sort((a, b) => a.start.getTime() - b.start.getTime())
	}

	/**
	 * Adds multiple busy times to the scheduler at once.
	 * More efficient than calling addBusyTime multiple times.
	 * All busy times will be automatically sorted together.
	 *
	 * @param busyTimes - Array of busy time periods to add
	 *
	 * @example
	 * ```typescript
	 * // Add multiple appointments
	 * scheduler.addBusyTimes([
	 *   { start: new Date('2024-01-15T10:00:00Z'), end: new Date('2024-01-15T11:00:00Z') },
	 *   { start: new Date('2024-01-15T14:00:00Z'), end: new Date('2024-01-15T15:30:00Z') },
	 *   { start: new Date('2024-01-16T09:00:00Z'), end: new Date('2024-01-16T10:30:00Z') }
	 * ])
	 *
	 * // Import busy times from external calendar
	 * const externalEvents = getCalendarEvents() // Returns BusyTime[]
	 * scheduler.addBusyTimes(externalEvents)
	 * ```
	 */
	addBusyTimes(busyTimes: BusyTime[]): void {
		this.busyTimes.push(...busyTimes)
		this.busyTimes.sort((a, b) => a.start.getTime() - b.start.getTime())
	}

	/**
	 * Removes all busy times from the scheduler.
	 * After calling this method, the scheduler will have no busy time restrictions.
	 *
	 * @example
	 * ```typescript
	 * // Add some busy times
	 * scheduler.addBusyTime(meeting1)
	 * scheduler.addBusyTime(meeting2)
	 *
	 * console.log(scheduler.getBusyTimes().length) // 2
	 *
	 * // Clear all busy times
	 * scheduler.clearBusyTimes()
	 *
	 * console.log(scheduler.getBusyTimes().length) // 0
	 *
	 * // Now all time slots will be available (subject to time range)
	 * const slots = scheduler.findAvailableSlots(start, end, options)
	 * ```
	 */
	clearBusyTimes(): void {
		this.busyTimes.length = 0
	}

	/**
	 * Returns a copy of all busy times currently in the scheduler.
	 * The returned array is a copy, so modifying it won't affect the scheduler's internal state.
	 *
	 * @returns Array of all busy times, sorted by start time
	 *
	 * @example
	 * ```typescript
	 * // Get current busy times
	 * const busyTimes = scheduler.getBusyTimes()
	 * console.log(`Scheduler has ${busyTimes.length} busy periods`)
	 *
	 * // Safe to modify - won't affect scheduler
	 * busyTimes.push(newBusyTime) // This won't change the scheduler
	 *
	 * // Check for conflicts with a specific time
	 * const conflictingTimes = busyTimes.filter(busyTime =>
	 *   busyTime.start < proposedEnd && busyTime.end > proposedStart
	 * )
	 *
	 * // Export busy times
	 * const exported = {
	 *   userId: 'user123',
	 *   busyTimes: scheduler.getBusyTimes()
	 * }
	 * ```
	 */
	getBusyTimes(): BusyTime[] {
		return this.busyTimes.slice()
	}

	/**
	 * Applies slot duration, split, and offset constraints to free time periods
	 * @private
	 */
	private applySlotConstraintsToFreeTime(
		freeSlots: TimeSlot[],
		options: { slotDuration: number; slotSplit: number; offset: number }
	): TimeSlot[] {
		const { slotDuration, slotSplit, offset } = options
		const result: TimeSlot[] = []

		for (const freeSlot of freeSlots) {
			// Generate slots within this free time period
			const slots = generateSlots(freeSlot.start, freeSlot.end, {
				slotDurationMinutes: slotDuration,
				slotSplitMinutes: slotSplit,
				offsetMinutes: offset,
			})

			result.push(...slots)
		}

		// Sort by start time and return
		return result.sort((a, b) => a.start.getTime() - b.start.getTime())
	}
}
