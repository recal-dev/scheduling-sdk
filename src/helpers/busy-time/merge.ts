import type { BusyTime } from '../../types/scheduling.types.ts'

/**
 * Combines overlapping and adjacent busy times into one interval each.
 *
 * Returns fresh objects: extending an end time in place would edit the caller's own busy
 * times, and `applyPadding` hands this the stored array itself when padding is zero — so an
 * in-place merge would quietly rewrite the scheduler's state and every later read of it.
 */
export function mergeBusyTimes(busyTimes: BusyTime[]): BusyTime[] {
	if (busyTimes.length <= 1) {
		return busyTimes.slice()
	}

	const sorted = busyTimes.slice().sort((a, b) => a.start.getTime() - b.start.getTime())
	const merged: BusyTime[] = [{ ...sorted[0]! }]

	for (let i = 1; i < sorted.length; i++) {
		const current = sorted[i]!
		const lastMerged = merged[merged.length - 1]!

		if (current.start.getTime() > lastMerged.end.getTime()) {
			merged.push({ ...current })
		} else if (current.end.getTime() > lastMerged.end.getTime()) {
			lastMerged.end = current.end
		}
	}

	return merged
}

export function isOverlapping(time1: BusyTime, time2: BusyTime): boolean {
	return time1.start.getTime() < time2.end.getTime() && time2.start.getTime() < time1.end.getTime()
}
