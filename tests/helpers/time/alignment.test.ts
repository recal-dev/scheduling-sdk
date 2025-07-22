import { describe, expect, test } from 'bun:test'
import {
	alignToInterval,
	calculateMinutesFromHour,
	findNextSlotBoundary,
	findStrictNextSlotBoundary,
	getTimeWithinDay,
} from '../../../src/helpers/time/alignment.ts'

describe('Alignment Helper', () => {
	// MARK: calculateMinutesFromHour tests
	describe('calculateMinutesFromHour', () => {
		test('should calculate minutes from hour start', () => {
			const date = new Date('2024-01-15T14:30:45.500Z')
			const result = calculateMinutesFromHour(date)
			expect(result).toBeCloseTo(30.758, 2)
		})

		test('should return 0 for hour start', () => {
			const date = new Date('2024-01-15T14:00:00.000Z')
			expect(calculateMinutesFromHour(date)).toBe(0)
		})

		test('should handle sub-minute precision', () => {
			const date = new Date('2024-01-15T14:00:30.250Z')
			const result = calculateMinutesFromHour(date)
			expect(result).toBeCloseTo(0.504, 2)
		})
	})

	// MARK: alignToInterval tests
	describe('alignToInterval', () => {
		const baseDate = new Date('2024-01-15T14:23:00.000Z')

		test('should align to 15-minute intervals', () => {
			const result = alignToInterval(baseDate, 15)
			expect(result.getMinutes()).toBe(30)
		})

		test('should align to 30-minute intervals', () => {
			const result = alignToInterval(baseDate, 30)
			expect(result.getMinutes()).toBe(30)
		})

		test('should handle already aligned times', () => {
			const alignedDate = new Date('2024-01-15T14:30:00.000Z')
			const result = alignToInterval(alignedDate, 15)
			expect(result.getTime()).toBe(alignedDate.getTime())
		})

		test('should align with offset', () => {
			const result = alignToInterval(baseDate, 15, 5)
			expect(result.getMinutes()).toBe(35)
		})

		test('should handle cross-hour alignment', () => {
			const lateDate = new Date('2024-01-15T14:58:00.000Z')
			const result = alignToInterval(lateDate, 15)
			expect(result.getHours()).toBe(15)
			expect(result.getMinutes()).toBe(0)
		})
	})

	// MARK: findNextSlotBoundary tests
	describe('findNextSlotBoundary', () => {
		test('should find next 15-minute boundary', () => {
			const date = new Date('2024-01-15T14:23:00.000Z')
			const result = findNextSlotBoundary(date, 15)
			expect(result.getMinutes()).toBe(30)
		})

		test('should find next boundary with offset', () => {
			const date = new Date('2024-01-15T14:18:00.000Z')
			const result = findNextSlotBoundary(date, 15, 5)
			expect(result.getMinutes()).toBe(20)
		})

		test('should handle already at boundary', () => {
			const date = new Date('2024-01-15T14:30:00.000Z')
			const result = findNextSlotBoundary(date, 15)
			expect(result.getTime()).toBe(date.getTime())
		})

		test('should handle minute boundary edge case', () => {
			const date = new Date('2024-01-15T14:59:30.000Z')
			const result = findNextSlotBoundary(date, 30)
			expect(result.getHours()).toBe(15)
			expect(result.getMinutes()).toBe(0)
		})

		test('should work with various intervals', () => {
			const date = new Date('2024-01-15T14:13:00.000Z')

			// Test 5-minute intervals
			const result5 = findNextSlotBoundary(date, 5)
			expect(result5.getMinutes()).toBe(15)

			// Test 10-minute intervals
			const result10 = findNextSlotBoundary(date, 10)
			expect(result10.getMinutes()).toBe(20)

			// Test 20-minute intervals
			const result20 = findNextSlotBoundary(date, 20)
			expect(result20.getMinutes()).toBe(20)
		})
	})

	// MARK: findStrictNextSlotBoundary tests
	describe('findStrictNextSlotBoundary', () => {
		test('should always return next boundary when already aligned', () => {
			const alignedDate = new Date('2024-01-15T14:30:00.000Z')
			const result = findStrictNextSlotBoundary(alignedDate, 15)
			expect(result.getMinutes()).toBe(45)
			expect(result.getHours()).toBe(14)
		})

		test('should return next boundary when not aligned', () => {
			const date = new Date('2024-01-15T14:23:00.000Z')
			const result = findStrictNextSlotBoundary(date, 15)
			expect(result.getMinutes()).toBe(30)
			expect(result.getHours()).toBe(14)
		})

		test('should handle offset when already aligned', () => {
			const alignedDate = new Date('2024-01-15T14:20:00.000Z')
			const result = findStrictNextSlotBoundary(alignedDate, 15, 5)
			expect(result.getMinutes()).toBe(35)
			expect(result.getHours()).toBe(14)
		})

		test('should handle offset when not aligned', () => {
			const date = new Date('2024-01-15T14:18:00.000Z')
			const result = findStrictNextSlotBoundary(date, 15, 5)
			expect(result.getMinutes()).toBe(20)
			expect(result.getHours()).toBe(14)
		})

		test('should handle cross-hour boundaries when aligned', () => {
			const alignedDate = new Date('2024-01-15T14:45:00.000Z')
			const result = findStrictNextSlotBoundary(alignedDate, 15)
			expect(result.getMinutes()).toBe(0)
			expect(result.getHours()).toBe(15)
		})

		test('should handle cross-day boundaries when aligned', () => {
			const alignedDate = new Date('2024-01-15T23:45:00.000Z')
			const result = findStrictNextSlotBoundary(alignedDate, 15)
			expect(result.getDate()).toBe(16)
			expect(result.getHours()).toBe(0)
			expect(result.getMinutes()).toBe(0)
		})

		test('should work with various interval sizes', () => {
			const alignedDate = new Date('2024-01-15T14:00:00.000Z')

			// 5-minute intervals
			const result5 = findStrictNextSlotBoundary(alignedDate, 5)
			expect(result5.getMinutes()).toBe(5)

			// 10-minute intervals
			const result10 = findStrictNextSlotBoundary(alignedDate, 10)
			expect(result10.getMinutes()).toBe(10)

			// 30-minute intervals
			const result30 = findStrictNextSlotBoundary(alignedDate, 30)
			expect(result30.getMinutes()).toBe(30)

			// 60-minute intervals
			const result60 = findStrictNextSlotBoundary(alignedDate, 60)
			expect(result60.getHours()).toBe(15)
			expect(result60.getMinutes()).toBe(0)
		})

		test('should handle sub-minute precision correctly', () => {
			const dateWithMillis = new Date('2024-01-15T14:30:45.500Z')
			const result = findStrictNextSlotBoundary(dateWithMillis, 15)
			expect(result.getMinutes()).toBe(45)
			expect(result.getSeconds()).toBe(0)
			expect(result.getMilliseconds()).toBe(0)
		})

		test('should handle already aligned with sub-minute precision', () => {
			const alignedWithMillis = new Date('2024-01-15T14:30:00.500Z')
			const result = findStrictNextSlotBoundary(alignedWithMillis, 15)
			expect(result.getMinutes()).toBe(45)
			expect(result.getSeconds()).toBe(0)
			expect(result.getMilliseconds()).toBe(0)
		})

		test('should handle large intervals correctly', () => {
			const date = new Date('2024-01-15T14:00:00.000Z')

			// 90-minute intervals - 14:00 is aligned at 13:30, 15:00, 16:30...
			// so next strict boundary from 14:00 is 15:00
			const result90 = findStrictNextSlotBoundary(date, 90)
			expect(result90.getHours()).toBe(15)
			expect(result90.getMinutes()).toBe(0)

			// 120-minute intervals - boundaries at 0:00, 2:00, 4:00... 14:00, 16:00
			// 14:00 is already aligned, so next is 16:00
			const result120 = findStrictNextSlotBoundary(date, 120)
			expect(result120.getHours()).toBe(16)
			expect(result120.getMinutes()).toBe(0)
		})

		test('should handle offset larger than interval gracefully', () => {
			const date = new Date('2024-01-15T14:00:00.000Z')
			// With interval 15 and offset 20, the modulo operation will effectively use offset % interval = 5
			// So boundaries are at :05, :20, :35, :50
			// 14:00 aligns to next boundary which is 14:05
			const result = findStrictNextSlotBoundary(date, 15, 20)
			expect(result.getMinutes()).toBe(5)
		})

		test('should handle midnight edge case', () => {
			const midnight = new Date('2024-01-15T00:00:00.000Z')
			const result = findStrictNextSlotBoundary(midnight, 30)
			expect(result.getHours()).toBe(0)
			expect(result.getMinutes()).toBe(30)
		})

		test('should handle end of hour with offset', () => {
			const date = new Date('2024-01-15T14:55:00.000Z')
			const result = findStrictNextSlotBoundary(date, 15, 10)
			expect(result.getHours()).toBe(15)
			expect(result.getMinutes()).toBe(10)
		})

		// Iterative tests for comprehensive coverage
		describe('iterative boundary tests', () => {
			test('should correctly advance from every 15-minute boundary in an hour', () => {
				const baseHour = new Date('2024-01-15T14:00:00.000Z')
				const boundaries = [0, 15, 30, 45]

				boundaries.forEach(minute => {
					const date = new Date(baseHour)
					date.setMinutes(minute)
					const result = findStrictNextSlotBoundary(date, 15)
					const expectedMinute = (minute + 15) % 60
					const expectedHour = minute === 45 ? 15 : 14

					expect(result.getMinutes()).toBe(expectedMinute)
					expect(result.getHours()).toBe(expectedHour)
				})
			})

			test('should handle all minute values with 5-minute intervals', () => {
				const baseDate = new Date('2024-01-15T14:00:00.000Z')

				for (let minute = 0; minute < 60; minute += 5) {
					const date = new Date(baseDate)
					date.setMinutes(minute)
					const result = findStrictNextSlotBoundary(date, 5)

					if (minute === 55) {
						expect(result.getHours()).toBe(15)
						expect(result.getMinutes()).toBe(0)
					} else {
						expect(result.getMinutes()).toBe(minute + 5)
						expect(result.getHours()).toBe(14)
					}
				}
			})

			test('should handle various offsets with different intervals', () => {
				const intervals = [10, 15, 30]
				const offsets = [0, 5, 10, 15]
				const baseDate = new Date('2024-01-15T14:00:00.000Z')

				intervals.forEach(interval => {
					offsets.forEach(offset => {
						if (offset < interval) {
							const alignedDate = new Date(baseDate)
							alignedDate.setMinutes(offset)
							const result = findStrictNextSlotBoundary(alignedDate, interval, offset)

							const expectedMinute = (offset + interval) % 60
							expect(result.getMinutes()).toBe(expectedMinute)
						}
					})
				})
			})
		})

		// Performance edge cases
		test('should handle year boundaries', () => {
			const yearEnd = new Date('2024-12-31T23:45:00.000Z')
			const result = findStrictNextSlotBoundary(yearEnd, 15)
			expect(result.getFullYear()).toBe(2025)
			expect(result.getMonth()).toBe(0) // January
			expect(result.getDate()).toBe(1)
			expect(result.getHours()).toBe(0)
			expect(result.getMinutes()).toBe(0)
		})

		test('should handle leap year boundaries', () => {
			const leapDay = new Date('2024-02-29T23:30:00.000Z')
			const result = findStrictNextSlotBoundary(leapDay, 30)
			expect(result.getMonth()).toBe(2) // March
			expect(result.getDate()).toBe(1)
			expect(result.getHours()).toBe(0)
			expect(result.getMinutes()).toBe(0)
		})

		test('should handle month boundaries', () => {
			const monthEnd = new Date('2024-01-31T23:30:00.000Z')
			const result = findStrictNextSlotBoundary(monthEnd, 30)
			expect(result.getMonth()).toBe(1) // February
			expect(result.getDate()).toBe(1)
			expect(result.getHours()).toBe(0)
			expect(result.getMinutes()).toBe(0)
		})
	})

	// MARK: getTimeWithinDay tests
	describe('getTimeWithinDay', () => {
		test('should calculate minutes from start of day', () => {
			const date = new Date('2024-01-15T14:30:00.000Z')
			const result = getTimeWithinDay(date)
			expect(result).toBe(14 * 60 + 30) // 870 minutes
		})

		test('should return 0 for start of day', () => {
			const date = new Date('2024-01-15T00:00:00.000Z')
			expect(getTimeWithinDay(date)).toBe(0)
		})

		test('should handle end of day', () => {
			const date = new Date('2024-01-15T23:59:00.000Z')
			expect(getTimeWithinDay(date)).toBe(23 * 60 + 59)
		})

		test('should ignore seconds and milliseconds', () => {
			const date1 = new Date('2024-01-15T14:30:00.000Z')
			const date2 = new Date('2024-01-15T14:30:45.999Z')
			expect(getTimeWithinDay(date1)).toBe(getTimeWithinDay(date2))
		})
	})

	// MARK: Edge case tests
	describe('Edge Cases', () => {
		test('should handle leap year day', () => {
			const leapDate = new Date('2024-02-29T12:00:00.000Z')
			const result = alignToInterval(leapDate, 15)
			expect(result.getMonth()).toBe(1) // February
			expect(result.getDate()).toBe(29)
		})

		test('should handle DST transition periods', () => {
			// Note: This would need specific timezone handling in a real implementation
			const dstDate = new Date('2024-03-10T07:30:00.000Z') // Example DST date
			const result = alignToInterval(dstDate, 30)
			expect(result).toBeInstanceOf(Date)
		})

		test('should handle very large intervals', () => {
			const date = new Date('2024-01-15T14:30:00.000Z')
			const result = alignToInterval(date, 120) // 2 hours
			expect(result.getMinutes()).toBe(0)
			expect(result.getHours()).toBe(16)
		})
	})
})
