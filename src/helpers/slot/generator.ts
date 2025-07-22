import type { TimeSlot } from '../../types/scheduling.types'
import { MS_PER_MINUTE } from '../../utils/constants'
import { findNextSlotBoundary } from '../time/alignment'

export interface SlotGenerationOptions {
	slotDurationMinutes: number
	slotSplitMinutes?: number
	offsetMinutes?: number
}

export function generateSlots(startTime: Date, endTime: Date, options: SlotGenerationOptions): TimeSlot[] {
	const { slotDurationMinutes, slotSplitMinutes = slotDurationMinutes, offsetMinutes = 0 } = options

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
