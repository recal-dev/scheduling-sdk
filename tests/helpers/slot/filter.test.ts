import { describe, expect, test } from 'bun:test'
import { filterAvailableSlots } from '../../../src/helpers/slot/filter.ts'
import type { BusyTime, TimeSlot } from '../../../src/types/scheduling.types.ts'

describe('Slot Filter Helper', () => {
	const testSlots: TimeSlot[] = [
		{
			start: new Date('2024-01-15T09:00:00Z'),
			end: new Date('2024-01-15T09:30:00Z'),
		},
		{
			start: new Date('2024-01-15T09:30:00Z'),
			end: new Date('2024-01-15T10:00:00Z'),
		},
		{
			start: new Date('2024-01-15T10:00:00Z'),
			end: new Date('2024-01-15T10:30:00Z'),
		},
		{
			start: new Date('2024-01-15T10:30:00Z'),
			end: new Date('2024-01-15T11:00:00Z'),
		},
		{
			start: new Date('2024-01-15T11:00:00Z'),
			end: new Date('2024-01-15T11:30:00Z'),
		},
	]

	const testBusyTimes: BusyTime[] = [
		{
			start: new Date('2024-01-15T09:15:00Z'),
			end: new Date('2024-01-15T09:45:00Z'),
		},
		{
			start: new Date('2024-01-15T10:45:00Z'),
			end: new Date('2024-01-15T11:15:00Z'),
		},
	]

	describe('filterAvailableSlots', () => {
		test('should return all slots when no busy times exist', () => {
			const result = filterAvailableSlots(testSlots, [])
			expect(result).toHaveLength(testSlots.length)
			expect(result).toEqual(testSlots)
		})

		test('should filter out overlapping slots', () => {
			const result = filterAvailableSlots(testSlots, testBusyTimes)

			// Should exclude slots that overlap with busy times
			// Busy times: 09:15-09:45, 10:45-11:15
			// Available slots should be: 10:00-10:30 (only non-overlapping slot)
			expect(result).toHaveLength(1)

			// Only available slot should be 10:00-10:30 (doesn't overlap)
			expect(result[0]!.start.getTime()).toBe(new Date('2024-01-15T10:00:00Z').getTime())
			expect(result[0]!.end.getTime()).toBe(new Date('2024-01-15T10:30:00Z').getTime())
		})

		test('should return empty array when all slots overlap', () => {
			const allOverlappingBusyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T08:00:00Z'),
					end: new Date('2024-01-15T12:00:00Z'),
				},
			]

			const result = filterAvailableSlots(testSlots, allOverlappingBusyTimes)
			expect(result).toHaveLength(0)
		})

		test('should handle empty slots array', () => {
			const result = filterAvailableSlots([], testBusyTimes)
			expect(result).toHaveLength(0)
		})

		test('should handle slots adjacent to busy times', () => {
			const adjacentBusyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T09:30:00Z'),
					end: new Date('2024-01-15T10:00:00Z'),
				},
			]

			const result = filterAvailableSlots(testSlots, adjacentBusyTimes)

			// Adjacent slots should be available (no overlap)
			expect(result).toHaveLength(4)

			// First slot (09:00-09:30) should be available
			expect(result[0]!.start.getTime()).toBe(new Date('2024-01-15T09:00:00Z').getTime())

			// Third slot (10:00-10:30) should be available
			expect(result[1]!.start.getTime()).toBe(new Date('2024-01-15T10:00:00Z').getTime())
		})

		test('should handle partial overlaps correctly', () => {
			const partialOverlapBusyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T09:15:00Z'),
					end: new Date('2024-01-15T09:45:00Z'),
				},
			]

			const result = filterAvailableSlots(testSlots, partialOverlapBusyTimes)

			// Both 09:00-09:30 and 09:30-10:00 should be filtered out due to overlap
			expect(result).toHaveLength(3)
			expect(result[0]!.start.getTime()).toBe(new Date('2024-01-15T10:00:00Z').getTime())
		})

		test('should handle multiple busy times', () => {
			const multipleBusyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T09:10:00Z'),
					end: new Date('2024-01-15T09:20:00Z'),
				},
				{
					start: new Date('2024-01-15T09:40:00Z'),
					end: new Date('2024-01-15T09:50:00Z'),
				},
				{
					start: new Date('2024-01-15T10:10:00Z'),
					end: new Date('2024-01-15T10:20:00Z'),
				},
			]

			const result = filterAvailableSlots(testSlots, multipleBusyTimes)

			// Slots 09:00-09:30, 09:30-10:00, and 10:00-10:30 should be filtered out
			expect(result).toHaveLength(2)
			expect(result[0]!.start.getTime()).toBe(new Date('2024-01-15T10:30:00Z').getTime())
			expect(result[1]!.start.getTime()).toBe(new Date('2024-01-15T11:00:00Z').getTime())
		})

		test('should handle slot completely containing busy time', () => {
			const containedBusyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T09:05:00Z'),
					end: new Date('2024-01-15T09:25:00Z'),
				},
			]

			const result = filterAvailableSlots(testSlots, containedBusyTimes)

			// First slot (09:00-09:30) should be filtered out
			expect(result).toHaveLength(4)
			expect(result[0]!.start.getTime()).toBe(new Date('2024-01-15T09:30:00Z').getTime())
		})

		test('should handle busy time completely containing slot', () => {
			const containerBusyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T08:30:00Z'),
					end: new Date('2024-01-15T10:30:00Z'),
				},
			]

			const result = filterAvailableSlots(testSlots, containerBusyTimes)

			// First three slots should be filtered out
			expect(result).toHaveLength(2)
			expect(result[0]!.start.getTime()).toBe(new Date('2024-01-15T10:30:00Z').getTime())
			expect(result[1]!.start.getTime()).toBe(new Date('2024-01-15T11:00:00Z').getTime())
		})

		test('should handle millisecond precision conflicts', () => {
			const preciseBusyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T09:29:59.999Z'),
					end: new Date('2024-01-15T09:30:00.001Z'),
				},
			]

			const result = filterAvailableSlots(testSlots, preciseBusyTimes)

			// Both first and second slots should be filtered out due to millisecond overlap
			// First slot (09:00-09:30) overlaps at the end (09:29:59.999-09:30:00)
			// Second slot (09:30-10:00) overlaps at the start (09:30:00-09:30:00.001)
			expect(result).toHaveLength(3)
			expect(result[0]!.start.getTime()).toBe(new Date('2024-01-15T10:00:00Z').getTime())
			expect(result[1]!.start.getTime()).toBe(new Date('2024-01-15T10:30:00Z').getTime())
			expect(result[2]!.start.getTime()).toBe(new Date('2024-01-15T11:00:00Z').getTime())
		})

		test('should maintain original slot order', () => {
			const singleBusyTime: BusyTime[] = [
				{
					start: new Date('2024-01-15T09:45:00Z'),
					end: new Date('2024-01-15T10:15:00Z'),
				},
			]

			const result = filterAvailableSlots(testSlots, singleBusyTime)

			// Available slots should maintain chronological order (adjacent slots are allowed)
			for (let i = 1; i < result.length; i++) {
				expect(result[i]!.start.getTime()).toBeGreaterThanOrEqual(result[i - 1]!.end.getTime())
			}
		})

		test('should handle zero-duration slots', () => {
			const zeroDurationSlots: TimeSlot[] = [
				{
					start: new Date('2024-01-15T09:15:00Z'),
					end: new Date('2024-01-15T09:15:00Z'),
				},
			]

			const result = filterAvailableSlots(zeroDurationSlots, testBusyTimes)

			// Zero-duration slot should be available (no overlap with busy times)
			expect(result).toHaveLength(1)
		})

		test('should handle zero-duration busy times', () => {
			const zeroDurationBusyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T09:15:00Z'),
					end: new Date('2024-01-15T09:15:00Z'),
				},
			]

			const result = filterAvailableSlots(testSlots, zeroDurationBusyTimes)

			// All slots should remain available (no overlap with zero-duration busy time)
			expect(result).toHaveLength(testSlots.length)
		})
	})

	// Performance tests
	describe('Performance', () => {
		test('should handle large number of slots efficiently', () => {
			const manySlots: TimeSlot[] = []
			for (let i = 0; i < 1000; i++) {
				const startTime = new Date(
					`2024-01-15T${Math.floor(i / 60)
						.toString()
						.padStart(2, '0')}:${(i % 60).toString().padStart(2, '0')}:00Z`
				)
				const endTime = new Date(startTime.getTime() + 30 * 60 * 1000)
				manySlots.push({ start: startTime, end: endTime })
			}

			const startTime = performance.now()
			const result = filterAvailableSlots(manySlots, testBusyTimes)
			const endTime = performance.now()

			expect(result.length).toBeGreaterThan(0)
			expect(endTime - startTime).toBeLessThan(20) // Should complete in < 20ms
		})

		test('should handle large number of busy times efficiently', () => {
			const manyBusyTimes: BusyTime[] = []
			for (let i = 0; i < 1000; i++) {
				const startTime = new Date(
					`2024-01-16T${Math.floor(i / 60)
						.toString()
						.padStart(2, '0')}:${(i % 60).toString().padStart(2, '0')}:00Z`
				)
				const endTime = new Date(startTime.getTime() + 15 * 60 * 1000)
				manyBusyTimes.push({ start: startTime, end: endTime })
			}

			const startTime = performance.now()
			const result = filterAvailableSlots(testSlots, manyBusyTimes)
			const endTime = performance.now()

			// All test slots should remain available (different day)
			expect(result).toHaveLength(testSlots.length)
			expect(endTime - startTime).toBeLessThan(10) // Should complete in < 10ms
		})

		test('should not modify original arrays', () => {
			const originalSlots = [...testSlots]
			const originalBusyTimes = [...testBusyTimes]

			filterAvailableSlots(testSlots, testBusyTimes)

			expect(testSlots).toEqual(originalSlots)
			expect(testBusyTimes).toEqual(originalBusyTimes)
		})
	})
})
