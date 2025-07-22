import { describe, expect, test } from 'bun:test'
import { applyPadding } from '../../../src/helpers/busy-time/padding.ts'
import type { BusyTime } from '../../../src/types/scheduling.types.ts'

describe('Padding Helper', () => {
	const baseBusyTime: BusyTime = {
		start: new Date('2024-01-15T14:00:00.000Z'),
		end: new Date('2024-01-15T15:00:00.000Z'),
	}

	describe('applyPadding', () => {
		test('should apply padding to single busy time', () => {
			const result = applyPadding([baseBusyTime], 15)
			expect(result).toHaveLength(1)
			expect(result[0]!.start.getTime()).toBe(new Date('2024-01-15T13:45:00.000Z').getTime())
			expect(result[0]!.end.getTime()).toBe(new Date('2024-01-15T15:15:00.000Z').getTime())
		})

		test('should apply padding to multiple busy times', () => {
			const busyTimes: BusyTime[] = [
				baseBusyTime,
				{
					start: new Date('2024-01-15T16:00:00.000Z'),
					end: new Date('2024-01-15T17:00:00.000Z'),
				},
			]

			const result = applyPadding(busyTimes, 10)
			expect(result).toHaveLength(2)

			expect(result[0]!.start.getTime()).toBe(new Date('2024-01-15T13:50:00.000Z').getTime())
			expect(result[0]!.end.getTime()).toBe(new Date('2024-01-15T15:10:00.000Z').getTime())

			expect(result[1]!.start.getTime()).toBe(new Date('2024-01-15T15:50:00.000Z').getTime())
			expect(result[1]!.end.getTime()).toBe(new Date('2024-01-15T17:10:00.000Z').getTime())
		})

		test('should return original times with zero padding', () => {
			const result = applyPadding([baseBusyTime], 0)
			expect(result).toHaveLength(1)
			expect(result[0]!.start.getTime()).toBe(baseBusyTime.start.getTime())
			expect(result[0]!.end.getTime()).toBe(baseBusyTime.end.getTime())
		})

		test('should return empty array for empty input', () => {
			const result = applyPadding([], 15)
			expect(result).toHaveLength(0)
		})

		test('should handle padding across day boundaries', () => {
			const lateBusyTime: BusyTime = {
				start: new Date('2024-01-15T23:45:00.000Z'),
				end: new Date('2024-01-16T00:15:00.000Z'),
			}

			const result = applyPadding([lateBusyTime], 30)
			expect(result[0]!.start.getTime()).toBe(new Date('2024-01-15T23:15:00.000Z').getTime())
			expect(result[0]!.end.getTime()).toBe(new Date('2024-01-16T00:45:00.000Z').getTime())
		})

		test('should handle large padding values', () => {
			const result = applyPadding([baseBusyTime], 180) // 3 hours
			expect(result[0]!.start.getTime()).toBe(new Date('2024-01-15T11:00:00.000Z').getTime())
			expect(result[0]!.end.getTime()).toBe(new Date('2024-01-15T18:00:00.000Z').getTime())
		})

		test('should handle fractional padding', () => {
			const result = applyPadding([baseBusyTime], 2.5)
			expect(result[0]!.start.getTime()).toBe(new Date('2024-01-15T13:57:30.000Z').getTime())
			expect(result[0]!.end.getTime()).toBe(new Date('2024-01-15T15:02:30.000Z').getTime())
		})

		test('should handle very small busy time durations', () => {
			const shortBusyTime: BusyTime = {
				start: new Date('2024-01-15T14:00:00.000Z'),
				end: new Date('2024-01-15T14:01:00.000Z'), // 1 minute
			}

			const result = applyPadding([shortBusyTime], 5)
			expect(result[0]!.start.getTime()).toBe(new Date('2024-01-15T13:55:00.000Z').getTime())
			expect(result[0]!.end.getTime()).toBe(new Date('2024-01-15T14:06:00.000Z').getTime())
		})

		test('should preserve original array order', () => {
			const busyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T16:00:00.000Z'),
					end: new Date('2024-01-15T17:00:00.000Z'),
				},
				baseBusyTime, // Earlier time but later in array
				{
					start: new Date('2024-01-15T18:00:00.000Z'),
					end: new Date('2024-01-15T19:00:00.000Z'),
				},
			]

			const result = applyPadding(busyTimes, 5)
			expect(result).toHaveLength(3)

			// Should maintain original order
			expect(result[0]!.start.getHours()).toBe(15) // 16:00 - 5min = 15:55
			expect(result[1]!.start.getHours()).toBe(13) // 14:00 - 5min = 13:55
			expect(result[2]!.start.getHours()).toBe(17) // 18:00 - 5min = 17:55
		})
	})

	// Performance and edge case tests
	describe('Performance and Edge Cases', () => {
		test('should handle large number of busy times efficiently', () => {
			const manyBusyTimes: BusyTime[] = []
			for (let i = 0; i < 1000; i++) {
				manyBusyTimes.push({
					start: new Date(`2024-01-${Math.floor(i / 24) + 1}T${i % 24}:00:00.000Z`),
					end: new Date(`2024-01-${Math.floor(i / 24) + 1}T${i % 24}:30:00.000Z`),
				})
			}

			const startTime = performance.now()
			const result = applyPadding(manyBusyTimes, 10)
			const endTime = performance.now()

			expect(result).toHaveLength(1000)
			expect(endTime - startTime).toBeLessThan(10) // Should complete in < 10ms
		})

		test('should not modify original busy times array', () => {
			const original = [{ ...baseBusyTime }]
			const originalStartTime = original[0]!.start.getTime()
			const originalEndTime = original[0]!.end.getTime()

			applyPadding(original, 15)

			expect(original[0]!.start.getTime()).toBe(originalStartTime)
			expect(original[0]!.end.getTime()).toBe(originalEndTime)
		})

		test('should handle millisecond precision', () => {
			const preciseBusyTime: BusyTime = {
				start: new Date('2024-01-15T14:00:00.123Z'),
				end: new Date('2024-01-15T15:00:00.456Z'),
			}

			const result = applyPadding([preciseBusyTime], 1)
			expect(result[0]!.start.getTime()).toBe(new Date('2024-01-15T13:59:00.123Z').getTime())
			expect(result[0]!.end.getTime()).toBe(new Date('2024-01-15T15:01:00.456Z').getTime())
		})
	})
})
