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

	describe('Scheduler constructor behavior', () => {
		it('should create a Scheduler instance with no arguments', () => {
			const scheduler = new Scheduler()
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
		it('should export main classes', () => {
			expect(Scheduler).toBeDefined()
			expect(typeof Scheduler).toBe('function')
			expect(AvailabilityScheduler).toBeDefined()
		})
	})

	describe('AvailabilityScheduler constructor usage', () => {
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
