import type { TimeSlot } from '../../types/scheduling.types'
import { MS_PER_MINUTE } from '../../utils/constants'
import { findNextSlotBoundary } from '../time/alignment'

export interface SlotGenerationOptions {
	slotDurationMinutes: number
	slotSplitMinutes?: number
	offsetMinutes?: number
	timezone?: string
	earliestTime?: string | number
	latestTime?: string | number
}

function parseTimeInput(timeInput: string | number): number {
	if (typeof timeInput === 'number') {
		return timeInput
	}

	const [hoursStr, minutesStr] = timeInput.split(':')
	const hours = parseInt(hoursStr!, 10)
	const minutes = parseInt(minutesStr!, 10)

	// Accept special case 24:00 to represent end of day (1440 minutes)
	if (hours === 24 && minutes === 0) {
		return 24 * 60
	}

	if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
		throw new Error(`Invalid time format: ${timeInput}. Expected HH:mm format (e.g., "09:00") or minutes as number`)
	}

	return hours * 60 + minutes
}

/**
 * The slot's time of day, in minutes past local midnight in `timezone`.
 *
 * Read from the instant itself rather than reconstructed from a calendar date: the previous
 * approach took the slot's **UTC** date and built the window for that date in the target zone,
 * so any local day that straddles UTC midnight was tested against the neighbouring day's
 * window. A 21:00 slot in New York was measured against the next day's window and dropped.
 */
function localMinutesOfDay(date: Date, timezone: string): number {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: timezone,
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	}).formatToParts(date)
	const read = (type: string): number => Number(parts.find(part => part.type === type)?.value ?? '0')
	// Some ICU builds render midnight as hour 24 under hour12: false.
	return (read('hour') % 24) * 60 + read('minute')
}

function isSlotWithinDailyTimeRange(
	slot: TimeSlot,
	earliestMinutes: number,
	latestMinutes: number,
	timezone: string
): boolean {
	const minutes = localMinutesOfDay(slot.start, timezone)
	return minutes >= earliestMinutes && minutes < latestMinutes
}

export function generateSlots(startTime: Date, endTime: Date, options: SlotGenerationOptions): TimeSlot[] {
	const {
		slotDurationMinutes,
		slotSplitMinutes = slotDurationMinutes,
		offsetMinutes = 0,
		timezone,
		earliestTime,
		latestTime,
	} = options

	const slots: TimeSlot[] = []
	const slotDurationMs = slotDurationMinutes * MS_PER_MINUTE
	const slotSplitMs = slotSplitMinutes * MS_PER_MINUTE
	const endTimeMs = endTime.getTime()

	// Find first slot start time with proper alignment
	let currentStart: Date
	if (offsetMinutes === 0) {
		// When no offset is specified, start exactly at the provided start time
		currentStart = new Date(startTime)
	} else {
		// When offset is specified, align to slot boundaries
		currentStart = calculateFirstSlotStart(startTime, slotSplitMinutes, offsetMinutes)
	}
	let currentStartMs = currentStart.getTime()

	// Generate slots until we exceed the end time
	while (currentStartMs + slotDurationMs <= endTimeMs) {
		slots.push({
			start: new Date(currentStartMs),
			end: new Date(currentStartMs + slotDurationMs),
		})

		currentStartMs += slotSplitMs
	}

	// Filter slots by daily time range if specified
	if (timezone && (earliestTime !== undefined || latestTime !== undefined)) {
		const earliestMinutes = earliestTime !== undefined ? parseTimeInput(earliestTime) : 0
		const latestMinutes = latestTime !== undefined ? parseTimeInput(latestTime) : 24 * 60

		return slots.filter(slot => isSlotWithinDailyTimeRange(slot, earliestMinutes, latestMinutes, timezone))
	}

	return slots
}

export function calculateFirstSlotStart(startTime: Date, slotSplitMinutes: number, offsetMinutes: number): Date {
	if (offsetMinutes === 0) {
		// For zero offset, align to next slot boundary based on slotSplitMinutes
		return findNextSlotBoundary(startTime, slotSplitMinutes, 0)
	}

	// Calculate the first slot boundary with offset
	const alignedTime = findNextSlotBoundary(startTime, slotSplitMinutes, offsetMinutes)

	// If the aligned time is before our start time, move to next boundary
	if (alignedTime.getTime() < startTime.getTime()) {
		return new Date(alignedTime.getTime() + slotSplitMinutes * MS_PER_MINUTE)
	}

	return alignedTime
}
