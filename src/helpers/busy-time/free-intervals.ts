import type { BusyTime, TimeSlot } from '../../types/scheduling.types'

export type Interval = { start: number; end: number }

type Event = { t: number; d: 1 | -1 }

/**
 * Returns maximal free intervals where concurrent busy count ≤ K.
 * @param busy List of busy intervals [start, end)
 * @param K    Allowed overlaps (collisions). Time is busy iff active >= K+1
 * @param bounds Optional bounding window [start, end) to clip results (default: inferred from data)
 */
export function findFreeIntervals(
	busy: Interval[],
	K: number,
	bounds?: Interval
): Interval[] {
	// Validate inputs
	if (K < 0) {
		throw new Error('K must be non-negative')
	}

	// Filter valid intervals
	const validBusy = busy.filter(interval => {
		if (!isFinite(interval.start) || !isFinite(interval.end)) return false
		if (interval.start >= interval.end) return false
		return true
	})

	// Handle empty busy case
	if (validBusy.length === 0) {
		return bounds ? [bounds] : []
	}

	// Create events: start = +1, end = -1
	const events: Event[] = []
	for (const interval of validBusy) {
		events.push({ t: interval.start, d: 1 })
		events.push({ t: interval.end, d: -1 })
	}

	// Sort events: time ASC, then delta ASC (ends before starts at same time)
	events.sort((a, b) => a.t === b.t ? a.d - b.d : a.t - b.t)

	// Sweep line algorithm
	const freeIntervals: Interval[] = []
	let active = 0
	
	// Determine effective bounds
	const effectiveBounds = bounds || {
		start: Math.min(...validBusy.map(b => b.start)),
		end: Math.max(...validBusy.map(b => b.end))
	}

	let prev = effectiveBounds.start

	for (let i = 0; i < events.length; i++) {
		const event = events[i]!
		const t = event.t

		// Emit free interval if we have a gap and overlap count allows it
		if (active <= K && prev < t) {
			freeIntervals.push({ start: prev, end: t })
		}

		// Process all events at this timestamp
		while (i < events.length && events[i]!.t === t) {
			active += events[i]!.d
			i++
		}
		i-- // Adjust for outer loop increment

		prev = t
	}

	// Handle final region after last event
	if (active <= K && prev < effectiveBounds.end) {
		freeIntervals.push({ start: prev, end: effectiveBounds.end })
	}

	// Merge adjacent intervals
	const merged = mergeIntervals(freeIntervals)

	// Apply bounds if provided
	if (bounds) {
		return clipIntervals(merged, bounds)
	}

	return merged
}

function mergeIntervals(intervals: Interval[]): Interval[] {
	if (intervals.length === 0) return []

	const sorted = intervals.slice().sort((a, b) => a.start - b.start)
	const merged: Interval[] = [sorted[0]!]

	for (let i = 1; i < sorted.length; i++) {
		const current = sorted[i]!
		const last = merged[merged.length - 1]!

		// Merge if touching or overlapping
		if (current.start <= last.end) {
			last.end = Math.max(last.end, current.end)
		} else {
			merged.push(current)
		}
	}

	return merged
}

function clipIntervals(intervals: Interval[], bounds: Interval): Interval[] {
	const clipped: Interval[] = []

	for (const interval of intervals) {
		// Find intersection with bounds
		const start = Math.max(interval.start, bounds.start)
		const end = Math.min(interval.end, bounds.end)

		// Only include if there's actual intersection
		if (start < end) {
			clipped.push({ start, end })
		}
	}

	return clipped
}

/**
 * Converts BusyTime array to number-based intervals for sweep-line algorithm
 */
export function busyTimesToIntervals(busyTimes: BusyTime[]): Interval[] {
	return busyTimes.map(bt => ({
		start: bt.start.getTime(),
		end: bt.end.getTime()
	}))
}

/**
 * Converts number-based intervals back to TimeSlot array
 */
export function intervalsToTimeSlots(intervals: Interval[]): TimeSlot[] {
	return intervals.map(interval => ({
		start: new Date(interval.start),
		end: new Date(interval.end)
	}))
}

/**
 * Finds available slots using K-overlaps algorithm instead of traditional filtering
 */
export function findAvailableSlotsWithOverlaps(
	startTime: Date,
	endTime: Date,
	busyTimes: BusyTime[],
	maxOverlaps: number
): TimeSlot[] {
	const bounds: Interval = {
		start: startTime.getTime(),
		end: endTime.getTime()
	}

	const busyIntervals = busyTimesToIntervals(busyTimes)
	const freeIntervals = findFreeIntervals(busyIntervals, maxOverlaps, bounds)
	
	return intervalsToTimeSlots(freeIntervals)
}