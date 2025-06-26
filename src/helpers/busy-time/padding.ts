import type { BusyTime } from '../../types/scheduling.types'
import { MS_PER_MINUTE } from '../../utils/constants'

export function applyPadding(busyTimes: BusyTime[], paddingMinutes: number): BusyTime[] {
    if (paddingMinutes === 0 || busyTimes.length === 0) {
        return busyTimes
    }

    const paddingMs = paddingMinutes * MS_PER_MINUTE
    const result = new Array(busyTimes.length)

    for (let i = 0; i < busyTimes.length; i++) {
        const busyTime = busyTimes[i]!
        result[i] = {
            start: new Date(busyTime.start.getTime() - paddingMs),
            end: new Date(busyTime.end.getTime() + paddingMs),
        }
    }

    return result
}
