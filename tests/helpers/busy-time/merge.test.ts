import { describe, expect, test } from 'bun:test'
import { isOverlapping, mergeBusyTimes } from '../../../src/helpers/busy-time/merge.ts'
import type { BusyTime } from '../../../src/types/scheduling.types.ts'

describe('Merge Helper', () => {
	describe('mergeBusyTimes', () => {
		test('should return empty array for empty input', () => {
			const result = mergeBusyTimes([])
			expect(result).toEqual([])
		})

		test('should return single item unchanged', () => {
			const busyTime: BusyTime = {
				start: new Date('2024-01-15T09:00:00Z'),
				end: new Date('2024-01-15T10:00:00Z'),
			}
			const result = mergeBusyTimes([busyTime])
			expect(result).toHaveLength(1)
			expect(result[0]!.start).toEqual(busyTime.start)
			expect(result[0]!.end).toEqual(busyTime.end)
		})

		test('should merge overlapping busy times', () => {
			const busyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T09:00:00Z'),
					end: new Date('2024-01-15T10:30:00Z'),
				},
				{
					start: new Date('2024-01-15T10:00:00Z'),
					end: new Date('2024-01-15T11:00:00Z'),
				},
			]

			const result = mergeBusyTimes(busyTimes)
			expect(result).toHaveLength(1)
			expect(result[0]!.start).toEqual(new Date('2024-01-15T09:00:00Z'))
			expect(result[0]!.end).toEqual(new Date('2024-01-15T11:00:00Z'))
		})

		test('should merge adjacent busy times', () => {
			const busyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T09:00:00Z'),
					end: new Date('2024-01-15T10:00:00Z'),
				},
				{
					start: new Date('2024-01-15T10:00:00Z'),
					end: new Date('2024-01-15T11:00:00Z'),
				},
			]

			const result = mergeBusyTimes(busyTimes)
			expect(result).toHaveLength(1)
			expect(result[0]!.start).toEqual(new Date('2024-01-15T09:00:00Z'))
			expect(result[0]!.end).toEqual(new Date('2024-01-15T11:00:00Z'))
		})

		test('should preserve non-overlapping busy times', () => {
			const busyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T09:00:00Z'),
					end: new Date('2024-01-15T10:00:00Z'),
				},
				{
					start: new Date('2024-01-15T11:00:00Z'),
					end: new Date('2024-01-15T12:00:00Z'),
				},
			]

			const result = mergeBusyTimes(busyTimes)
			expect(result).toHaveLength(2)
			expect(result[0]!.start).toEqual(new Date('2024-01-15T09:00:00Z'))
			expect(result[0]!.end).toEqual(new Date('2024-01-15T10:00:00Z'))
			expect(result[1]!.start).toEqual(new Date('2024-01-15T11:00:00Z'))
			expect(result[1]!.end).toEqual(new Date('2024-01-15T12:00:00Z'))
		})

		test('should handle one busy time completely containing another', () => {
			const busyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T09:00:00Z'),
					end: new Date('2024-01-15T12:00:00Z'),
				},
				{
					start: new Date('2024-01-15T10:00:00Z'),
					end: new Date('2024-01-15T11:00:00Z'),
				},
			]

			const result = mergeBusyTimes(busyTimes)
			expect(result).toHaveLength(1)
			expect(result[0]!.start).toEqual(new Date('2024-01-15T09:00:00Z'))
			expect(result[0]!.end).toEqual(new Date('2024-01-15T12:00:00Z'))
		})

		test('should handle chain of overlapping times', () => {
			const busyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T09:00:00Z'),
					end: new Date('2024-01-15T10:30:00Z'),
				},
				{
					start: new Date('2024-01-15T10:00:00Z'),
					end: new Date('2024-01-15T11:30:00Z'),
				},
				{
					start: new Date('2024-01-15T11:00:00Z'),
					end: new Date('2024-01-15T12:00:00Z'),
				},
			]

			const result = mergeBusyTimes(busyTimes)
			expect(result).toHaveLength(1)
			expect(result[0]!.start).toEqual(new Date('2024-01-15T09:00:00Z'))
			expect(result[0]!.end).toEqual(new Date('2024-01-15T12:00:00Z'))
		})

		test('should sort before merging', () => {
			const busyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T11:00:00Z'),
					end: new Date('2024-01-15T12:00:00Z'),
				},
				{
					start: new Date('2024-01-15T09:00:00Z'),
					end: new Date('2024-01-15T10:30:00Z'),
				},
				{
					start: new Date('2024-01-15T10:00:00Z'),
					end: new Date('2024-01-15T11:30:00Z'),
				},
			]

			const result = mergeBusyTimes(busyTimes)
			expect(result).toHaveLength(1)
			expect(result[0]!.start).toEqual(new Date('2024-01-15T09:00:00Z'))
			expect(result[0]!.end).toEqual(new Date('2024-01-15T12:00:00Z'))
		})

		test('should handle exact same start and end times', () => {
			const busyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T09:00:00Z'),
					end: new Date('2024-01-15T10:00:00Z'),
				},
				{
					start: new Date('2024-01-15T09:00:00Z'),
					end: new Date('2024-01-15T10:00:00Z'),
				},
			]

			const result = mergeBusyTimes(busyTimes)
			expect(result).toHaveLength(1)
			expect(result[0]!.start).toEqual(new Date('2024-01-15T09:00:00Z'))
			expect(result[0]!.end).toEqual(new Date('2024-01-15T10:00:00Z'))
		})

		test('should handle complex multiple merge scenario', () => {
			const busyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T09:00:00Z'),
					end: new Date('2024-01-15T10:00:00Z'),
				},
				{
					start: new Date('2024-01-15T09:30:00Z'),
					end: new Date('2024-01-15T11:00:00Z'),
				},
				{
					start: new Date('2024-01-15T13:00:00Z'),
					end: new Date('2024-01-15T14:00:00Z'),
				},
				{
					start: new Date('2024-01-15T13:30:00Z'),
					end: new Date('2024-01-15T15:00:00Z'),
				},
				{
					start: new Date('2024-01-15T17:00:00Z'),
					end: new Date('2024-01-15T18:00:00Z'),
				},
			]

			const result = mergeBusyTimes(busyTimes)
			expect(result).toHaveLength(3)

			// First merged block
			expect(result[0]!.start).toEqual(new Date('2024-01-15T09:00:00Z'))
			expect(result[0]!.end).toEqual(new Date('2024-01-15T11:00:00Z'))

			// Second merged block
			expect(result[1]!.start).toEqual(new Date('2024-01-15T13:00:00Z'))
			expect(result[1]!.end).toEqual(new Date('2024-01-15T15:00:00Z'))

			// Third isolated block
			expect(result[2]!.start).toEqual(new Date('2024-01-15T17:00:00Z'))
			expect(result[2]!.end).toEqual(new Date('2024-01-15T18:00:00Z'))
		})
	})

	describe('isOverlapping', () => {
		const baseTime: BusyTime = {
			start: new Date('2024-01-15T10:00:00Z'),
			end: new Date('2024-01-15T11:00:00Z'),
		}

		test('should detect overlapping times', () => {
			const overlapping: BusyTime = {
				start: new Date('2024-01-15T10:30:00Z'),
				end: new Date('2024-01-15T11:30:00Z'),
			}
			expect(isOverlapping(baseTime, overlapping)).toBe(true)
		})

		test('should detect one time containing another', () => {
			const contained: BusyTime = {
				start: new Date('2024-01-15T10:15:00Z'),
				end: new Date('2024-01-15T10:45:00Z'),
			}
			expect(isOverlapping(baseTime, contained)).toBe(true)
		})

		test('should return false for non-overlapping times', () => {
			const nonOverlapping: BusyTime = {
				start: new Date('2024-01-15T11:30:00Z'),
				end: new Date('2024-01-15T12:30:00Z'),
			}
			expect(isOverlapping(baseTime, nonOverlapping)).toBe(false)
		})

		test('should return false for adjacent times', () => {
			const adjacent: BusyTime = {
				start: new Date('2024-01-15T11:00:00Z'),
				end: new Date('2024-01-15T12:00:00Z'),
			}
			expect(isOverlapping(baseTime, adjacent)).toBe(false)
		})

		test('should handle exact boundary overlaps', () => {
			const boundaryOverlap: BusyTime = {
				start: new Date('2024-01-15T10:59:59Z'),
				end: new Date('2024-01-15T11:30:00Z'),
			}
			expect(isOverlapping(baseTime, boundaryOverlap)).toBe(true)
		})
	})

	// Performance tests
	describe('Performance', () => {
		test('should handle large number of busy times efficiently', () => {
			const manyBusyTimes: BusyTime[] = []
			for (let i = 0; i < 1000; i++) {
				manyBusyTimes.push({
					start: new Date(
						`2024-01-15T${Math.floor(i / 60)
							.toString()
							.padStart(2, '0')}:${(i % 60).toString().padStart(2, '0')}:00Z`
					),
					end: new Date(
						`2024-01-15T${Math.floor(i / 60)
							.toString()
							.padStart(2, '0')}:${((i % 60) + 1).toString().padStart(2, '0')}:00Z`
					),
				})
			}

			const startTime = performance.now()
			const result = mergeBusyTimes(manyBusyTimes)
			const endTime = performance.now()

			expect(result.length).toBeGreaterThan(0)
			expect(endTime - startTime).toBeLessThan(50) // Should complete in < 50ms
		})
	})
})
