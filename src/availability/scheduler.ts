import type { WeeklyAvailability } from '../types/availability.types'
import type { BusyTime, TimeSlot, SchedulingOptions } from '../types/scheduling.types'
import { Scheduler } from '../core/scheduler'
import { weeklyAvailabilityToBusyTimes } from '../helpers/availability/converter'
import { validateWeeklyAvailability } from '../validators/availability.validator'
import { startOfDay } from '../helpers/time/date-math'

/**
 * Enhanced scheduler that combines weekly availability patterns with traditional busy time management.
 * Allows you to define recurring weekly schedules while still supporting one-off busy times.
 *
 * @example
 * ```typescript
 * // Create scheduler with business hours
 * const availability = {
 *   schedules: [
 *     { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '09:00', end: '17:00' }
 *   ]
 * }
 * const scheduler = new AvailabilityScheduler(availability)
 *
 * // Add a one-off meeting
 * scheduler.addBusyTime({
 *   start: new Date('2024-01-15T14:00:00Z'),
 *   end: new Date('2024-01-15T15:30:00Z')
 * })
 *
 * // Find available slots
 * const slots = scheduler.findAvailableSlots(startDate, endDate, options)
 * ```
 */
export class AvailabilityScheduler {
    private scheduler: Scheduler
    private availability?: WeeklyAvailability

    /**
     * Creates a new AvailabilityScheduler with optional weekly availability pattern and existing busy times.
     *
     * @param availability - Optional weekly availability pattern defining when slots are available
     * @param existingBusyTimes - Optional array of existing busy times to include
     *
     * @throws {Error} If the availability pattern is invalid
     *
     * @example
     * ```typescript
     * // Create with availability only
     * const scheduler = new AvailabilityScheduler({
     *   schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }]
     * })
     *
     * // Create with availability and existing busy times
     * const busyTimes = [{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') }]
     * const scheduler = new AvailabilityScheduler(availability, busyTimes)
     *
     * // Create empty scheduler (behaves like standard Scheduler)
     * const scheduler = new AvailabilityScheduler()
     * ```
     */
    constructor(availability?: WeeklyAvailability, existingBusyTimes: BusyTime[] = []) {
        validateWeeklyAvailability(availability)
        this.availability = availability
        this.scheduler = new Scheduler(existingBusyTimes)
    }

    /**
     * Sets or updates the weekly availability pattern.
     * This completely replaces any existing availability pattern.
     *
     * @param availability - The new weekly availability pattern
     *
     * @throws {Error} If the availability pattern is invalid
     *
     * @example
     * ```typescript
     * // Set initial availability
     * scheduler.setAvailability({
     *   schedules: [
     *     { days: ['monday', 'tuesday'], start: '09:00', end: '17:00' }
     *   ]
     * })
     *
     * // Update to different schedule
     * scheduler.setAvailability({
     *   schedules: [
     *     { days: ['monday', 'tuesday', 'wednesday'], start: '08:00', end: '16:00' }
     *   ],
     *   timezone: 'America/New_York'
     * })
     * ```
     */
    setAvailability(availability: WeeklyAvailability): void {
        validateWeeklyAvailability(availability)
        this.availability = availability
    }

    /**
     * Returns the current weekly availability pattern.
     *
     * @returns The current availability pattern, or undefined if none is set
     *
     * @example
     * ```typescript
     * const currentAvailability = scheduler.getAvailability()
     * if (currentAvailability) {
     *   console.log(`Found ${currentAvailability.schedules.length} schedules`)
     *   if (currentAvailability.timezone) {
     *     console.log(`Timezone: ${currentAvailability.timezone}`)
     *   }
     * } else {
     *   console.log('No availability pattern set')
     * }
     * ```
     */
    getAvailability(): WeeklyAvailability | undefined {
        return this.availability
    }

