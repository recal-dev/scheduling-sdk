import { MS_PER_MINUTE, MINUTES_PER_HOUR } from '../../utils/constants'

export function calculateMinutesFromHour(date: Date): number {
    return date.getMinutes() + date.getSeconds() / 60 + date.getMilliseconds() / 60000
}

export function alignToInterval(date: Date, intervalMinutes: number, offsetMinutes: number = 0): Date {
    const msFromEpoch = date.getTime()
    const intervalMs = intervalMinutes * MS_PER_MINUTE
    const offsetMs = offsetMinutes * MS_PER_MINUTE

    // Calculate alignment
    const remainder = (msFromEpoch - offsetMs) % intervalMs

    if (remainder === 0) {
        return new Date(date)
    }

    // Align to next boundary
    return new Date(msFromEpoch + intervalMs - remainder)
}

export function findNextSlotBoundary(date: Date, intervalMinutes: number, offsetMinutes: number = 0): Date {
    // Use full timestamp-based alignment for cross-day boundary support
    const msFromEpoch = date.getTime()
    const intervalMs = intervalMinutes * MS_PER_MINUTE
    const offsetMs = offsetMinutes * MS_PER_MINUTE

    // Calculate remainder using proper positive modulo
    const remainder = (((msFromEpoch - offsetMs) % intervalMs) + intervalMs) % intervalMs

    if (remainder === 0) {
        return new Date(date)
    }

    // Align to next boundary
    const minutesToNextBoundary = (intervalMs - remainder) / MS_PER_MINUTE
    return new Date(date.getTime() + minutesToNextBoundary * MS_PER_MINUTE)
}

export function findStrictNextSlotBoundary(date: Date, intervalMinutes: number, offsetMinutes: number = 0): Date {
    // Always return the next boundary, even if already aligned
    const aligned = findNextSlotBoundary(date, intervalMinutes, offsetMinutes)

    if (aligned.getTime() === date.getTime()) {
        // If already aligned, move to next boundary
        return new Date(aligned.getTime() + intervalMinutes * MS_PER_MINUTE)
    }

    return aligned
}

export function getTimeWithinDay(date: Date): number {
    return date.getHours() * MINUTES_PER_HOUR + date.getMinutes()
}
