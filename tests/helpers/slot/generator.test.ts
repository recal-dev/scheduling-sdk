import { describe, expect, test } from 'bun:test'
import { calculateFirstSlotStart, generateSlots } from '../../../src/helpers/slot/generator.ts'

describe('Slot Generator Helper', () => {
	const startTime = new Date('2024-01-15T09:00:00Z')
	const endTime = new Date('2024-01-15T17:00:00Z')

	describe('generateSlots', () => {
		test('should generate non-overlapping 30-minute slots', () => {
			const slots = generateSlots(startTime, endTime, { slotDurationMinutes: 30 })

			expect(slots.length).toBeGreaterThan(0)

			// Check first slot
			expect(slots[0]!.start.getTime()).toBe(startTime.getTime())
			expect(slots[0]!.end.getTime()).toBe(new Date('2024-01-15T09:30:00Z').getTime())

			// Check duration consistency
			slots.forEach(slot => {
				const durationMs = slot.end.getTime() - slot.start.getTime()
				expect(durationMs).toBe(30 * 60 * 1000)
			})

			// Check non-overlapping (adjacent)
			for (let i = 1; i < slots.length; i++) {
				expect(slots[i]!.start.getTime()).toBe(slots[i - 1]!.end.getTime())
			}
		})

		test('should generate overlapping slots with split smaller than duration', () => {
			const slots = generateSlots(startTime, endTime, { slotDurationMinutes: 30, slotSplitMinutes: 15 })

			expect(slots.length).toBeGreaterThan(0)

			// Check that slots overlap
			expect(slots[1]!.start.getTime()).toBe(new Date('2024-01-15T09:15:00Z').getTime())
			expect(slots[1]!.end.getTime()).toBe(new Date('2024-01-15T09:45:00Z').getTime())

			// Check overlapping pattern
			for (let i = 1; i < Math.min(slots.length, 5); i++) {
				const expectedStart = startTime.getTime() + i * 15 * 60 * 1000
				expect(slots[i]!.start.getTime()).toBe(expectedStart)
			}
		})

		test('should handle zero offset', () => {
			const slots = generateSlots(startTime, endTime, {
				slotDurationMinutes: 60,
				slotSplitMinutes: 60,
				offsetMinutes: 0,
			})

			expect(slots[0]!.start.getTime()).toBe(startTime.getTime())
			expect(slots[0]!.end.getTime()).toBe(new Date('2024-01-15T10:00:00Z').getTime())
		})

		test('should apply offset correctly', () => {
			const slots = generateSlots(
				new Date('2024-01-15T09:00:00Z'),
				new Date('2024-01-15T12:00:00Z'),
				{ slotDurationMinutes: 30, slotSplitMinutes: 30, offsetMinutes: 15 } // 15-minute offset
			)

			expect(slots.length).toBeGreaterThan(0)

			// With 15-minute offset, first slot should start at 09:15
			expect(slots[0]!.start.getMinutes()).toBe(15)
			expect(slots[0]!.end.getMinutes()).toBe(45)
		})

		test('should handle time range smaller than slot duration', () => {
			const shortEndTime = new Date('2024-01-15T09:15:00Z')
			const slots = generateSlots(startTime, shortEndTime, { slotDurationMinutes: 30 })

			expect(slots).toHaveLength(0)
		})

		test('should handle time range exactly equal to slot duration', () => {
			const exactEndTime = new Date('2024-01-15T09:30:00Z')
			const slots = generateSlots(startTime, exactEndTime, { slotDurationMinutes: 30 })

			expect(slots).toHaveLength(1)
			expect(slots[0]!.start.getTime()).toBe(startTime.getTime())
			expect(slots[0]!.end.getTime()).toBe(exactEndTime.getTime())
		})

		test('should handle non-standard durations', () => {
			const slots = generateSlots(startTime, endTime, { slotDurationMinutes: 23 }) // 23-minute slots

			expect(slots.length).toBeGreaterThan(0)

			slots.forEach(slot => {
				const durationMs = slot.end.getTime() - slot.start.getTime()
				expect(durationMs).toBe(23 * 60 * 1000)
			})
		})

		test('should handle split larger than duration', () => {
			const slots = generateSlots(startTime, endTime, { slotDurationMinutes: 30, slotSplitMinutes: 45 })

			expect(slots.length).toBeGreaterThan(0)

			// Slots should have gaps between them
			for (let i = 1; i < Math.min(slots.length, 3); i++) {
				const gapMs = slots[i]!.start.getTime() - slots[i - 1]!.end.getTime()
				expect(gapMs).toBe(15 * 60 * 1000) // 45min split - 30min duration = 15min gap
			}
		})

		test('should handle cross-day boundary generation', () => {
			const lateStart = new Date('2024-01-15T23:30:00Z')
			const earlyEnd = new Date('2024-01-16T01:30:00Z')
			const slots = generateSlots(lateStart, earlyEnd, { slotDurationMinutes: 60 })

			expect(slots.length).toBe(2)
			expect(slots[0]!.start.getTime()).toBe(lateStart.getTime())
			expect(slots[0]!.end.getTime()).toBe(new Date('2024-01-16T00:30:00Z').getTime())
			expect(slots[1]!.start.getTime()).toBe(new Date('2024-01-16T00:30:00Z').getTime())
			expect(slots[1]!.end.getTime()).toBe(new Date('2024-01-16T01:30:00Z').getTime())
		})

		test('should handle default parameters correctly', () => {
			// Test with only required parameters (split should default to duration)
			const slots = generateSlots(startTime, endTime, { slotDurationMinutes: 60 })

			// Should behave same as non-overlapping slots
			for (let i = 1; i < Math.min(slots.length, 3); i++) {
				expect(slots[i]!.start.getTime()).toBe(slots[i - 1]!.end.getTime())
			}
		})

		test('should handle very large time ranges', () => {
			const largeEndTime = new Date('2024-01-20T09:00:00Z') // 5 days later
			const slots = generateSlots(startTime, largeEndTime, { slotDurationMinutes: 60 })

			expect(slots.length).toBe(120) // 5 days * 24 hours = 120 hourly slots
		})

		test('should handle fractional minutes', () => {
			const slots = generateSlots(startTime, endTime, { slotDurationMinutes: 7.5, slotSplitMinutes: 7.5 }) // 7.5-minute slots

			expect(slots.length).toBeGreaterThan(0)

			slots.forEach(slot => {
				const durationMs = slot.end.getTime() - slot.start.getTime()
				expect(durationMs).toBe(7.5 * 60 * 1000)
			})
		})

		test('should handle very small durations', () => {
			const slots = generateSlots(startTime, new Date('2024-01-15T09:05:00Z'), { slotDurationMinutes: 1 }) // 1-minute slots

			expect(slots).toHaveLength(5)

			slots.forEach(slot => {
				const durationMs = slot.end.getTime() - slot.start.getTime()
				expect(durationMs).toBe(60 * 1000)
			})
		})
	})

	describe('calculateFirstSlotStart', () => {
		test('should return aligned time for zero offset', () => {
			const result = calculateFirstSlotStart(new Date('2024-01-15T09:23:00Z'), 30, 0)

			expect(result.getMinutes()).toBe(30)
		})

		test('should calculate first slot with offset', () => {
			const result = calculateFirstSlotStart(new Date('2024-01-15T09:00:00Z'), 30, 15)

			expect(result.getMinutes()).toBe(15)
		})

		test('should move to next boundary if aligned time is before start', () => {
			const result = calculateFirstSlotStart(new Date('2024-01-15T09:20:00Z'), 30, 15)

			expect(result.getMinutes()).toBe(45)
		})

		test('should handle hour boundary crossing', () => {
			const result = calculateFirstSlotStart(new Date('2024-01-15T09:50:00Z'), 15, 5)

			// 09:50 with 15-minute intervals and 5-minute offset is already aligned
			// Pattern: 05, 20, 35, 50 minutes past each hour
			// So 09:50 should stay at 09:50
			expect(result.getUTCHours()).toBe(9)
			expect(result.getUTCMinutes()).toBe(50)
		})

		test('should handle already aligned time', () => {
			const alignedTime = new Date('2024-01-15T09:15:00Z')
			const result = calculateFirstSlotStart(alignedTime, 15, 15)

			expect(result.getTime()).toBe(alignedTime.getTime())
		})
	})

	// Edge case and performance tests
	describe('Edge Cases and Performance', () => {
		test('should handle leap year day', () => {
			const leapStart = new Date('2024-02-29T09:00:00Z')
			const leapEnd = new Date('2024-02-29T17:00:00Z')
			const slots = generateSlots(leapStart, leapEnd, { slotDurationMinutes: 60 })

			expect(slots.length).toBe(8)
			slots.forEach(slot => {
				expect(slot.start.getDate()).toBe(29)
				expect(slot.start.getMonth()).toBe(1) // February
			})
		})

		test('should generate large number of slots efficiently', () => {
			const longEndTime = new Date('2024-01-20T09:00:00Z') // 5 days

			const startTime = performance.now()
			const slots = generateSlots(
				new Date('2024-01-15T09:00:00Z'),
				longEndTime,
				{ slotDurationMinutes: 5, slotSplitMinutes: 5 } // 5-minute slots
			)
			const endTime = performance.now()

			expect(slots.length).toBe(1440) // 5 days * 24 hours * 12 slots per hour
			expect(endTime - startTime).toBeLessThan(20) // Should complete in < 20ms
		})

		test('should handle slot boundaries at exact milliseconds', () => {
			const preciseStart = new Date('2024-01-15T09:00:00.123Z')
			const preciseEnd = new Date('2024-01-15T10:00:00.123Z')
			const slots = generateSlots(preciseStart, preciseEnd, { slotDurationMinutes: 30 })

			expect(slots).toHaveLength(2)
			expect(slots[0]!.start.getMilliseconds()).toBe(123)
			expect(slots[0]!.end.getMilliseconds()).toBe(123)
		})
	})
})
