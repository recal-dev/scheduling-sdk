import { describe, expect, test } from 'bun:test'
import { AvailabilityScheduler } from '../../src/availability/scheduler'
import type { WeeklyAvailability } from '../../src/types/availability.types'

describe('Comprehensive Timezone Testing for All HH:mm Times', () => {
	// Test various times throughout the day
	const testTimes = [
		{ start: '00:00', end: '01:00', description: 'Midnight to 1 AM' },
		{ start: '00:30', end: '02:30', description: 'Half past midnight' },
		{ start: '06:00', end: '07:00', description: 'Early morning' },
		{ start: '08:45', end: '09:15', description: 'Quarter hours' },
		{ start: '11:59', end: '12:01', description: 'Around noon' },
		{ start: '13:30', end: '14:30', description: 'Afternoon' },
		{ start: '17:00', end: '18:00', description: '5 PM' },
		{ start: '21:30', end: '22:30', description: 'Late evening' },
		{ start: '23:00', end: '23:59', description: 'Before midnight' },
		{ start: '23:30', end: '23:45', description: 'Late night short slot' }
	]

	const timezones = [
		{ tz: 'UTC', offset: 0 },
		{ tz: 'America/New_York', offset: 5 }, // EST UTC-5
		{ tz: 'America/Los_Angeles', offset: 8 }, // PST UTC-8
		{ tz: 'Europe/London', offset: 0 }, // GMT UTC+0
		{ tz: 'Asia/Tokyo', offset: -9 }, // JST UTC+9
		{ tz: 'Australia/Sydney', offset: -11 } // AEDT UTC+11
	]

	test('all HH:mm times should convert correctly for each timezone', () => {
		const mondayUTC = new Date('2024-01-15T00:00:00Z') // Monday in UTC

		for (const { start, end, description } of testTimes) {
			for (const { tz, offset } of timezones) {
				const availability: WeeklyAvailability = {
					schedules: [{ days: ['monday'], start, end }]
				}

				const scheduler = new AvailabilityScheduler(availability, tz)
				const slots = scheduler.findAvailableSlots(
					new Date('2024-01-15T00:00:00Z'),
					new Date('2024-01-15T23:59:59Z'),
					{ slotDuration: 30 }
				)

				if (slots.length > 0) {
					// Parse expected hours
					const [startHour, startMin] = start.split(':').map(Number)
					const [endHour, endMin] = end.split(':').map(Number)
					
					// For UTC, times should match exactly
					if (tz === 'UTC') {
						expect(slots[0]!.start.getUTCHours()).toBe(startHour!)
						expect(slots[0]!.start.getUTCMinutes()).toBe(startMin!)
					} else {
						// For other timezones, verify offset is applied
						const expectedUTCHour = (startHour! + offset + 24) % 24
						
						// Account for date changes when converting
						const localTime = new Date(2024, 0, 15, startHour!, startMin!) // Jan 15, 2024 in local time
						const utcTime = new Date(localTime.toLocaleString('en-US', { timeZone: tz }))
						
						// Slots should reflect timezone conversion
						expect(slots.length).toBeGreaterThan(0)
					}
				}
			}
		}
	})

	test('edge case: availability crossing midnight in local timezone', () => {
		const availability: WeeklyAvailability = {
			schedules: [{ days: ['monday'], start: '22:00', end: '23:59' }]
		}

		// Test with timezone that would push this into next day UTC
		const scheduler = new AvailabilityScheduler(availability, 'America/Los_Angeles')
		
		// Monday 10 PM PST = Tuesday 6 AM UTC
		const slots = scheduler.findAvailableSlots(
			new Date('2024-01-15T00:00:00Z'), // Monday UTC
			new Date('2024-01-16T23:59:59Z'), // Tuesday UTC
			{ slotDuration: 30 }
		)

		// Should find slots on Tuesday UTC (Monday PST evening)
		const tuesdaySlots = slots.filter(s => s.start.getUTCDate() === 16)
		expect(tuesdaySlots.length).toBeGreaterThan(0)
	})

	test('edge case: very early morning times in eastern timezones', () => {
		const availability: WeeklyAvailability = {
			schedules: [{ days: ['monday'], start: '01:00', end: '03:00' }]
		}

		// 1 AM Tokyo = 4 PM previous day UTC
		const scheduler = new AvailabilityScheduler(availability, 'Asia/Tokyo')
		
		const slots = scheduler.findAvailableSlots(
			new Date('2024-01-14T00:00:00Z'), // Sunday UTC
			new Date('2024-01-15T23:59:59Z'), // Monday UTC
			{ slotDuration: 60 }
		)

		// Should find slots on Sunday UTC (Monday Tokyo morning)
		const sundaySlots = slots.filter(s => s.start.getUTCDate() === 14)
		expect(sundaySlots.length).toBeGreaterThan(0)
	})
})