import type { TimeSlot, BusyTime, SchedulingOptions } from '../types/scheduling.types.ts'
import { validateTimeRange } from '../validators/time-range.validator.ts'
import { validateOptions } from '../validators/options.validator.ts'
import { applyPadding } from '../helpers/busy-time/padding.ts'
import { mergeBusyTimes } from '../helpers/busy-time/merge.ts'
import { generateSlots } from '../helpers/slot/generator.ts'
import { filterAvailableSlots } from '../helpers/slot/filter.ts'

export class Scheduler {
    private busyTimes: BusyTime[]

    constructor(busyTimes: BusyTime[] = []) {
        this.busyTimes = busyTimes.slice().sort((a, b) => a.start.getTime() - b.start.getTime())
    }

    findAvailableSlots(startTime: Date, endTime: Date, options: SchedulingOptions): TimeSlot[] {
        // Validate inputs
        validateTimeRange(startTime, endTime)
        validateOptions(options)

        const { slotDuration, padding = 0, slotSplit = slotDuration, offset = 0 } = options

        // Apply padding and merge busy times
        const paddedBusyTimes = applyPadding(this.busyTimes, padding)
        const mergedBusyTimes = mergeBusyTimes(paddedBusyTimes)

        // Generate potential slots
        const slots = generateSlots(startTime, endTime, {
            slotDurationMinutes: slotDuration,
            slotSplitMinutes: slotSplit,
            offsetMinutes: offset
        })

        // Filter available slots
        return filterAvailableSlots(slots, mergedBusyTimes)
    }

    addBusyTime(busyTime: BusyTime): void {
        this.busyTimes.push(busyTime)
        this.busyTimes.sort((a, b) => a.start.getTime() - b.start.getTime())
    }

    addBusyTimes(busyTimes: BusyTime[]): void {
        this.busyTimes.push(...busyTimes)
        this.busyTimes.sort((a, b) => a.start.getTime() - b.start.getTime())
    }

    clearBusyTimes(): void {
        this.busyTimes.length = 0
    }

    getBusyTimes(): BusyTime[] {
        return this.busyTimes.slice()
    }
}
