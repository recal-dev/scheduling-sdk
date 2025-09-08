import { describe, expect, test } from 'bun:test'
import {
	findFreeIntervals,
	busyTimesToIntervals,
	intervalsToTimeSlots,
	findAvailableSlotsWithOverlaps,
	type Interval,
} from '../../../src/helpers/busy-time/free-intervals'
import type { BusyTime } from '../../../src/types/scheduling.types'

describe('Free Intervals with K Overlaps', () => {
	describe('findFreeIntervals', () => {
		test('should handle empty busy times with bounds', () => {
			const result = findFreeIntervals([], 0, { start: 0, end: 100 })
			expect(result).toEqual([{ start: 0, end: 100 }])
		})

		test('should handle empty busy times without bounds', () => {
			const result = findFreeIntervals([], 0)
			expect(result).toEqual([])
		})

		test('should handle single interval with K=0', () => {
			const busy: Interval[] = [{ start: 10, end: 20 }]
			const result = findFreeIntervals(busy, 0, { start: 0, end: 30 })
			expect(result).toEqual([
				{ start: 0, end: 10 },
				{ start: 20, end: 30 },
			])
		})

		test('should handle touching intervals correctly', () => {
			const busy: Interval[] = [
				{ start: 1, end: 3 },
				{ start: 3, end: 5 },
			]
			const result = findFreeIntervals(busy, 0, { start: 0, end: 6 })
			expect(result).toEqual([
				{ start: 0, end: 1 },
				{ start: 5, end: 6 },
			])
		})

		test('should respect K overlaps threshold', () => {
			// Two overlapping intervals: [1,4) and [2,5)
			const busy: Interval[] = [
				{ start: 1, end: 4 },
				{ start: 2, end: 5 },
			]

			// K=0: any overlap is busy
			const k0 = findFreeIntervals(busy, 0, { start: 0, end: 6 })
			expect(k0).toEqual([
				{ start: 0, end: 1 },
				{ start: 5, end: 6 },
			])

			// K=1: allow up to 1 overlap, [2,4) has 2 overlaps so is busy
			const k1 = findFreeIntervals(busy, 1, { start: 0, end: 6 })
			expect(k1).toEqual([
				{ start: 0, end: 2 },
				{ start: 4, end: 6 },
			])
		})

		test('should handle multiple overlaps correctly', () => {
			// Three intervals: [0,10), [1,3), [2,8)
			const busy: Interval[] = [
				{ start: 0, end: 10 },
				{ start: 1, end: 3 },
				{ start: 2, end: 8 },
			]

			// K=2: busy where ≥3 overlap (only [2,3) has 3 overlaps)
			const result = findFreeIntervals(busy, 2, { start: 0, end: 12 })
			expect(result).toEqual([
				{ start: 0, end: 2 },
				{ start: 3, end: 12 },
			])
		})

		test('should handle same-time starts and ends', () => {
			const busy: Interval[] = [
				{ start: 1, end: 3 },
				{ start: 1, end: 2 },
				{ start: 2, end: 3 },
			]
			const result = findFreeIntervals(busy, 1, { start: 0, end: 4 })
			expect(result).toEqual([
				{ start: 0, end: 1 },
				{ start: 3, end: 4 },
			])
		})

		test('should handle large K values', () => {
			const busy: Interval[] = [{ start: 1, end: 3 }]
			const result = findFreeIntervals(busy, 100, { start: 0, end: 4 })
			expect(result).toEqual([{ start: 0, end: 4 }])
		})

		test('should validate K parameter', () => {
			expect(() => findFreeIntervals([], -1)).toThrow('K must be non-negative')
		})

		test('should handle very small intervals', () => {
			const busy: Interval[] = [
				{ start: 1000, end: 1001 }, // 1ms interval
				{ start: 1500, end: 1501 }, // 1ms interval
			]
			const result = findFreeIntervals(busy, 0, { start: 0, end: 2000 })
			expect(result).toEqual([
				{ start: 0, end: 1000 },
				{ start: 1001, end: 1500 },
				{ start: 1501, end: 2000 },
			])
		})

		test('should handle intervals at exact bounds', () => {
			const busy: Interval[] = [
				{ start: 0, end: 10 }, // Starts at bounds start
				{ start: 90, end: 100 }, // Ends at bounds end
			]
			const result = findFreeIntervals(busy, 0, { start: 0, end: 100 })
			expect(result).toEqual([{ start: 10, end: 90 }])
		})

		test('should handle intervals outside bounds', () => {
			const busy: Interval[] = [
				{ start: -10, end: 5 }, // Overlaps start
				{ start: 95, end: 110 }, // Overlaps end
			]
			const result = findFreeIntervals(busy, 0, { start: 0, end: 100 })
			expect(result).toEqual([{ start: 5, end: 95 }])
		})

		test('should handle complex overlap patterns with K=1', () => {
			// Pattern: [0,5), [2,7), [4,9), [6,11)
			const busy: Interval[] = [
				{ start: 0, end: 5 },
				{ start: 2, end: 7 },
				{ start: 4, end: 9 },
				{ start: 6, end: 11 },
			]
			const result = findFreeIntervals(busy, 1, { start: 0, end: 15 })

			// With K=1: periods with ≥2 overlaps are busy
			// Free periods: [0,2) and [9,15) since [2,9) has ≥2 overlaps
			expect(result).toEqual([
				{ start: 0, end: 2 },
				{ start: 9, end: 15 },
			])
		})

		test('should handle many simultaneous starts', () => {
			const busy: Interval[] = [
				{ start: 10, end: 15 },
				{ start: 10, end: 20 },
				{ start: 10, end: 25 },
			]
			const result = findFreeIntervals(busy, 1, { start: 0, end: 30 })

			// At t=10, 3 intervals start (≥2 = busy). Period [10,15) has 3, [15,20) has 2, [20,25) has 1
			// So busy periods are [10,20), free periods are [0,10) and [20,30)
			expect(result).toEqual([
				{ start: 0, end: 10 },
				{ start: 20, end: 30 },
			])
		})

		test('should handle many simultaneous ends', () => {
			const busy: Interval[] = [
				{ start: 5, end: 20 },
				{ start: 10, end: 20 },
				{ start: 15, end: 20 },
			]
			const result = findFreeIntervals(busy, 1, { start: 0, end: 30 })

			// Analysis: [0,5): 0≤1 ✓, [5,10): 1≤1 ✓, [10,20): ≥2>1 ✗, [20,30): 0≤1 ✓
			expect(result).toEqual([
				{ start: 0, end: 10 }, // Free until 2nd interval starts
				{ start: 20, end: 30 },
			])
		})

		test('should handle mixed simultaneous events', () => {
			const busy: Interval[] = [
				{ start: 10, end: 20 },
				{ start: 15, end: 20 }, // Starts mid-way
				{ start: 20, end: 30 }, // Starts when others end
			]
			const result = findFreeIntervals(busy, 1, { start: 0, end: 40 })

			// t=20: 2 intervals end (-2), 1 starts (+1), net = -1
			// So active goes from 2 to 1 at t=20
			expect(result).toEqual([
				{ start: 0, end: 15 },
				{ start: 20, end: 40 },
			])
		})

		test('should handle single interval spanning entire bounds', () => {
			const busy: Interval[] = [{ start: 0, end: 100 }]

			const k0 = findFreeIntervals(busy, 0, { start: 0, end: 100 })
			expect(k0).toEqual([])

			const k1 = findFreeIntervals(busy, 1, { start: 0, end: 100 })
			expect(k1).toEqual([{ start: 0, end: 100 }])
		})

		test('should handle bounds completely outside busy intervals', () => {
			const busy: Interval[] = [{ start: 100, end: 200 }]
			const result = findFreeIntervals(busy, 0, { start: 0, end: 50 })
			expect(result).toEqual([{ start: 0, end: 50 }])
		})

		test('should handle fractional timestamps', () => {
			const busy: Interval[] = [
				{ start: 1.5, end: 3.7 },
				{ start: 2.1, end: 4.9 },
			]
			const result = findFreeIntervals(busy, 0, { start: 0, end: 6 })
			expect(result).toEqual([
				{ start: 0, end: 1.5 },
				{ start: 4.9, end: 6 },
			])
		})

		test('should handle large K values gracefully', () => {
			const busy: Interval[] = [
				{ start: 1, end: 3 },
				{ start: 2, end: 4 },
				{ start: 3, end: 5 },
			]
			const result = findFreeIntervals(busy, 1000, { start: 0, end: 6 })
			// K=1000 means allow up to 1000 overlaps, so everything is free
			expect(result).toEqual([{ start: 0, end: 6 }])
		})

		test('should merge adjacent free intervals correctly', () => {
			const busy: Interval[] = [
				{ start: 5, end: 10 },
				{ start: 15, end: 20 },
			]
			const result = findFreeIntervals(busy, 0, { start: 0, end: 25 })
			expect(result).toEqual([
				{ start: 0, end: 5 },
				{ start: 10, end: 15 },
				{ start: 20, end: 25 },
			])
		})

		test('should handle zero-length bounds', () => {
			const busy: Interval[] = [{ start: 5, end: 10 }]
			const result = findFreeIntervals(busy, 0, { start: 7, end: 7 })
			expect(result).toEqual([])
		})

		test('should handle performance with many intervals', () => {
			// Create 1000 non-overlapping intervals
			const busy: Interval[] = []
			for (let i = 0; i < 1000; i++) {
				busy.push({ start: i * 10, end: i * 10 + 5 })
			}

			const start = performance.now()
			const result = findFreeIntervals(busy, 0, { start: 0, end: 10000 })
			const duration = performance.now() - start

			// Should complete in reasonable time (< 50ms for 1000 intervals)
			expect(duration).toBeLessThan(50)
			expect(result.length).toBe(1000) // 999 gaps between intervals + 1 end gap
		})

		test('should handle duplicate intervals', () => {
			const busy: Interval[] = [
				{ start: 1, end: 3 },
				{ start: 1, end: 3 }, // Exact duplicate
				{ start: 1, end: 3 }, // Another duplicate
			]
			const result = findFreeIntervals(busy, 1, { start: 0, end: 5 })
			// K=1 allows ≤1 overlap, but we have 3 identical intervals (≥2 = busy)
			expect(result).toEqual([
				{ start: 0, end: 1 },
				{ start: 3, end: 5 },
			])
		})

		test('should filter invalid intervals', () => {
			const busy: Interval[] = [
				{ start: 1, end: 3 }, // valid
				{ start: 5, end: 5 }, // invalid: start >= end
				{ start: 7, end: 6 }, // invalid: start >= end
				{ start: NaN, end: 10 }, // invalid: non-finite
				{ start: 8, end: 10 }, // valid
			]
			const result = findFreeIntervals(busy, 0, { start: 0, end: 12 })
			expect(result).toEqual([
				{ start: 0, end: 1 },
				{ start: 3, end: 8 },
				{ start: 10, end: 12 },
			])
		})
	})

	describe('busyTimesToIntervals', () => {
		test('should convert BusyTime array to intervals', () => {
			const busyTimes: BusyTime[] = [
				{ start: new Date('2024-01-15T10:00:00Z'), end: new Date('2024-01-15T11:00:00Z') },
				{ start: new Date('2024-01-15T14:00:00Z'), end: new Date('2024-01-15T15:30:00Z') },
			]
			const result = busyTimesToIntervals(busyTimes)
			expect(result).toEqual([
				{ start: new Date('2024-01-15T10:00:00Z').getTime(), end: new Date('2024-01-15T11:00:00Z').getTime() },
				{ start: new Date('2024-01-15T14:00:00Z').getTime(), end: new Date('2024-01-15T15:30:00Z').getTime() },
			])
		})
	})

	describe('intervalsToTimeSlots', () => {
		test('should convert intervals to TimeSlot array', () => {
			const intervals: Interval[] = [
				{ start: 1000, end: 2000 },
				{ start: 3000, end: 4000 },
			]
			const result = intervalsToTimeSlots(intervals)
			expect(result).toEqual([
				{ start: new Date(1000), end: new Date(2000) },
				{ start: new Date(3000), end: new Date(4000) },
			])
		})
	})

	describe('findAvailableSlotsWithOverlaps', () => {
		test('should find available slots using K overlaps', () => {
			const startTime = new Date('2024-01-15T09:00:00Z')
			const endTime = new Date('2024-01-15T17:00:00Z')
			const busyTimes: BusyTime[] = [
				{ start: new Date('2024-01-15T10:00:00Z'), end: new Date('2024-01-15T11:00:00Z') },
				{ start: new Date('2024-01-15T10:30:00Z'), end: new Date('2024-01-15T11:30:00Z') },
			]

			// K=0: traditional behavior
			const k0 = findAvailableSlotsWithOverlaps(startTime, endTime, busyTimes, 0)
			expect(k0.length).toBe(2) // Before overlap and after overlap
			expect(k0[0]!.start.getTime()).toBe(startTime.getTime())
			expect(k0[0]!.end.getTime()).toBe(new Date('2024-01-15T10:00:00Z').getTime())
			expect(k0[1]!.start.getTime()).toBe(new Date('2024-01-15T11:30:00Z').getTime())
			expect(k0[1]!.end.getTime()).toBe(endTime.getTime())

			// K=1: allow single overlap
			const k1 = findAvailableSlotsWithOverlaps(startTime, endTime, busyTimes, 1)
			expect(k1.length).toBe(2) // Two free periods: before 2-overlap and after
			expect(k1[0]!.start.getTime()).toBe(startTime.getTime())
			expect(k1[0]!.end.getTime()).toBe(new Date('2024-01-15T10:30:00Z').getTime())
			expect(k1[1]!.start.getTime()).toBe(new Date('2024-01-15T11:00:00Z').getTime())
			expect(k1[1]!.end.getTime()).toBe(endTime.getTime())
		})
	})
})
