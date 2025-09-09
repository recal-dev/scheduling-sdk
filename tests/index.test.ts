import { describe, expect, it } from 'bun:test'
import {
	AvailabilityScheduler,
	type BusyTime,
	Scheduler,
	type SchedulingOptions,
	type TimeSlot,
	type WeeklyAvailability,
} from '../src/index.ts'

describe('Index Exports', () => {
	describe('type exports', () => {
		it('should export TimeSlot type', () => {
			const timeSlot: TimeSlot = {
				start: new Date('2024-01-01T10:00:00Z'),
				end: new Date('2024-01-01T11:00:00Z'),
			}
			expect(timeSlot.start).toBeInstanceOf(Date)
			expect(timeSlot.end).toBeInstanceOf(Date)
		})

		it('should export BusyTime type', () => {
			const busyTime: BusyTime = {
				start: new Date('2024-01-01T10:00:00Z'),
				end: new Date('2024-01-01T11:00:00Z'),
			}
			expect(busyTime.start).toBeInstanceOf(Date)
			expect(busyTime.end).toBeInstanceOf(Date)
		})

		it('should export SchedulingOptions type', () => {
			const options: SchedulingOptions = {
				slotDuration: 60,
				slotSplit: 30,
				padding: 15,
				offset: 10,
			}
			expect(typeof options.slotDuration).toBe('number')
		})
	})

	describe('Scheduler class export', () => {
		it('should export Scheduler class', () => {
			expect(Scheduler).toBeDefined()
			expect(typeof Scheduler).toBe('function')
		})

		it('should create Scheduler instances', () => {
			const scheduler = new Scheduler()
			expect(scheduler).toBeInstanceOf(Scheduler)
			expect(typeof scheduler.findAvailableSlots).toBe('function')
			expect(typeof scheduler.addBusyTimes).toBe('function')
			expect(typeof scheduler.clearBusyTimes).toBe('function')
			expect(typeof scheduler.getBusyTimes).toBe('function')
		})
	})

	describe('Scheduler instantiation (as per README)', () => {
		it('should create a Scheduler instance with no arguments', () => {
			const scheduler = new Scheduler()
			expect(scheduler).toBeInstanceOf(Scheduler)
			expect(scheduler.getBusyTimes()).toEqual([])
		})

		it('should create a Scheduler instance with empty busy times', () => {
			const scheduler = new Scheduler([])
			expect(scheduler).toBeInstanceOf(Scheduler)
			expect(scheduler.getBusyTimes()).toEqual([])
		})

		it('should create a Scheduler instance with provided busy times', () => {
			const busyTimes: BusyTime[] = [
				{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
				{ start: new Date('2024-01-01T14:00:00Z'), end: new Date('2024-01-01T15:00:00Z') },
			]

			const scheduler = new Scheduler(busyTimes)
			expect(scheduler).toBeInstanceOf(Scheduler)
			expect(scheduler.getBusyTimes()).toEqual(busyTimes)
		})

		it('should create a functional scheduler instance', () => {
			const busyTimes: BusyTime[] = [
				{ start: new Date('2024-01-01T12:00:00Z'), end: new Date('2024-01-01T13:00:00Z') },
			]

			const scheduler = new Scheduler(busyTimes)

			const startTime = new Date('2024-01-01T09:00:00Z')
			const endTime = new Date('2024-01-01T17:00:00Z')
			const options: SchedulingOptions = {
				slotDuration: 60,
				slotSplit: 60,
				padding: 0,
				offset: 0,
			}

			const slots = scheduler.findAvailableSlots(startTime, endTime, options)
			expect(Array.isArray(slots)).toBe(true)
			expect(slots.length).toBeGreaterThan(0)

			// Verify slots don't conflict with busy time
			slots.forEach(slot => {
				expect(
					slot.end.getTime() <= new Date('2024-01-01T12:00:00Z').getTime() ||
						slot.start.getTime() >= new Date('2024-01-01T13:00:00Z').getTime()
				).toBe(true)
			})
		})

		it('should return different instances on multiple calls', () => {
			const scheduler1 = new Scheduler()
			const scheduler2 = new Scheduler()

			expect(scheduler1).not.toBe(scheduler2)
			expect(scheduler1).toBeInstanceOf(Scheduler)
			expect(scheduler2).toBeInstanceOf(Scheduler)
		})

		it('should not share state between instances', () => {
			const scheduler1 = new Scheduler()
			const scheduler2 = new Scheduler()

			const busyTime: BusyTime = {
				start: new Date('2024-01-01T10:00:00Z'),
				end: new Date('2024-01-01T11:00:00Z'),
			}

			scheduler1.addBusyTimes([busyTime])

			expect(scheduler1.getBusyTimes()).toEqual([busyTime])
			expect(scheduler2.getBusyTimes()).toEqual([])
		})
	})

	describe('integration with exported functionality', () => {
		it('should work with all exported components together', () => {
			// Create scheduler using direct instantiation (as per README)
			const busyTimes: BusyTime[] = [
				{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
				{ start: new Date('2024-01-01T14:00:00Z'), end: new Date('2024-01-01T15:00:00Z') },
			]

			const scheduler = new Scheduler(busyTimes)

			// Define scheduling parameters using exported types
			const startTime = new Date('2024-01-01T09:00:00Z')
			const endTime = new Date('2024-01-01T17:00:00Z')
			const options: SchedulingOptions = {
				slotDuration: 60,
				slotSplit: 60,
				padding: 15,
				offset: 0,
			}

			// Find available slots
			const slots: TimeSlot[] = scheduler.findAvailableSlots(startTime, endTime, options)

			// Verify result structure
			expect(Array.isArray(slots)).toBe(true)
			slots.forEach(slot => {
				expect(slot).toHaveProperty('start')
				expect(slot).toHaveProperty('end')
				expect(slot.start).toBeInstanceOf(Date)
				expect(slot.end).toBeInstanceOf(Date)
			})

			// Add more busy times and verify functionality
			const newBusyTime: BusyTime = {
				start: new Date('2024-01-01T16:00:00Z'),
				end: new Date('2024-01-01T16:30:00Z'),
			}

			scheduler.addBusyTimes([newBusyTime])
			expect(scheduler.getBusyTimes().length).toBe(3)

			// Find slots again with updated busy times
			const updatedSlots = scheduler.findAvailableSlots(startTime, endTime, options)
			expect(Array.isArray(updatedSlots)).toBe(true)
		})
	})

	describe('API surface validation', () => {
		it('should export all expected components', () => {
			// Verify all main exports are present
			expect(Scheduler).toBeDefined()
			expect(AvailabilityScheduler).toBeDefined()
			expect(typeof Scheduler).toBe('function')
			expect(typeof AvailabilityScheduler).toBe('function')
		})

		it('should maintain consistent API for Scheduler', () => {
			const scheduler1 = new Scheduler()
			const scheduler2 = new Scheduler()

			// Both should have the same methods
			expect(typeof scheduler1.findAvailableSlots).toBe('function')
			expect(typeof scheduler2.findAvailableSlots).toBe('function')

			expect(typeof scheduler1.addBusyTimes).toBe('function')
			expect(typeof scheduler2.addBusyTimes).toBe('function')

			expect(typeof scheduler1.clearBusyTimes).toBe('function')
			expect(typeof scheduler2.clearBusyTimes).toBe('function')

			expect(typeof scheduler1.getBusyTimes).toBe('function')
			expect(typeof scheduler2.getBusyTimes).toBe('function')
		})
	})

	describe('AvailabilityScheduler instantiation (as per README)', () => {
		it('should create an AvailabilityScheduler instance', () => {
			const availability: WeeklyAvailability = {
				schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
			}
			const scheduler = new AvailabilityScheduler(availability, 'America/New_York')
			expect(scheduler).toBeInstanceOf(AvailabilityScheduler)
			expect(scheduler.getAvailability()).toEqual(availability)
		})

		it('should work with number-based time in availability', () => {
			const availability: WeeklyAvailability = {
				schedules: [{ days: ['tuesday'], start: 540, end: 1020 }], // 9:00 (540 min) to 17:00 (1020 min)
			}
			const scheduler = new AvailabilityScheduler(availability, 'UTC')
			const slots = scheduler.findAvailableSlots(
				new Date('2024-01-02T08:00:00Z'), // Tuesday
				new Date('2024-01-02T18:00:00Z'),
				{ slotDuration: 60 }
			)
			expect(slots.length).toBe(8) // 8 hourly slots from 9-17
			expect(slots[0]!.start.getUTCHours()).toBe(9)
		})

		it('should handle timezone correctly', () => {
			const availability: WeeklyAvailability = {
				schedules: [{ days: ['monday'], start: '09:00', end: '10:00' }],
			}
			const scheduler = new AvailabilityScheduler(availability, 'America/New_York')
			const slots = scheduler.findAvailableSlots(
				new Date('2024-01-15T00:00:00Z'), // Monday UTC
				new Date('2024-01-15T23:59:00Z'),
				{ slotDuration: 60 }
			)
			// 9 AM EST = 14:00 UTC
			expect(slots[0]!.start.getUTCHours()).toBe(14)
		})
	})
})
