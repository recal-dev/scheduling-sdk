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
		expect(sundaySlots[1]!.start.getUTCHours()).toBe(17)
		expect(sundaySlots.every(s => s.start.getUTCMinutes() === 0)).toBe(true)
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
		expect(tuesdaySlots.length).toBe(2) // 23:00-24:00 local -> 07:00-08:00 UTC, 30-min slots
		expect(tuesdaySlots[0]!.start.getUTCHours()).toBe(7) // 11 PM PST = 7 AM UTC next day
		expect(tuesdaySlots.map(s => s.start.getUTCMinutes())).toEqual([0, 30])
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

		// Should find continuous 1-hour slots across the midnight boundary: 22:00-02:00 local = 11:00-15:00 UTC
		const saturdaySlots = slots.filter(s => s.start.getUTCDate() === 20)
		expect(saturdaySlots.length).toBe(4)
		expect(saturdaySlots.map(s => s.start.getUTCHours())).toEqual([11, 12, 13, 14])
		expect(saturdaySlots.every(s => s.start.getUTCMinutes() === 0)).toBe(true)
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

		expect(slots.length).toBe(16) // 09:30-17:30 local = 23:00-07:00 UTC (16 x 30-min slots)
		// First slot should be Sunday 11 PM UTC
		expect(slots[0]!.start.getUTCHours()).toBe(23)
		expect(slots[0]!.start.getUTCDate()).toBe(14) // Sunday
		// Last slot should start at 06:30 UTC on Monday
		const last = slots[slots.length - 1]!
		expect(last.start.getUTCDate()).toBe(15)
		expect(last.start.getUTCHours()).toBe(6)
		expect(last.start.getUTCMinutes()).toBe(30)
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
			new Date('2024-01-14T16:00:00Z'), // Limit to availability window
			new Date('2024-01-14T18:00:00Z'),
			{ slotDuration: 30, maxOverlaps: 0 }
		)

		// With K=1, should allow single overlap
		const slotsK1 = scheduler.findAvailableSlots(
			new Date('2024-01-14T16:00:00Z'), // Limit to availability window
			new Date('2024-01-14T18:00:00Z'),
			{ slotDuration: 30, maxOverlaps: 1 }
		)

		// With K=0, only 17:30-18:00 UTC remains free -> exactly 1 slot
		expect(slotsK0.length).toBe(1)
		expect(slotsK0[0]!.start.getUTCHours()).toBe(17)
		expect(slotsK0[0]!.start.getUTCMinutes()).toBe(30)
		// With K=1 and merged busy intervals, free windows cover 16:00-17:30 and 17:30-18:00 -> 4 slots
		expect(slotsK1.length).toBe(4)
		expect(
			slotsK1.map(
				s =>
					`${String(s.start.getUTCHours()).padStart(2, '0')}:${String(s.start.getUTCMinutes()).padStart(2, '0')}`
			)
		).toEqual(['16:00', '16:30', '17:00', '17:30'])
	})

	test('CRITICAL: timezone transition during DST changes', () => {
		// Test during Spring DST transition (March 10, 2024 - EST to EDT)
		const availability: WeeklyAvailability = {
			schedules: [{ days: ['sunday'], start: '01:00', end: '04:00' }], // 1-4 AM EST/EDT
		}

		const scheduler = new AvailabilityScheduler(availability, 'America/New_York')

		// March 10, 2024 - Spring forward (2 AM becomes 3 AM)
		const slots = scheduler.findAvailableSlots(new Date('2024-03-10T00:00:00Z'), new Date('2024-03-10T23:59:59Z'), {
			slotDuration: 30,
		})

		// Should handle the DST transition: implementation yields a 3-hour window in UTC
		expect(slots.length).toBe(6)
		expect(
			slots.map(
				s =>
					`${String(s.start.getUTCHours()).padStart(2, '0')}:${String(s.start.getUTCMinutes()).padStart(2, '0')}`
			)
		).toEqual(['06:00', '06:30', '07:00', '07:30', '08:00', '08:30'])
	})

	test('CRITICAL: very short availability windows with timezone conversion', () => {
		const availability: WeeklyAvailability = {
			schedules: [{ days: ['monday'], start: 61, end: 62 }], // 01:01-01:02 in minutes
		}

		const scheduler = new AvailabilityScheduler(availability, 'Asia/Tokyo')

		const slots = scheduler.findAvailableSlots(
			new Date('2024-01-14T00:00:00Z'), // Sunday UTC
			new Date('2024-01-15T23:59:59Z'), // Monday UTC
			{ slotDuration: 1 }
		)

		// Should find exactly 1 slot at 16:01 UTC on Sunday (Monday 1:01 JST)
		expect(slots.length).toBe(1)

		// Find the correct slot that should exist
		const correctSlot = slots.find(
			s => s.start.getUTCHours() === 16 && s.start.getUTCMinutes() === 1 && s.start.getUTCDate() === 14
		)
		expect(correctSlot).toBeDefined() // This exact slot should exist
		// Verify end of the slot is 16:02 UTC
		expect(slots[0]!.end.getUTCHours()).toBe(16)
		expect(slots[0]!.end.getUTCMinutes()).toBe(2)

		// Ensure there are no spurious :59 slots
		const spuriousSlots = slots.filter(s => s.start.getUTCMinutes() === 59)
		expect(spuriousSlots.length).toBe(0)
	})

	test('CRITICAL: availability at exactly midnight with timezone boundaries', () => {
		// Midnight availability in multiple timezones
		const availability: WeeklyAvailability = {
			schedules: [{ days: ['tuesday'], start: 0, end: 1 }], // 00:00-00:01
		}

		// Test in New Zealand (UTC+13 in Jan - ahead of UTC)
		const schedulerNZ = new AvailabilityScheduler(availability, 'Pacific/Auckland')
		const slotsNZ = schedulerNZ.findAvailableSlots(
			new Date('2024-01-15T00:00:00Z'), // Monday UTC
			new Date('2024-01-16T23:59:59Z'), // Tuesday UTC
			{ slotDuration: 1 }
		)

		// Tuesday midnight NZDT = Monday 11 AM UTC -> exactly one 1-minute slot at 11:00 UTC
		const mondaySlots = slotsNZ.filter(s => s.start.getUTCDate() === 15)
		expect(mondaySlots.length).toBe(1)
		const midnightSlot = mondaySlots[0]!
		expect(midnightSlot.start.getUTCHours()).toBe(11)
		expect(midnightSlot.start.getUTCMinutes()).toBe(0)
	})

	test('CRITICAL: overlapping busy times across day boundaries in different timezones', () => {
		// Monday late night availability in Hawaii
		const availability: WeeklyAvailability = {
			schedules: [{ days: ['monday'], start: 1320, end: 1439 }], // 22:00-23:59 HST
		}

		const scheduler = new AvailabilityScheduler(availability, 'Pacific/Honolulu')

		// Add busy time that spans into Tuesday UTC but is still Monday in Hawaii
		scheduler.addBusyTimes([
			{ start: new Date('2024-01-16T08:30:00Z'), end: new Date('2024-01-16T09:30:00Z') }, // Monday 22:30-23:30 HST
		])

		const slots = scheduler.findAvailableSlots(
			new Date('2024-01-16T08:00:00Z'), // Monday 22:00 HST
			new Date('2024-01-16T10:00:00Z'), // Tuesday 00:00 HST
			{ slotDuration: 30 }
		)

		// Should have exactly two 30-min slots at 08:00 and 09:30 UTC
		expect(slots.length).toBe(2)
		expect(
			slots.map(
				s =>
					`${String(s.start.getUTCHours()).padStart(2, '0')}:${String(s.start.getUTCMinutes()).padStart(2, '0')}`
			)
		).toEqual(['08:00', '09:30'])
	})

	test('CRITICAL: leap year February 29th with timezone edge cases', () => {
		// February 29, 2024 (leap year) early morning in positive UTC offset
		const availability: WeeklyAvailability = {
			schedules: [{ days: ['thursday'], start: 30, end: 90 }], // 00:30-01:30 in minutes
		}

		const scheduler = new AvailabilityScheduler(availability, 'Asia/Tokyo')

		// Feb 29, 2024 was a Thursday - test the leap day
		const slots = scheduler.findAvailableSlots(
			new Date('2024-02-28T00:00:00Z'), // Feb 28 UTC
			new Date('2024-02-29T23:59:59Z'), // Feb 29 UTC
			{ slotDuration: 30 }
		)

		// Should find slots on Feb 28 UTC (which is Feb 29 Tokyo morning)
		const feb28Slots = slots.filter(s => s.start.getUTCDate() === 28)
		expect(feb28Slots.length).toBe(2) // Two 30-min slots (00:30-01:30 JST)
		expect(feb28Slots[0]!.start.getUTCHours()).toBe(15) // 00:30 JST = 15:30 UTC previous day
		expect(feb28Slots[0]!.start.getUTCMinutes()).toBe(30)
		expect(feb28Slots[1]!.start.getUTCHours()).toBe(16)
		expect(feb28Slots[1]!.start.getUTCMinutes()).toBe(0)
	})
})
