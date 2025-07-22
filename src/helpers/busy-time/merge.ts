import type { BusyTime } from '../../types/scheduling.types.ts'

export function mergeBusyTimes(busyTimes: BusyTime[]): BusyTime[] {
	if (busyTimes.length <= 1) {
		return busyTimes.slice()
	}

	// Sort by start time for optimal merging
	const sorted = busyTimes.slice().sort((a, b) => a.start.getTime() - b.start.getTime())
	const merged: BusyTime[] = [sorted[0]!]

	for (let i = 1; i < sorted.length; i++) {
		const current = sorted[i]!
		const lastMerged = merged[merged.length - 1]!

		// Check if current overlaps or is adjacent to last merged
		if (current.start.getTime() <= lastMerged.end.getTime()) {
			// Merge by extending the end time if necessary
			if (current.end.getTime() > lastMerged.end.getTime()) {
				lastMerged.end = current.end
			}
		} else {
			// No overlap, add as new busy time
			merged.push(current)
		}
	}

	return merged
}

export function isOverlapping(time1: BusyTime, time2: BusyTime): boolean {
	return time1.start.getTime() < time2.end.getTime() && time2.start.getTime() < time1.end.getTime()
}
