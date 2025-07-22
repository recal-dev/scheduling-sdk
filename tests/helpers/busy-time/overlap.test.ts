import { describe, expect, test } from 'bun:test'
import { hasOverlap, isSlotAvailable } from '../../../src/helpers/busy-time/overlap.ts'
import type { BusyTime, TimeSlot } from '../../../src/types/scheduling.types.ts'

describe('Overlap Helper', () => {
	const baseSlot: TimeSlot = {
		start: new Date('2024-01-15T10:00:00Z'),
		end: new Date('2024-01-15T10:30:00Z'),
	}

	const baseBusyTime: BusyTime = {
		start: new Date('2024-01-15T09:45:00Z'),
		end: new Date('2024-01-15T10:15:00Z'),
	}

	describe('hasOverlap', () => {
		test('should detect slot starts within busy time', () => {
			const overlappingBusyTime: BusyTime = {
				start: new Date('2024-01-15T09:45:00Z'),
				end: new Date('2024-01-15T10:15:00Z'),
			}
			expect(hasOverlap(baseSlot, overlappingBusyTime)).toBe(true)
		})

		test('should detect slot ends within busy time', () => {
			const overlappingBusyTime: BusyTime = {
				start: new Date('2024-01-15T10:15:00Z'),
				end: new Date('2024-01-15T10:45:00Z'),
			}
			expect(hasOverlap(baseSlot, overlappingBusyTime)).toBe(true)
		})

		test('should detect slot completely contains busy time', () => {
			const containedBusyTime: BusyTime = {
				start: new Date('2024-01-15T10:05:00Z'),
				end: new Date('2024-01-15T10:25:00Z'),
			}
			expect(hasOverlap(baseSlot, containedBusyTime)).toBe(true)
		})

		test('should detect busy time completely contains slot', () => {
			const containerBusyTime: BusyTime = {
				start: new Date('2024-01-15T09:30:00Z'),
				end: new Date('2024-01-15T11:00:00Z'),
			}
			expect(hasOverlap(baseSlot, containerBusyTime)).toBe(true)
		})

		test('should return false when slot is before busy time', () => {
			const laterBusyTime: BusyTime = {
				start: new Date('2024-01-15T11:00:00Z'),
				end: new Date('2024-01-15T12:00:00Z'),
			}
			expect(hasOverlap(baseSlot, laterBusyTime)).toBe(false)
		})

		test('should return false when slot is after busy time', () => {
			const earlierBusyTime: BusyTime = {
				start: new Date('2024-01-15T08:00:00Z'),
				end: new Date('2024-01-15T09:00:00Z'),
			}
			expect(hasOverlap(baseSlot, earlierBusyTime)).toBe(false)
		})

		test('should return false for adjacent times (slot ends when busy starts)', () => {
			const adjacentBusyTime: BusyTime = {
				start: new Date('2024-01-15T10:30:00Z'),
				end: new Date('2024-01-15T11:00:00Z'),
			}
			expect(hasOverlap(baseSlot, adjacentBusyTime)).toBe(false)
		})

		test('should return false for adjacent times (busy ends when slot starts)', () => {
			const adjacentBusyTime: BusyTime = {
				start: new Date('2024-01-15T09:00:00Z'),
				end: new Date('2024-01-15T10:00:00Z'),
			}
			expect(hasOverlap(baseSlot, adjacentBusyTime)).toBe(false)
		})

		test('should handle exact same times', () => {
			const sameBusyTime: BusyTime = {
				start: new Date('2024-01-15T10:00:00Z'),
				end: new Date('2024-01-15T10:30:00Z'),
			}
			expect(hasOverlap(baseSlot, sameBusyTime)).toBe(true)
		})

		test('should handle millisecond precision overlaps', () => {
			const msOverlapBusyTime: BusyTime = {
				start: new Date('2024-01-15T10:29:59.999Z'),
				end: new Date('2024-01-15T11:00:00Z'),
			}
			expect(hasOverlap(baseSlot, msOverlapBusyTime)).toBe(true)
		})

		test('should handle zero-duration slot', () => {
			const zeroDurationSlot: TimeSlot = {
				start: new Date('2024-01-15T10:15:00Z'),
				end: new Date('2024-01-15T10:15:00Z'),
			}
			expect(hasOverlap(zeroDurationSlot, baseBusyTime)).toBe(false)
		})

		test('should handle zero-duration busy time', () => {
			const zeroDurationBusyTime: BusyTime = {
				start: new Date('2024-01-15T10:15:00Z'),
				end: new Date('2024-01-15T10:15:00Z'),
			}
			expect(hasOverlap(baseSlot, zeroDurationBusyTime)).toBe(false)
		})
	})

	describe('isSlotAvailable', () => {
		const busyTimes: BusyTime[] = [
			{
				start: new Date('2024-01-15T09:00:00Z'),
				end: new Date('2024-01-15T10:00:00Z'),
			},
			{
				start: new Date('2024-01-15T11:00:00Z'),
				end: new Date('2024-01-15T12:00:00Z'),
			},
			{
				start: new Date('2024-01-15T14:00:00Z'),
				end: new Date('2024-01-15T15:00:00Z'),
			},
		]

		test('should return true for available slot', () => {
			const availableSlot: TimeSlot = {
				start: new Date('2024-01-15T10:15:00Z'),
				end: new Date('2024-01-15T10:45:00Z'),
			}
			expect(isSlotAvailable(availableSlot, busyTimes)).toBe(true)
		})

		test('should return false for overlapping slot', () => {
			const overlappingSlot: TimeSlot = {
				start: new Date('2024-01-15T09:30:00Z'),
				end: new Date('2024-01-15T10:30:00Z'),
			}
			expect(isSlotAvailable(overlappingSlot, busyTimes)).toBe(false)
		})

		test('should return true for slot between busy times', () => {
			const betweenSlot: TimeSlot = {
				start: new Date('2024-01-15T12:30:00Z'),
				end: new Date('2024-01-15T13:30:00Z'),
			}
			expect(isSlotAvailable(betweenSlot, busyTimes)).toBe(true)
		})

		test('should return true when no busy times exist', () => {
			const slot: TimeSlot = {
				start: new Date('2024-01-15T10:00:00Z'),
				end: new Date('2024-01-15T11:00:00Z'),
			}
			expect(isSlotAvailable(slot, [])).toBe(true)
		})

		test('should early exit when busy time starts after slot ends', () => {
			const sortedBusyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T09:00:00Z'),
					end: new Date('2024-01-15T10:00:00Z'),
				},
				{
					start: new Date('2024-01-15T13:00:00Z'),
					end: new Date('2024-01-15T14:00:00Z'),
				},
			]

			const earlySlot: TimeSlot = {
				start: new Date('2024-01-15T10:30:00Z'),
				end: new Date('2024-01-15T11:30:00Z'),
			}

			expect(isSlotAvailable(earlySlot, sortedBusyTimes)).toBe(true)
		})

		test('should handle slot exactly adjacent to busy time', () => {
			const adjacentSlot: TimeSlot = {
				start: new Date('2024-01-15T10:00:00Z'),
				end: new Date('2024-01-15T10:30:00Z'),
			}
			expect(isSlotAvailable(adjacentSlot, busyTimes)).toBe(true)
		})

		test('should handle slot with millisecond overlap', () => {
			const msOverlapSlot: TimeSlot = {
				start: new Date('2024-01-15T09:59:59.999Z'),
				end: new Date('2024-01-15T10:30:00Z'),
			}
			expect(isSlotAvailable(msOverlapSlot, busyTimes)).toBe(false)
		})

		test('should handle multiple potential overlaps', () => {
			const multiOverlapBusyTimes: BusyTime[] = [
				{
					start: new Date('2024-01-15T09:00:00Z'),
					end: new Date('2024-01-15T09:30:00Z'),
				},
				{
					start: new Date('2024-01-15T10:00:00Z'),
					end: new Date('2024-01-15T10:30:00Z'),
				},
				{
					start: new Date('2024-01-15T11:00:00Z'),
					end: new Date('2024-01-15T11:30:00Z'),
				},
			]

			const spanningSlot: TimeSlot = {
				start: new Date('2024-01-15T09:15:00Z'),
				end: new Date('2024-01-15T11:15:00Z'),
			}

			expect(isSlotAvailable(spanningSlot, multiOverlapBusyTimes)).toBe(false)
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
							.padStart(2, '0')}:${((i % 60) + 30).toString().padStart(2, '0')}:00Z`
					),
				})
			}

			const testSlot: TimeSlot = {
				start: new Date('2024-01-16T10:00:00Z'),
				end: new Date('2024-01-16T10:30:00Z'),
			}

			const startTime = performance.now()
			const result = isSlotAvailable(testSlot, manyBusyTimes)
			const endTime = performance.now()

			expect(result).toBe(true)
			expect(endTime - startTime).toBeLessThan(10) // Should complete in < 10ms
		})
	})
})
