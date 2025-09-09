import { beforeEach, describe, expect, it } from 'bun:test'
import { Scheduler } from '../../src/core/scheduler.ts'
import type { BusyTime, SchedulingOptions } from '../../src/types/scheduling.types.ts'

describe('Scheduler', () => {
	let scheduler: Scheduler

	beforeEach(() => {
		scheduler = new Scheduler()
	})

	describe('constructor', () => {
		it('should initialize with empty busy times by default', () => {
			const emptyScheduler = new Scheduler()
			expect(emptyScheduler.getBusyTimes()).toEqual([])
		})

		it('should initialize with provided busy times', () => {
			const busyTimes: BusyTime[] = [
				{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
				{ start: new Date('2024-01-01T14:00:00Z'), end: new Date('2024-01-01T15:00:00Z') },
			]
			const newScheduler = new Scheduler(busyTimes)
			expect(newScheduler.getBusyTimes()).toEqual(busyTimes)
		})

		it('should sort busy times by start time', () => {
			const busyTimes: BusyTime[] = [
				{ start: new Date('2024-01-01T14:00:00Z'), end: new Date('2024-01-01T15:00:00Z') },
				{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
			]
			const newScheduler = new Scheduler(busyTimes)
			const sortedBusyTimes = newScheduler.getBusyTimes()
			expect(sortedBusyTimes[0].start.getTime()).toBeLessThan(sortedBusyTimes[1].start.getTime())
		})

		it('should not mutate original busy times array', () => {
			const busyTimes: BusyTime[] = [
				{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
			]
			const originalLength = busyTimes.length
			new Scheduler(busyTimes)
			expect(busyTimes.length).toBe(originalLength)
		})
	})

	describe('addBusyTime', () => {
		it('should add a single busy time', () => {
			const busyTime: BusyTime = {
				start: new Date('2024-01-01T10:00:00Z'),
				end: new Date('2024-01-01T11:00:00Z'),
			}
			scheduler.addBusyTime(busyTime)
			expect(scheduler.getBusyTimes()).toEqual([busyTime])
		})

		it('should maintain sorted order after adding a busy time', () => {
			scheduler.addBusyTime({ start: new Date('2024-01-01T14:00:00Z'), end: new Date('2024-01-01T15:00:00Z') })
			scheduler.addBusyTime({ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') })

			const busyTimes = scheduler.getBusyTimes()
			expect(busyTimes[0].start.getTime()).toBeLessThan(busyTimes[1].start.getTime())
		})
	})

	describe('addBusyTimes', () => {
		it('should add new busy times', () => {
			const busyTimes: BusyTime[] = [
				{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
			]
			scheduler.addBusyTimes(busyTimes)
			expect(scheduler.getBusyTimes()).toEqual(busyTimes)
		})

		it('should maintain sorted order after adding busy times', () => {
			scheduler.addBusyTimes([{ start: new Date('2024-01-01T14:00:00Z'), end: new Date('2024-01-01T15:00:00Z') }])
			scheduler.addBusyTimes([{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') }])

			const busyTimes = scheduler.getBusyTimes()
			expect(busyTimes[0].start.getTime()).toBeLessThan(busyTimes[1].start.getTime())
		})

		it('should handle adding multiple busy times at once', () => {
			const busyTimes: BusyTime[] = [
				{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
				{ start: new Date('2024-01-01T14:00:00Z'), end: new Date('2024-01-01T15:00:00Z') },
			]
			scheduler.addBusyTimes(busyTimes)
			expect(scheduler.getBusyTimes()).toEqual(busyTimes)
		})

		it('should handle adding empty array', () => {
			scheduler.addBusyTimes([])
			expect(scheduler.getBusyTimes()).toEqual([])
		})
	})

	describe('clearBusyTimes', () => {
		it('should clear all busy times', () => {
			scheduler.addBusyTimes([{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') }])
			scheduler.clearBusyTimes()
			expect(scheduler.getBusyTimes()).toEqual([])
		})

		it('should handle clearing empty busy times', () => {
			scheduler.clearBusyTimes()
			expect(scheduler.getBusyTimes()).toEqual([])
		})
	})

	describe('getBusyTimes', () => {
		it('should return a copy of busy times array', () => {
			const busyTimes: BusyTime[] = [
				{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
			]
			scheduler.addBusyTimes(busyTimes)

			const retrievedBusyTimes = scheduler.getBusyTimes()
			retrievedBusyTimes.push({ start: new Date('2024-01-01T14:00:00Z'), end: new Date('2024-01-01T15:00:00Z') })

			expect(scheduler.getBusyTimes().length).toBe(1)
		})
	})

	describe('findAvailableSlots', () => {
		const startTime = new Date('2024-01-01T09:00:00Z')
		const endTime = new Date('2024-01-01T17:00:00Z')
		const basicOptions: SchedulingOptions = {
			slotDuration: 60,
			slotSplit: 60,
			padding: 0,
			offset: 0,
		}

		it('should find available slots when no busy times exist', () => {
			const slots = scheduler.findAvailableSlots(startTime, endTime, basicOptions)
			expect(slots.length).toBeGreaterThan(0)
			expect(slots[0].start.getTime()).toBeGreaterThanOrEqual(startTime.getTime())
			expect(slots[slots.length - 1].end.getTime()).toBeLessThanOrEqual(endTime.getTime())
		})

		it('should exclude busy time slots', () => {
			scheduler.addBusyTimes([{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') }])

			const slots = scheduler.findAvailableSlots(startTime, endTime, basicOptions)

			// Verify no slot conflicts with busy time
			slots.forEach(slot => {
				expect(
					slot.end.getTime() <= new Date('2024-01-01T10:00:00Z').getTime() ||
						slot.start.getTime() >= new Date('2024-01-01T11:00:00Z').getTime()
				).toBe(true)
			})
		})

		it('should handle multiple busy times', () => {
			scheduler.addBusyTimes([
				{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
				{ start: new Date('2024-01-01T14:00:00Z'), end: new Date('2024-01-01T15:00:00Z') },
			])

			const slots = scheduler.findAvailableSlots(startTime, endTime, basicOptions)

			// Verify slots don't conflict with any busy time
			slots.forEach(slot => {
				expect(
					(slot.end.getTime() <= new Date('2024-01-01T10:00:00Z').getTime() ||
						slot.start.getTime() >= new Date('2024-01-01T11:00:00Z').getTime()) &&
						(slot.end.getTime() <= new Date('2024-01-01T14:00:00Z').getTime() ||
							slot.start.getTime() >= new Date('2024-01-01T15:00:00Z').getTime())
				).toBe(true)
			})
		})

		it('should apply padding to busy times', () => {
			scheduler.addBusyTimes([{ start: new Date('2024-01-01T12:00:00Z'), end: new Date('2024-01-01T13:00:00Z') }])

			const optionsWithPadding: SchedulingOptions = {
				...basicOptions,
				padding: 30, // 30 minutes padding
			}

			const slots = scheduler.findAvailableSlots(startTime, endTime, optionsWithPadding)

			// Verify slots respect padding (busy time + padding on both sides)
			slots.forEach(slot => {
				expect(
					slot.end.getTime() <= new Date('2024-01-01T11:30:00Z').getTime() ||
						slot.start.getTime() >= new Date('2024-01-01T13:30:00Z').getTime()
				).toBe(true)
			})
		})

		it('should handle different slot durations', () => {
			const thirtyMinOptions: SchedulingOptions = {
				slotDuration: 30,
				slotSplit: 30,
				padding: 0,
				offset: 0,
			}

			const slots = scheduler.findAvailableSlots(startTime, endTime, thirtyMinOptions)

			// Verify all slots have correct duration
			slots.forEach(slot => {
				expect(slot.end.getTime() - slot.start.getTime()).toBe(30 * 60 * 1000) // 30 minutes in ms
			})
		})

		it('should handle slot splits different from duration', () => {
			const overlappingOptions: SchedulingOptions = {
				slotDuration: 60,
				slotSplit: 30, // 30-minute intervals with 60-minute slots
				padding: 0,
				offset: 0,
			}

			const slots = scheduler.findAvailableSlots(startTime, endTime, overlappingOptions)

			// Verify slots have correct duration
			slots.forEach(slot => {
				expect(slot.end.getTime() - slot.start.getTime()).toBe(60 * 60 * 1000) // 60 minutes in ms
			})

			// Verify slots are spaced 30 minutes apart
			if (slots.length > 1) {
				expect(slots[1].start.getTime() - slots[0].start.getTime()).toBe(30 * 60 * 1000)
			}
		})

		it('should handle offset correctly', () => {
			const offsetOptions: SchedulingOptions = {
				slotDuration: 60,
				slotSplit: 60,
				padding: 0,
				offset: 15, // 15-minute offset
			}

			const slots = scheduler.findAvailableSlots(startTime, endTime, offsetOptions)

			// First slot should start with offset considered
			if (slots.length > 0) {
				const firstSlotMinutes = slots[0].start.getMinutes()
				expect(firstSlotMinutes % 60).toBe(15) // Should align to 15-minute offset
			}
		})

		it('should validate input parameters', () => {
			const invalidTimeRange = () => {
				scheduler.findAvailableSlots(endTime, startTime, basicOptions) // Invalid: end before start
			}

			expect(invalidTimeRange).toThrow()
		})

		it('should validate options', () => {
			const invalidOptions = () => {
				scheduler.findAvailableSlots(startTime, endTime, {
					slotDuration: -30, // Invalid negative duration
					slotSplit: 60,
					padding: 0,
					offset: 0,
				})
			}

			expect(invalidOptions).toThrow()
		})

		it('should return empty array when no slots fit', () => {
			const veryShortTimeRange = new Date('2024-01-01T09:00:00Z')
			const veryShortEndTime = new Date('2024-01-01T09:01:00Z') // Only 1 minute

			const slots = scheduler.findAvailableSlots(veryShortTimeRange, veryShortEndTime, basicOptions)
			expect(slots).toEqual([])
		})

		it('should handle overlapping busy times correctly', () => {
			scheduler.addBusyTimes([
				{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T12:00:00Z') },
				{ start: new Date('2024-01-01T11:00:00Z'), end: new Date('2024-01-01T13:00:00Z') }, // Overlapping
			])

			const slots = scheduler.findAvailableSlots(startTime, endTime, basicOptions)

			// Should merge overlapping busy times and exclude the entire 10:00-13:00 period
			slots.forEach(slot => {
				expect(
					slot.end.getTime() <= new Date('2024-01-01T10:00:00Z').getTime() ||
						slot.start.getTime() >= new Date('2024-01-01T13:00:00Z').getTime()
				).toBe(true)
			})
		})
	})

	describe('integration scenarios', () => {
		it('should handle a typical work day scheduling scenario', () => {
			// Set up a typical work day with lunch and meetings
			scheduler.addBusyTimes([
				{ start: new Date('2024-01-01T12:00:00Z'), end: new Date('2024-01-01T13:00:00Z') }, // Lunch
				{ start: new Date('2024-01-01T14:00:00Z'), end: new Date('2024-01-01T15:30:00Z') }, // Meeting
				{ start: new Date('2024-01-01T16:00:00Z'), end: new Date('2024-01-01T16:30:00Z') }, // Another meeting
			])

			const workDayStart = new Date('2024-01-01T09:00:00Z')
			const workDayEnd = new Date('2024-01-01T17:00:00Z')
			const options: SchedulingOptions = {
				slotDuration: 60,
				slotSplit: 60,
				padding: 15,
				offset: 0,
			}

			const slots = scheduler.findAvailableSlots(workDayStart, workDayEnd, options)

			// Should have slots in morning (9:00-11:45), afternoon (13:15-13:45), and late afternoon (16:45-17:00)
			expect(slots.length).toBeGreaterThan(0)

			// Verify no conflicts with padded busy times
			slots.forEach(slot => {
				expect(
					(slot.end.getTime() <= new Date('2024-01-01T11:45:00Z').getTime() ||
						slot.start.getTime() >= new Date('2024-01-01T13:15:00Z').getTime()) &&
						(slot.end.getTime() <= new Date('2024-01-01T13:45:00Z').getTime() ||
							slot.start.getTime() >= new Date('2024-01-01T15:45:00Z').getTime()) &&
						(slot.end.getTime() <= new Date('2024-01-01T15:45:00Z').getTime() ||
							slot.start.getTime() >= new Date('2024-01-01T16:45:00Z').getTime())
				).toBe(true)
			})
		})
	})

	describe('maxOverlaps functionality', () => {
		beforeEach(() => {
			scheduler = new Scheduler()
		})

		it('should work with K=0 (traditional behavior)', () => {
			scheduler.addBusyTimes([
				{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
				{ start: new Date('2024-01-01T10:30:00Z'), end: new Date('2024-01-01T11:30:00Z') },
			])

			const startTime = new Date('2024-01-01T09:00:00Z')
			const endTime = new Date('2024-01-01T13:00:00Z')

			const slots = scheduler.findAvailableSlots(startTime, endTime, {
				slotDuration: 60,
				maxOverlaps: 0,
			})

			// Should exclude overlapping period 10:00-11:30
			slots.forEach(slot => {
				expect(
					slot.end.getTime() <= new Date('2024-01-01T10:00:00Z').getTime() ||
						slot.start.getTime() >= new Date('2024-01-01T11:30:00Z').getTime()
				).toBe(true)
			})
		})

		it('should allow single overlap with K=1', () => {
			scheduler.addBusyTimes([
				{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
				{ start: new Date('2024-01-01T10:30:00Z'), end: new Date('2024-01-01T11:30:00Z') },
			])

			const startTime = new Date('2024-01-01T09:00:00Z')
			const endTime = new Date('2024-01-01T13:00:00Z')

			const slots = scheduler.findAvailableSlots(startTime, endTime, {
				slotDuration: 60,
				maxOverlaps: 1,
			})

			// Should allow slots throughout the period since only 2 intervals overlap at most
			expect(slots.length).toBeGreaterThan(3) // Should have slots across entire period

			// Check that we have slots in previously "blocked" time
			const hasSlotInOverlap = slots.some(
				slot =>
					slot.start.getTime() >= new Date('2024-01-01T10:00:00Z').getTime() &&
					slot.end.getTime() <= new Date('2024-01-01T11:30:00Z').getTime()
			)
			expect(hasSlotInOverlap).toBe(true)
		})

		it('should handle multiple overlaps correctly', () => {
			scheduler.addBusyTimes([
				{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T12:00:00Z') },
				{ start: new Date('2024-01-01T10:30:00Z'), end: new Date('2024-01-01T11:30:00Z') },
				{ start: new Date('2024-01-01T10:45:00Z'), end: new Date('2024-01-01T11:15:00Z') },
			])

			const startTime = new Date('2024-01-01T09:00:00Z')
			const endTime = new Date('2024-01-01T13:00:00Z')

			// K=2: allow up to 2 overlaps (busy when ≥3)
			const slots = scheduler.findAvailableSlots(startTime, endTime, {
				slotDuration: 30,
				maxOverlaps: 2,
			})

			// Period 10:45-11:15 has 3 overlaps, so should be excluded
			// But periods with ≤2 overlaps should be available
			const hasSlotInTripleOverlap = slots.some(
				slot =>
					slot.start.getTime() >= new Date('2024-01-01T10:45:00Z').getTime() &&
					slot.end.getTime() <= new Date('2024-01-01T11:15:00Z').getTime()
			)
			expect(hasSlotInTripleOverlap).toBe(false)

			// Should have slots in areas with ≤2 overlaps
			expect(slots.length).toBeGreaterThan(0)
		})

		it('should integrate with slot generation options', () => {
			scheduler.addBusyTimes([{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') }])

			const startTime = new Date('2024-01-01T09:00:00Z')
			const endTime = new Date('2024-01-01T13:00:00Z')

			const slots = scheduler.findAvailableSlots(startTime, endTime, {
				slotDuration: 30,
				slotSplit: 15,
				offset: 5,
				maxOverlaps: 0,
			})

			// Should respect offset
			slots.forEach(slot => {
				const minutes = slot.start.getUTCMinutes()
				expect(minutes % 15).toBe(5) // 5-minute offset with 15-minute split
			})

			// Should respect duration
			slots.forEach(slot => {
				expect(slot.end.getTime() - slot.start.getTime()).toBe(30 * 60 * 1000)
			})
		})

		it('should work with padding and maxOverlaps', () => {
			scheduler.addBusyTimes([{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') }])

			const startTime = new Date('2024-01-01T09:00:00Z')
			const endTime = new Date('2024-01-01T13:00:00Z')

			const slots = scheduler.findAvailableSlots(startTime, endTime, {
				slotDuration: 60,
				padding: 15,
				maxOverlaps: 0,
			})

			// Should respect padding: exclude 09:45-11:15 (15min before/after busy time)
			slots.forEach(slot => {
				expect(
					slot.end.getTime() <= new Date('2024-01-01T09:45:00Z').getTime() ||
						slot.start.getTime() >= new Date('2024-01-01T11:15:00Z').getTime()
				).toBe(true)
			})
		})

		it('should fall back to traditional behavior when maxOverlaps is undefined', () => {
			scheduler.addBusyTimes([{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') }])

			const startTime = new Date('2024-01-01T09:00:00Z')
			const endTime = new Date('2024-01-01T13:00:00Z')

			const slotsTraditional = scheduler.findAvailableSlots(startTime, endTime, {
				slotDuration: 60,
			})

			const slotsK0 = scheduler.findAvailableSlots(startTime, endTime, {
				slotDuration: 60,
				maxOverlaps: 0,
			})

			// Should behave the same
			expect(slotsTraditional.length).toBe(slotsK0.length)
		})
	})

	describe('daily window and timezone filtering (core scheduler)', () => {
		it('filters slots by earliest/latest within timezone in traditional path', () => {
			const start = new Date('2024-01-15T00:00:00Z')
			const end = new Date('2024-01-15T23:59:59Z')

			const slots = scheduler.findAvailableSlots(start, end, {
				slotDuration: 60,
				slotSplit: 60,
				timezone: 'America/New_York',
				earliestTime: '09:00',
				latestTime: '17:00',
			})

			// In Jan, New York is UTC-5, so window is 14:00 - 22:00 UTC
			expect(slots.length).toBeGreaterThan(0)
			slots.forEach(slot => {
				const h = slot.start.getUTCHours()
				expect(h).toBeGreaterThanOrEqual(14)
				expect(h).toBeLessThan(22)
			})
		})

		it('filters slots by earliest/latest within timezone in K-overlaps path', () => {
			const start = new Date('2024-01-15T00:00:00Z')
			const end = new Date('2024-01-15T23:59:59Z')

			const slots = scheduler.findAvailableSlots(start, end, {
				slotDuration: 60,
				maxOverlaps: 0, // force K-overlaps path
				timezone: 'America/New_York',
				earliestTime: 9 * 60,
				latestTime: 17 * 60,
			})

			// Expect same 14:00 - 22:00 UTC start times
			expect(slots.length).toBeGreaterThan(0)
			slots.forEach(slot => {
				const h = slot.start.getUTCHours()
				expect(h).toBeGreaterThanOrEqual(14)
				expect(h).toBeLessThan(22)
			})
		})

		it('throws when earliest/latest provided without timezone', () => {
			const start = new Date('2024-01-15T00:00:00Z')
			const end = new Date('2024-01-15T23:59:59Z')

			expect(() =>
				scheduler.findAvailableSlots(start, end, {
					slotDuration: 60,
					earliestTime: '09:00',
				})
			).toThrow('Timezone must be specified when using earliestTime/latestTime')
		})
	})
})
