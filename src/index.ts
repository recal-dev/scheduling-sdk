// Export types
export type { TimeSlot, BusyTime, SchedulingOptions } from './types/scheduling.types.ts'

// Export main class
export { Scheduler } from './core/scheduler.ts'

// Export convenience function
import type { BusyTime } from './types/scheduling.types.ts'
import { Scheduler } from './core/scheduler.ts'

export function createScheduler(busyTimes: BusyTime[] = []): Scheduler {
    return new Scheduler(busyTimes)
}
