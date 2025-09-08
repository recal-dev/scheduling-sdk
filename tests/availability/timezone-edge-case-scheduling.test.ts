import { describe, expect, test } from 'bun:test'
import { AvailabilityScheduler } from '../../src/availability/scheduler'
import type { WeeklyAvailability } from '../../src/types/availability.types'

describe('Scheduling with timezone edge cases', () => {
	test('handles early morning availability in positive UTC offset timezones', () => {
		// Monday 1-3 AM in Tokyo
		const availability: WeeklyAvailability = {
			schedules: [{ days: ['monday'], start: 60, end: 180 }], // 01:00-03:00 in minutes
		}

		const scheduler = new AvailabilityScheduler(availability, 'Asia/Tokyo')

		// Monday 1-3 AM JST = Sunday 4-6 PM UTC
		// So we need to search Sunday UTC to find Monday morning Tokyo slots
		const slots = scheduler.findAvailableSlots(
			new Date('2024-01-14T00:00:00Z'), // Sunday UTC
			new Date('2024-01-15T23:59:59Z'), // Monday UTC
			{ slotDuration: 60 }
		)

		// Should find slots on Sunday UTC (which is Monday morning in Tokyo)
		const sundaySlots = slots.filter(s => s.start.getUTCDate() === 14)
		expect(sundaySlots.length).toBe(2) // 2 hourly slots (1-2 AM and 2-3 AM JST)
		expect(sundaySlots[0]!.start.getUTCHours()).toBe(16) // 1 AM JST = 4 PM UTC
	})

	test('handles late night availability in negative UTC offset timezones', () => {
		// Monday 11 PM - Tuesday 1 AM in Los Angeles
		const availability: WeeklyAvailability = {
			schedules: [{ days: ['monday'], start: 1380, end: 1439 }], // 23:00-23:59
		}

		const scheduler = new AvailabilityScheduler(availability, 'America/Los_Angeles')

		// Monday 11 PM PST = Tuesday 7 AM UTC
		const slots = scheduler.findAvailableSlots(
			new Date('2024-01-15T00:00:00Z'), // Monday UTC
			new Date('2024-01-16T23:59:59Z'), // Tuesday UTC
			{ slotDuration: 30 }
		)

		// Should find slots on Tuesday UTC (which is Monday night in LA)
		const tuesdaySlots = slots.filter(s => s.start.getUTCDate() === 16)
		expect(tuesdaySlots.length).toBeGreaterThan(0)
		expect(tuesdaySlots[0]!.start.getUTCHours()).toBe(7) // 11 PM PST = 7 AM UTC next day
	})

	test('handles availability that spans midnight in local timezone', () => {
		// Saturday 10 PM - Sunday 2 AM in Sydney
		const availability: WeeklyAvailability = {
			schedules: [
				{ days: ['saturday'], start: 1320, end: 1439 }, // 22:00-23:59
				{ days: ['sunday'], start: 0, end: 120 }, // 00:00-02:00
			],
		}

		const scheduler = new AvailabilityScheduler(availability, 'Australia/Sydney')

		// Search Friday-Sunday UTC to cover the weekend in Sydney
		const slots = scheduler.findAvailableSlots(
			new Date('2024-01-19T00:00:00Z'), // Friday UTC
			new Date('2024-01-21T23:59:59Z'), // Sunday UTC
			{ slotDuration: 60 }
		)

		// Should find continuous slots across the midnight boundary
		expect(slots.length).toBeGreaterThan(0)

		// Saturday 10 PM AEDT = Saturday 11 AM UTC
		const saturdaySlots = slots.filter(s => s.start.getUTCDate() === 20 && s.start.getUTCHours() >= 11)
		expect(saturdaySlots.length).toBeGreaterThan(0)
	})

	test('handles half-hour timezone offsets with number format', () => {
		// Monday 9:30 AM - 5:30 PM in Adelaide
		const availability: WeeklyAvailability = {
			schedules: [{ days: ['monday'], start: 570, end: 1050 }], // 09:30-17:30
		}

		const scheduler = new AvailabilityScheduler(availability, 'Australia/Adelaide')

		// Monday 9:30 AM ACDT = Sunday 11 PM UTC
		const slots = scheduler.findAvailableSlots(
			new Date('2024-01-14T20:00:00Z'), // Sunday 8 PM UTC
			new Date('2024-01-15T10:00:00Z'), // Monday 10 AM UTC
			{ slotDuration: 30 }
		)

		expect(slots.length).toBeGreaterThan(0)
		// First slot should be Sunday 11 PM UTC
		expect(slots[0]!.start.getUTCHours()).toBe(23)
		expect(slots[0]!.start.getUTCDate()).toBe(14) // Sunday
	})

	test('validates that K-overlaps works with timezone edge cases', () => {
		// Two overlapping early morning schedules in Tokyo
		const availability: WeeklyAvailability = {
			schedules: [{ days: ['monday'], start: 60, end: 180 }], // 01:00-03:00
		}

		const scheduler = new AvailabilityScheduler(availability, 'Asia/Tokyo')

		// Add busy times that overlap
		scheduler.addBusyTimes([
			{ start: new Date('2024-01-14T16:00:00Z'), end: new Date('2024-01-14T17:00:00Z') }, // 1-2 AM JST
			{ start: new Date('2024-01-14T16:30:00Z'), end: new Date('2024-01-14T17:30:00Z') }, // 1:30-2:30 AM JST
		])

		// With K=0, should exclude overlap period
		const slotsK0 = scheduler.findAvailableSlots(
			new Date('2024-01-14T15:00:00Z'),
			new Date('2024-01-14T19:00:00Z'),
			{ slotDuration: 30, maxOverlaps: 0 }
		)

		// With K=1, should allow single overlap
		const slotsK1 = scheduler.findAvailableSlots(
			new Date('2024-01-14T15:00:00Z'),
			new Date('2024-01-14T19:00:00Z'),
			{ slotDuration: 30, maxOverlaps: 1 }
		)

		expect(slotsK1.length).toBeGreaterThan(slotsK0.length)
	})
})
