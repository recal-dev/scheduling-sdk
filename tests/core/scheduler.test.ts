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
})
