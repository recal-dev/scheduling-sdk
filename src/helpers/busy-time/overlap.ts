import type { TimeSlot, BusyTime } from '../../types/scheduling.types.ts'

export function hasOverlap(slot: TimeSlot, busyTime: BusyTime): boolean {
    // Zero-duration busy times (start === end) should not overlap with slots
    if (busyTime.start.getTime() === busyTime.end.getTime()) {
        return false
    }
    
    return slot.start.getTime() < busyTime.end.getTime() && busyTime.start.getTime() < slot.end.getTime()
}

export function isSlotAvailable(slot: TimeSlot, busyTimes: BusyTime[]): boolean {
    const slotStart = slot.start.getTime()
    const slotEnd = slot.end.getTime()

    for (let i = 0; i < busyTimes.length; i++) {
        const busyTime = busyTimes[i]!

        // Early exit optimization: if busy time starts after slot ends
        if (busyTime.start.getTime() >= slotEnd) {
            break
        }

        // Check for overlap (skip zero-duration busy times)
        if (busyTime.start.getTime() !== busyTime.end.getTime() && 
            slotStart < busyTime.end.getTime() && busyTime.start.getTime() < slotEnd) {
            return false
        }
    }

    return true
}