    /**
     * Adds a single busy time that will be combined with availability-based restrictions.
     * Use this for one-off appointments, meetings, or exceptions to the regular schedule.
     *
     * @param busyTime - The busy time to add
     *
     * @example
     * ```typescript
     * // Block out a specific appointment
     * scheduler.addBusyTime({
     *   start: new Date('2024-01-15T14:00:00Z'),
     *   end: new Date('2024-01-15T15:30:00Z')
     * })
     *
     * // Block out a vacation day
     * scheduler.addBusyTime({
     *   start: new Date('2024-01-20T00:00:00Z'),
     *   end: new Date('2024-01-21T00:00:00Z')
     * })
     * ```
     */
    addBusyTime(busyTime: BusyTime): void {
        this.scheduler.addBusyTimes([busyTime])
    }

    /**
     * Adds multiple busy times at once that will be combined with availability-based restrictions.
     * More efficient than calling addBusyTime multiple times.
     *
     * @param busyTimes - Array of busy times to add
     *
     * @example
     * ```typescript
     * const appointments = [
     *   { start: new Date('2024-01-15T10:00:00Z'), end: new Date('2024-01-15T11:00:00Z') },
     *   { start: new Date('2024-01-15T15:00:00Z'), end: new Date('2024-01-15T16:00:00Z') },
     *   { start: new Date('2024-01-16T09:00:00Z'), end: new Date('2024-01-16T10:30:00Z') }
     * ]
     * scheduler.addBusyTimes(appointments)
     * ```
     */
    addBusyTimes(busyTimes: BusyTime[]): void {
        this.scheduler.addBusyTimes(busyTimes)
    }

    /**
     * Removes all manually added busy times.
     * Does NOT affect availability-based busy times from the weekly pattern.
     *
     * @example
     * ```typescript
     * // Add some appointments
     * scheduler.addBusyTime(appointment1)
     * scheduler.addBusyTime(appointment2)
     *
     * // Clear all manual busy times (availability pattern still applies)
     * scheduler.clearBusyTimes()
     *
     * // Now only availability-based restrictions remain
     * const slots = scheduler.findAvailableSlots(start, end, options)
     * ```
     */
    clearBusyTimes(): void {
        this.scheduler.clearBusyTimes()
    }

    /**
     * Returns all manually added busy times.
     * Does NOT include busy times generated from the availability pattern.
     *
     * @returns Array of manually added busy times
     *
     * @example
     * ```typescript
     * const manualBusyTimes = scheduler.getBusyTimes()
     * console.log(`${manualBusyTimes.length} manual appointments`)
     *
     * // This does not include busy times from availability pattern
     * // To see all effective busy times, use findAvailableSlots and check gaps
     * ```
     */
    getBusyTimes(): BusyTime[] {
        return this.scheduler.getBusyTimes()
    }

    /**
     * Finds available time slots within the specified range, considering both availability patterns and manually added busy times.
     *
     * If no availability pattern is set, behaves like the standard Scheduler.
     * If availability is set, only returns slots within available periods defined by the weekly pattern.
     *
     * @param startTime - Start of the search range
     * @param endTime - End of the search range
     * @param options - Slot generation options (duration, split, offset, padding)
     *
     * @returns Array of available time slots
     *
     * @throws {Error} If time range or options are invalid
     *
     * @example
     * ```typescript
     * // Find 1-hour slots with no overlap
     * const slots = scheduler.findAvailableSlots(
     *   new Date('2024-01-15T08:00:00Z'),
     *   new Date('2024-01-15T18:00:00Z'),
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
        if (!this.availability) {
            return this.scheduler.findAvailableSlots(startTime, endTime, options)
        }

        // Find the Monday of the week containing startTime
        const weekStart = this.getMonday(startTime)
        const availabilityBusyTimes = weeklyAvailabilityToBusyTimes(this.availability, weekStart)

        // Create a temporary scheduler with both availability and existing busy times
        const tempScheduler = new Scheduler([...this.scheduler.getBusyTimes(), ...availabilityBusyTimes])

        return tempScheduler.findAvailableSlots(startTime, endTime, options)
    }

    /**
     * Gets the Monday of the week containing the given date.
     * Used internally for week-based availability processing.
     *
     * @param date - Any date within the week
     * @returns The Monday (start of day) for that week
     *
     * @private
     */
    private getMonday(date: Date): Date {
        const day = date.getDay()
        const diff = day === 0 ? -6 : 1 - day // Sunday = 0, Monday = 1
        const monday = new Date(date)
        monday.setDate(date.getDate() + diff)
        return startOfDay(monday)
    }
}
