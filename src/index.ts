// Export types
export type { TimeSlot, BusyTime, SchedulingOptions } from './types/scheduling.types.ts'
export type { WeeklyAvailability, DaySchedule, DayOfWeek } from './types/availability.types.ts'

// Export main classes
export { Scheduler } from './core/scheduler.ts'
export { AvailabilityScheduler } from './availability/scheduler.ts'

// Export helper functions - Date Math
export {
    addMinutes,
    subtractMinutes,
    minutesBetween,
    isSameDay,
    startOfDay,
    endOfDay,
} from './helpers/time/date-math.ts'

// Export helper functions - Busy Time Management
export { mergeBusyTimes, isOverlapping } from './helpers/busy-time/merge.ts'

export { hasOverlap, isSlotAvailable } from './helpers/busy-time/overlap.ts'

export { applyPadding } from './helpers/busy-time/padding.ts'

// Export helper functions - Slot Management
export { generateSlots, calculateFirstSlotStart, type SlotGenerationOptions } from './helpers/slot/generator.ts'

export { filterAvailableSlots } from './helpers/slot/filter.ts'

// Export helper functions - Time Alignment
export {
    calculateMinutesFromHour,
    alignToInterval,
    findNextSlotBoundary,
    getTimeWithinDay,
} from './helpers/time/alignment.ts'

// Export validators
export { validateTimeRange } from './validators/time-range.validator.ts'

export {
    validateOptions,
    validateDuration,
    validateSplit,
    validateOffset,
    validatePadding,
} from './validators/options.validator.ts'

export { validateWeeklyAvailability } from './validators/availability.validator.ts'

// Export availability helpers
export { weeklyAvailabilityToBusyTimes } from './helpers/availability/converter.ts'

// Export constants
export { MS_PER_MINUTE, MS_PER_HOUR, MS_PER_DAY, MINUTES_PER_HOUR, HOURS_PER_DAY } from './utils/constants.ts'

// Export convenience function
import type { BusyTime } from './types/scheduling.types.ts'
import { Scheduler } from './core/scheduler.ts'

export function createScheduler(busyTimes: BusyTime[] = []): Scheduler {
    return new Scheduler(busyTimes)
}
