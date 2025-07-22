import { describe, expect, test } from 'bun:test'
import { AvailabilityScheduler } from '../../src/availability/scheduler'
import type { WeeklyAvailability } from '../../src/types/availability.types'

describe('AvailabilityScheduler - Timezone Integration', () => {
	test('schedules correctly with New York timezone in availability', () => {
		const availability: WeeklyAvailability = {
			schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }]
		}

		const scheduler = new AvailabilityScheduler(availability, 'America/New_York')

		// Search on Monday, Jan 15, 2024 (EST = UTC-5)
		const startTime = new Date('2024-01-15T00:00:00Z') // Monday midnight UTC
		const endTime = new Date('2024-01-15T23:59:59Z') // Monday end UTC

		const slots = scheduler.findAvailableSlots(startTime, endTime, {
			slotDuration: 60,
		})

		// Should have slots from 14:00-22:00 UTC (9 AM-5 PM EST)
		expect(slots.length).toBeGreaterThan(0)
		expect(slots[0]?.start.getUTCHours()).toBe(14) // 9 AM EST = 14:00 UTC
		expect(slots[slots.length - 1]?.end.getUTCHours()).toBe(22) // 5 PM EST = 22:00 UTC
	})

	test('timezone override takes precedence over availability timezone', () => {
		const availability: WeeklyAvailability = {
			schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
			timezone: 'America/New_York', // This should be ignored
		}

		const scheduler = new AvailabilityScheduler(availability)

		const startTime = new Date('2024-01-15T00:00:00Z')
		const endTime = new Date('2024-01-15T23:59:59Z')

		const slots = scheduler.findAvailableSlots(startTime, endTime, {
			slotDuration: 60,
			timezone: 'Europe/London', // Override to London time (GMT = UTC+0)
		})

		// Should have slots from 09:00-17:00 UTC (9 AM-5 PM GMT)
		expect(slots.length).toBeGreaterThan(0)
		expect(slots[0]?.start.getUTCHours()).toBe(9) // 9 AM GMT = 09:00 UTC
		expect(slots[slots.length - 1]?.end.getUTCHours()).toBe(17) // 5 PM GMT = 17:00 UTC
	})

	test('handles DST transitions correctly', () => {
		const availability: WeeklyAvailability = {
			schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }]
		}

		const scheduler = new AvailabilityScheduler(availability, 'America/New_York')

		// Test during EDT (summer time, UTC-4)
		const startTime = new Date('2024-07-15T00:00:00Z') // Monday in July
		const endTime = new Date('2024-07-15T23:59:59Z')

		const slots = scheduler.findAvailableSlots(startTime, endTime, {
			slotDuration: 60,
		})

		// Should have slots from 13:00-21:00 UTC (9 AM-5 PM EDT)
		expect(slots.length).toBeGreaterThan(0)
		expect(slots[0]?.start.getUTCHours()).toBe(13) // 9 AM EDT = 13:00 UTC
		expect(slots[slots.length - 1]?.end.getUTCHours()).toBe(21) // 5 PM EDT = 21:00 UTC
	})

	test('works without timezone (uses system local time)', () => {
		const availability: WeeklyAvailability = {
			schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
			// No timezone specified
		}

		const scheduler = new AvailabilityScheduler(availability)

		const startTime = new Date('2024-01-15T00:00:00Z')
		const endTime = new Date('2024-01-15T23:59:59Z')

		const slots = scheduler.findAvailableSlots(startTime, endTime, {
			slotDuration: 60,
		})

		// Should still generate slots (exact hours depend on system timezone)
		expect(slots.length).toBeGreaterThan(0)
	})

	test('multiple schedules with timezone work correctly', () => {
		const availability: WeeklyAvailability = {
			schedules: [
				{ days: ['monday'], start: '09:00', end: '12:00' }, // Morning
				{ days: ['monday'], start: '13:00', end: '17:00' }, // Afternoon
			],
			timezone: 'America/New_York',
		}

		const scheduler = new AvailabilityScheduler(availability)

		const startTime = new Date('2024-01-15T00:00:00Z')
		const endTime = new Date('2024-01-15T23:59:59Z')

		const slots = scheduler.findAvailableSlots(startTime, endTime, {
			slotDuration: 60,
		})

		// Should have morning slots (14:00-17:00 UTC) and afternoon slots (18:00-22:00 UTC)
		expect(slots.length).toBeGreaterThan(0)

		// Check that there's a gap between 17:00-18:00 UTC (lunch break)
		const lunchTime = new Date('2024-01-15T17:30:00Z')
		const hasSlotDuringLunch = slots.some(
			slot => slot.start.getTime() <= lunchTime.getTime() && lunchTime.getTime() < slot.end.getTime()
		)
		expect(hasSlotDuringLunch).toBe(false)
	})
})
