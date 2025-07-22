import { describe, expect, test } from 'bun:test'
import { AvailabilityScheduler } from '../../src/availability/scheduler.ts'
import type { BusyTime, WeeklyAvailability } from '../../src/index.ts'

describe('AvailabilityScheduler', () => {
	const mockAvailability: WeeklyAvailability = {
		schedules: [
			{ days: ['monday', 'wednesday', 'friday'], start: '09:00', end: '17:00' },
			{ days: ['tuesday', 'thursday'], start: '10:00', end: '16:00' },
			{ days: ['saturday'], start: '09:00', end: '12:00' },
		],
	}

	test('constructor with no availability', () => {
		const scheduler = new AvailabilityScheduler()
		expect(scheduler.getAvailability()).toBeUndefined()
	})

	test('constructor with availability', () => {
		const scheduler = new AvailabilityScheduler(mockAvailability)
		expect(scheduler.getAvailability()).toEqual(mockAvailability)
	})

	test('constructor with existing busy times', () => {
		const busyTimes: BusyTime[] = [
			{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
		]
		const scheduler = new AvailabilityScheduler(undefined, busyTimes)
		expect(scheduler.getBusyTimes()).toEqual(busyTimes)
	})

	test('setAvailability', () => {
		const scheduler = new AvailabilityScheduler()
		scheduler.setAvailability(mockAvailability)
		expect(scheduler.getAvailability()).toEqual(mockAvailability)
	})

	test('addBusyTime', () => {
		const scheduler = new AvailabilityScheduler()
		const busyTime: BusyTime = {
			start: new Date('2024-01-01T10:00:00Z'),
			end: new Date('2024-01-01T11:00:00Z'),
		}
		scheduler.addBusyTime(busyTime)
		expect(scheduler.getBusyTimes()).toContain(busyTime)
	})

	test('addBusyTimes', () => {
		const scheduler = new AvailabilityScheduler()
		const busyTimes: BusyTime[] = [
			{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
			{ start: new Date('2024-01-01T14:00:00Z'), end: new Date('2024-01-01T15:00:00Z') },
		]
		scheduler.addBusyTimes(busyTimes)
		expect(scheduler.getBusyTimes()).toEqual(busyTimes)
	})

	test('clearBusyTimes', () => {
		const scheduler = new AvailabilityScheduler()
		const busyTime: BusyTime = {
			start: new Date('2024-01-01T10:00:00Z'),
			end: new Date('2024-01-01T11:00:00Z'),
		}
		scheduler.addBusyTime(busyTime)
		scheduler.clearBusyTimes()
		expect(scheduler.getBusyTimes()).toEqual([])
	})

	test('findAvailableSlots without availability (delegates to base scheduler)', () => {
		const scheduler = new AvailabilityScheduler()
		const startTime = new Date('2024-01-01T09:00:00Z')
		const endTime = new Date('2024-01-01T17:00:00Z')

		const slots = scheduler.findAvailableSlots(startTime, endTime, {
			slotDuration: 60,
			slotSplit: 60,
		})

		expect(slots).toHaveLength(8)
		expect(slots[0]!.start).toEqual(startTime)
		expect(slots[7]!.end).toEqual(endTime)
	})

	test('findAvailableSlots with availability on Monday (available day)', () => {
		const scheduler = new AvailabilityScheduler(mockAvailability)
		// Monday 2024-01-01 (available 9-17)
		const startTime = new Date('2024-01-01T08:00:00Z')
		const endTime = new Date('2024-01-01T18:00:00Z')

		const slots = scheduler.findAvailableSlots(startTime, endTime, {
			slotDuration: 60,
			slotSplit: 60,
		})

		// Should only get slots during available hours (9-17)
		expect(slots).toHaveLength(8)
		expect(slots[0]!.start).toEqual(new Date('2024-01-01T09:00:00Z'))
		expect(slots[7]!.end).toEqual(new Date('2024-01-01T17:00:00Z'))
	})

	test('findAvailableSlots with availability on Sunday (unavailable day)', () => {
		const scheduler = new AvailabilityScheduler(mockAvailability)
		// Sunday 2024-01-07 (not in availability)
		const startTime = new Date('2024-01-07T09:00:00Z')
		const endTime = new Date('2024-01-07T17:00:00Z')

		const slots = scheduler.findAvailableSlots(startTime, endTime, {
			slotDuration: 60,
			slotSplit: 60,
		})

		// No slots should be available
		expect(slots).toHaveLength(0)
	})

	test('findAvailableSlots with availability and additional busy times', () => {
		const scheduler = new AvailabilityScheduler(mockAvailability)
		scheduler.addBusyTime({
			start: new Date('2024-01-01T10:00:00Z'),
			end: new Date('2024-01-01T11:00:00Z'),
		})

		// Monday 2024-01-01 (available 9-17, but busy 10-11)
		const startTime = new Date('2024-01-01T09:00:00Z')
		const endTime = new Date('2024-01-01T17:00:00Z')

		const slots = scheduler.findAvailableSlots(startTime, endTime, {
			slotDuration: 60,
			slotSplit: 60,
		})

		// Should get 7 slots (8 original minus 1 busy hour)
		expect(slots).toHaveLength(7)
		expect(slots[0]!.start).toEqual(new Date('2024-01-01T09:00:00Z'))
		expect(slots[0]!.end).toEqual(new Date('2024-01-01T10:00:00Z'))
		expect(slots[1]!.start).toEqual(new Date('2024-01-01T11:00:00Z'))
	})

	test('findAvailableSlots across multiple days', () => {
		const scheduler = new AvailabilityScheduler(mockAvailability)
		// Monday to Tuesday (Mon: 9-17, Tue: 10-16)
		const startTime = new Date('2024-01-01T09:00:00Z')
		const endTime = new Date('2024-01-02T16:00:00Z')

		const slots = scheduler.findAvailableSlots(startTime, endTime, {
			slotDuration: 60,
			slotSplit: 60,
		})

		// Monday: 8 slots (9-17), Tuesday: 6 slots (10-16)
		expect(slots).toHaveLength(14)

		// Check Monday slots
		expect(slots[0]!.start).toEqual(new Date('2024-01-01T09:00:00Z'))
		expect(slots[7]!.end).toEqual(new Date('2024-01-01T17:00:00Z'))

		// Check Tuesday slots
		expect(slots[8]!.start).toEqual(new Date('2024-01-02T10:00:00Z'))
		expect(slots[13]!.end).toEqual(new Date('2024-01-02T16:00:00Z'))
	})

	test('throws error for invalid availability', () => {
		expect(() => {
			new AvailabilityScheduler({
				schedules: [{ days: ['invalid-day' as 'monday'], start: '09:00', end: '17:00' }],
			})
		}).toThrow()
	})

	test('throws error when setting invalid availability', () => {
		const scheduler = new AvailabilityScheduler()
		expect(() => {
			scheduler.setAvailability({
				schedules: [
					{ days: ['monday'], start: '17:00', end: '09:00' }, // Invalid time range
				],
			})
		}).toThrow()
	})
})
