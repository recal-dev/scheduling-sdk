import type { WeeklyAvailability, DayOfWeek } from '../../types/availability.types.ts'
import type { BusyTime } from '../../types/scheduling.types.ts'
import { startOfDay, endOfDay } from '../time/date-math.ts'

const DAY_MAP: Record<DayOfWeek, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
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
 * Converts a weekly availability pattern into busy times for a specific week.
 * 
 * This function inverts the availability concept: it takes available time periods
 * and generates busy times for all the unavailable periods. For example, if you're
 * available Monday 9-17, it creates busy times for Monday 0-9 and 17-24, plus
 * all day Tuesday through Sunday.
 * 
 * @param availability - The weekly availability pattern to convert
 * @param weekStart - The Monday date for the week to process (MUST be a Monday)
 * 
 * @returns Array of busy times representing unavailable periods for that week
 * 
 * @throws {Error} If weekStart is not a Monday (getDay() !== 1)
 * @throws {Error} If availability contains invalid time formats or ranges
 * 
 * @example
 * ```typescript
 * const availability = {
 *   schedules: [
 *     { days: ['monday', 'wednesday', 'friday'], start: '09:00', end: '17:00' },
 *     { days: ['tuesday', 'thursday'], start: '10:00', end: '16:00' }
 *   ]
 * }
 * 
 * const mondayDate = new Date('2024-01-01T00:00:00Z') // Must be Monday
 * const busyTimes = weeklyAvailabilityToBusyTimes(availability, mondayDate)
 * 
 * // Returns busy times for:
 * // - Monday: 00:00-09:00, 17:00-23:59
 * // - Tuesday: 00:00-10:00, 16:00-23:59  
 * // - Wednesday: 00:00-09:00, 17:00-23:59
 * // - Thursday: 00:00-10:00, 16:00-23:59
 * // - Friday: 00:00-09:00, 17:00-23:59
 * // - Saturday: 00:00-23:59 (all day)
 * // - Sunday: 00:00-23:59 (all day)
 * ```
 * 
 * @example
 * ```typescript
 * // Creating breaks with multiple schedules for the same day
 * const scheduleWithLunch = {
 *   schedules: [
 *     { days: ['monday'], start: '09:00', end: '12:00' },  // Morning
 *     { days: ['monday'], start: '13:00', end: '17:00' }   // Afternoon
 *   ]
 * }
 * 
 * const busyTimes = weeklyAvailabilityToBusyTimes(scheduleWithLunch, mondayDate)
 * // Creates automatic lunch break: Monday 12:00-13:00 becomes busy time
 * ```
 * 
 * @example
 * ```typescript
 * // Helper function to get Monday of any week
 * function getMondayOfWeek(date: Date): Date {
 *   const day = date.getDay()
 *   const diff = day === 0 ? -6 : 1 - day
 *   const monday = new Date(date)
 *   monday.setDate(date.getDate() + diff)
 *   return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate())
 * }
 * 
 * const anyDate = new Date('2024-01-15T14:30:00Z') // Tuesday
 * const mondayOfThatWeek = getMondayOfWeek(anyDate)
 * const busyTimes = weeklyAvailabilityToBusyTimes(availability, mondayOfThatWeek)
 * ```
 */
export function weeklyAvailabilityToBusyTimes(
    availability: WeeklyAvailability, 
    weekStart: Date
): BusyTime[] {
    if (weekStart.getDay() !== 1) {
        throw new Error('weekStart must be a Monday (getDay() === 1)')
    }

    const busyTimes: BusyTime[] = []
    
    // For each day of the week, build busy times
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDay = new Date(weekStart)
        currentDay.setDate(weekStart.getDate() + dayOffset)
        const dayOfWeek = currentDay.getDay()
        
        // Find all availability schedules for this day
        const daySchedules: Array<{ start: number; end: number }> = []
        
        for (const schedule of availability.schedules) {
            const startTime = parseTimeString(schedule.start)
            const endTime = parseTimeString(schedule.end)
            
            if (startTime.hours > endTime.hours || 
                (startTime.hours === endTime.hours && startTime.minutes >= endTime.minutes)) {
                throw new Error(`Invalid time range: ${schedule.start} to ${schedule.end}. Start must be before end.`)
            }
            
            for (const dayName of schedule.days) {
                if (DAY_MAP[dayName] === dayOfWeek) {
                    daySchedules.push({
                        start: startTime.hours * 60 + startTime.minutes,
                        end: endTime.hours * 60 + endTime.minutes
                    })
                }
            }
        }
        
        // Sort schedules by start time
        daySchedules.sort((a, b) => a.start - b.start)
        
        const dayStart = startOfDay(currentDay)
        const dayEnd = endOfDay(currentDay)
        
        if (daySchedules.length === 0) {
            // No availability, entire day is busy
            busyTimes.push({ start: dayStart, end: dayEnd })
            continue
        }
        
        // Add busy time from start of day to first available period
        if (daySchedules[0]!.start > 0) {
            const busyEnd = new Date(dayStart)
            busyEnd.setMinutes(daySchedules[0]!.start)
            busyTimes.push({ start: dayStart, end: busyEnd })
        }
        
        // Add busy times between available periods
        for (let i = 0; i < daySchedules.length - 1; i++) {
            const currentEnd = daySchedules[i]!.end
            const nextStart = daySchedules[i + 1]!.start
            
            if (currentEnd < nextStart) {
                const busyStart = new Date(dayStart)
                busyStart.setMinutes(currentEnd)
                const busyEnd = new Date(dayStart)
                busyEnd.setMinutes(nextStart)
                busyTimes.push({ start: busyStart, end: busyEnd })
            }
        }
        
        // Add busy time from last available period to end of day
        const lastSchedule = daySchedules[daySchedules.length - 1]!
        if (lastSchedule.end < 24 * 60) {
            const busyStart = new Date(dayStart)
            busyStart.setMinutes(lastSchedule.end)
            busyTimes.push({ start: busyStart, end: dayEnd })
        }
    }
    
    return busyTimes
}