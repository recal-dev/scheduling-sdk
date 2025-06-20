import type { TimeSlot, BusyTime } from '../../types/scheduling.types.ts'
import { isSlotAvailable } from '../busy-time/overlap.ts'

export function filterAvailableSlots(slots: TimeSlot[], busyTimes: BusyTime[]): TimeSlot[] {
    if (busyTimes.length === 0) {
        return slots
    }

    const availableSlots: TimeSlot[] = []

    for (let i = 0; i < slots.length; i++) {
        const slot = slots[i]!
        if (isSlotAvailable(slot, busyTimes)) {
            availableSlots.push(slot)
        }
    }

    return availableSlots
}
