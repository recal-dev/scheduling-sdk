// Export types
export type { TimeSlot, BusyTime, SchedulingOptions } from './types/scheduling.types'
export type { WeeklyAvailability, DaySchedule, DayOfWeek } from './types/availability.types'
export { workDays, weekendDays } from './types/availability.types'

// Export main classes
export { Scheduler } from './core/scheduler'
export { AvailabilityScheduler } from './availability/scheduler'

// Export helper functions - Date Math
export { addMinutes, subtractMinutes, minutesBetween, isSameDay, startOfDay, endOfDay } from './helpers/time/date-math'

// Export helper functions - Busy Time Management
export { mergeBusyTimes, isOverlapping } from './helpers/busy-time/merge'

export { hasOverlap, isSlotAvailable } from './helpers/busy-time/overlap'

export { applyPadding } from './helpers/busy-time/padding'

// Export helper functions - Slot Management
export { generateSlots, calculateFirstSlotStart, type SlotGenerationOptions } from './helpers/slot/generator'

export { filterAvailableSlots } from './helpers/slot/filter'

// Export helper functions - Time Alignment
export {
    calculateMinutesFromHour,
    alignToInterval,
    findNextSlotBoundary,
    getTimeWithinDay,
} from './helpers/time/alignment'

// Export validators
export { validateTimeRange } from './validators/time-range.validator'

export {
    validateOptions,
    validateDuration,
    validateSplit,
    validateOffset,
    validatePadding,
} from './validators/options.validator'

export { validateWeeklyAvailability } from './validators/availability.validator'

// Export availability helpers
export { weeklyAvailabilityToBusyTimes } from './helpers/availability/converter'

// Export constants
export { MS_PER_MINUTE, MS_PER_HOUR, MS_PER_DAY, MINUTES_PER_HOUR, HOURS_PER_DAY } from './utils/constants'

// Export convenience function
import type { BusyTime } from './types/scheduling.types'
import { Scheduler } from './core/scheduler'

export function createScheduler(busyTimes: BusyTime[] = []): Scheduler {
    return new Scheduler(busyTimes)
}
