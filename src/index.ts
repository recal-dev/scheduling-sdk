// Export types

export { AvailabilityScheduler } from './availability/scheduler'
// Export main classes
export { Scheduler } from './core/scheduler'
// Export availability helpers
export { weeklyAvailabilityToBusyTimes } from './helpers/availability/converter'
// Export helper functions - Busy Time Management
export { isOverlapping, mergeBusyTimes } from './helpers/busy-time/merge'
export { hasOverlap, isSlotAvailable } from './helpers/busy-time/overlap'
export { applyPadding } from './helpers/busy-time/padding'
export { filterAvailableSlots } from './helpers/slot/filter'
// Export helper functions - Slot Management
export { calculateFirstSlotStart, generateSlots, type SlotGenerationOptions } from './helpers/slot/generator'
// Export helper functions - Time Alignment
export {
	alignToInterval,
	calculateMinutesFromHour,
	findNextSlotBoundary,
	getTimeWithinDay,
} from './helpers/time/alignment'
// Export helper functions - Date Math
export { addMinutes, endOfDay, isSameDay, minutesBetween, startOfDay, subtractMinutes } from './helpers/time/date-math'
export type { DayOfWeek, DaySchedule, WeeklyAvailability } from './types/availability.types'
export { weekendDays, workDays } from './types/availability.types'
export type { BusyTime, SchedulingOptions, TimeSlot } from './types/scheduling.types'
// Export constants
export { HOURS_PER_DAY, MINUTES_PER_HOUR, MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE } from './utils/constants'

export { validateWeeklyAvailability } from './validators/availability.validator'
export {
	validateDuration,
	validateOffset,
	validateOptions,
	validatePadding,
	validateSplit,
} from './validators/options.validator'
// Export validators
export { validateTimeRange } from './validators/time-range.validator'

import { AvailabilityScheduler } from './availability/scheduler'
// Export convenience function
import { Scheduler } from './core/scheduler'
import type { WeeklyAvailability } from './types/availability.types'
import type { BusyTime } from './types/scheduling.types'

export function createScheduler(busyTimes: BusyTime[] = []): Scheduler {
	return new Scheduler(busyTimes)
}

export function createAvailabilityScheduler(availability: WeeklyAvailability, timezone: string): AvailabilityScheduler {
	return new AvailabilityScheduler(availability, timezone)
}
