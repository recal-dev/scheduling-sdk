import { describe, expect, test } from 'bun:test'
import { AvailabilityScheduler } from '../../../src/availability/scheduler'
import { convertTimeStringToUTC } from '../../../src/helpers/time/timezone'
import type { WeeklyAvailability } from '../../../src/types/availability.types'

describe('Timezone 01:00 Hour Edge Cases', () => {
	const testDate = new Date('2024-01-15') // Monday, winter time

	describe('01:00 timezone conversions', () => {
		test('01:00 America/New_York → should be 06:00 UTC (EST)', () => {
			const result = convertTimeStringToUTC('01:00', testDate, 'America/New_York')
			expect(result.getUTCHours()).toBe(6)
			expect(result.getUTCMinutes()).toBe(0)
			expect(result.getUTCDate()).toBe(15) // Should stay same day
		})

		test('01:00 America/Los_Angeles → should be 09:00 UTC (PST)', () => {
			const result = convertTimeStringToUTC('01:00', testDate, 'America/Los_Angeles')
			expect(result.getUTCHours()).toBe(9)
			expect(result.getUTCMinutes()).toBe(0)
			expect(result.getUTCDate()).toBe(15) // Should stay same day
		})

		test('01:00 Europe/London → should be 01:00 UTC (GMT in winter)', () => {
			const result = convertTimeStringToUTC('01:00', testDate, 'Europe/London')
			expect(result.getUTCHours()).toBe(1)
			expect(result.getUTCMinutes()).toBe(0)
			expect(result.getUTCDate()).toBe(15) // Should stay same day
		})

		test('01:00 Asia/Tokyo → should cross to previous day in UTC', () => {
			const result = convertTimeStringToUTC('01:00', testDate, 'Asia/Tokyo')
			expect(result.getUTCHours()).toBe(16) // 1 AM JST = 4 PM UTC previous day
			expect(result.getUTCMinutes()).toBe(0)
			expect(result.getUTCDate()).toBe(14) // Should be previous day (Jan 14)
		})

		test('01:00 Australia/Sydney → should cross to previous day in UTC', () => {
			// January is summer in Australia (AEDT = UTC+11)
			const result = convertTimeStringToUTC('01:00', testDate, 'Australia/Sydney')
			expect(result.getUTCHours()).toBe(14) // 1 AM AEDT = 2 PM UTC previous day
			expect(result.getUTCMinutes()).toBe(0)
			expect(result.getUTCDate()).toBe(14) // Should be previous day (Jan 14)
		})

		test('01:00 Pacific/Honolulu → should cross to next day in UTC', () => {
			// Hawaii is UTC-10
			const result = convertTimeStringToUTC('01:00', testDate, 'Pacific/Honolulu')
			expect(result.getUTCHours()).toBe(11) // 1 AM HST = 11 AM UTC
			expect(result.getUTCMinutes()).toBe(0)
			expect(result.getUTCDate()).toBe(15) // Should stay same day
		})
	})

	describe('01:00 scheduling edge cases', () => {
		test('01:00-02:00 availability in Tokyo should work correctly', () => {
			// Monday 1-2 AM Tokyo should be available when converted to UTC
			const availability: WeeklyAvailability = {
				schedules: [{ days: ['monday'], start: '01:00', end: '02:00' }],
			}

			const scheduler = new AvailabilityScheduler(availability, 'Asia/Tokyo')

			// Monday 1-2 AM JST becomes Sunday 4-5 PM UTC (16:00-17:00 UTC)
			// Use the same date structure as the passing test
			const startTime = new Date('2024-01-14T00:00:00Z') // Sunday UTC
			const endTime = new Date('2024-01-15T23:59:59Z') // Monday UTC

			const slots = scheduler.findAvailableSlots(startTime, endTime, {
				slotDuration: 30,
			})

			// Should find slots on Sunday UTC (representing Monday 1-2 AM JST)
			expect(slots.length).toBeGreaterThan(0)

			// Find slots that fall in the expected time range (Sunday at 16:00)
			const expectedSlots = slots.filter(
				slot => slot.start.getUTCHours() === 16 && slot.start.getUTCDate() === 14
			)
			expect(expectedSlots.length).toBeGreaterThan(0)
		})

		test('01:00-02:00 availability in New York stays within same UTC day', () => {
			const availability: WeeklyAvailability = {
				schedules: [{ days: ['monday'], start: '01:00', end: '02:00' }],
			}

			const scheduler = new AvailabilityScheduler(availability, 'America/New_York')

			const startTime = new Date('2024-01-15T00:00:00Z')
			const endTime = new Date('2024-01-15T23:59:59Z')

			const slots = scheduler.findAvailableSlots(startTime, endTime, {
				slotDuration: 30,
			})

			// Should have slots from 06:00-07:00 UTC (1-2 AM EST)
			expect(slots.length).toBeGreaterThan(0)
			expect(slots[0]?.start.getUTCHours()).toBe(6)
			expect(slots[slots.length - 1]?.end.getUTCHours()).toBe(7)
		})

		test('01:00 availability should handle week boundaries correctly', () => {
			// Sunday 01:00 in Tokyo should work properly
			const availability: WeeklyAvailability = {
				schedules: [{ days: ['sunday'], start: '01:00', end: '02:00' }],
			}

			const scheduler = new AvailabilityScheduler(availability, 'Asia/Tokyo')

			// Sunday 1-2 AM JST becomes Saturday 4-5 PM UTC
			// Search both Saturday and Sunday to find the slots
			const startTime = new Date('2024-01-20T00:00:00Z') // Saturday UTC
			const endTime = new Date('2024-01-21T23:59:59Z') // Sunday UTC

			const slots = scheduler.findAvailableSlots(startTime, endTime, {
				slotDuration: 30,
			})

			// Should find slots on Saturday UTC (representing Sunday 1-2 AM JST)
			expect(slots.length).toBeGreaterThan(0)

			// Find slots that fall on Saturday UTC at 16:00 (Sunday 1 AM JST)
			const expectedSlots = slots.filter(
				slot => slot.start.getUTCHours() === 16 && slot.start.getUTCDate() === 20
			)
			expect(expectedSlots.length).toBeGreaterThan(0)
		})
	})

	describe('01:00 during DST transitions', () => {
		test('01:00 during spring forward (DST begins) - this time may not exist', () => {
			// March 10, 2024 is when US DST begins (2 AM → 3 AM)
			const dstDate = new Date('2024-03-10')

			// 1 AM should still exist and be EST (UTC-5)
			const result = convertTimeStringToUTC('01:00', dstDate, 'America/New_York')
			expect(result.getUTCHours()).toBe(6) // 1 AM EST = 6 AM UTC
			expect(result.getUTCDate()).toBe(10) // Should stay March 10
		})

		test('01:00 during fall back (DST ends) - this time occurs twice', () => {
			// November 3, 2024 is when US DST ends (2 AM → 1 AM)
			const dstDate = new Date('2024-11-03')

			// At 1 AM on Nov 3, we're still in EDT (UTC-4) before the transition at 2 AM
			const result = convertTimeStringToUTC('01:00', dstDate, 'America/New_York')
			expect(result.getUTCHours()).toBe(5) // 1 AM EDT = 5 AM UTC (before fall back to EST)
			expect(result.getUTCDate()).toBe(3) // Should stay November 3
		})

		test('01:00 UK summer time (BST)', () => {
			const summerDate = new Date('2024-07-15')
			const result = convertTimeStringToUTC('01:00', summerDate, 'Europe/London')
			expect(result.getUTCHours()).toBe(0) // 1 AM BST = 0:00 UTC (midnight)
			expect(result.getUTCDate()).toBe(15) // Should stay same day
		})
	})

	describe('01:00 near midnight boundaries', () => {
		test('01:00 on New Years Day with timezone conversion', () => {
			const newYearsDate = new Date('2024-01-01')

			// 1 AM Tokyo time on Jan 1 = 4 PM UTC Dec 31
			const tokyoResult = convertTimeStringToUTC('01:00', newYearsDate, 'Asia/Tokyo')
			expect(tokyoResult.getUTCHours()).toBe(16)
			expect(tokyoResult.getUTCDate()).toBe(31)
			expect(tokyoResult.getUTCMonth()).toBe(11) // December
			expect(tokyoResult.getUTCFullYear()).toBe(2023)

			// 1 AM Hawaii time on Jan 1 = 11 AM UTC Jan 1
			const hawaiiResult = convertTimeStringToUTC('01:00', newYearsDate, 'Pacific/Honolulu')
			expect(hawaiiResult.getUTCHours()).toBe(11)
			expect(hawaiiResult.getUTCDate()).toBe(1)
			expect(hawaiiResult.getUTCMonth()).toBe(0) // January
			expect(hawaiiResult.getUTCFullYear()).toBe(2024)
		})

		test('01:00 on leap year Feb 29', () => {
			const leapDate = new Date('2024-02-29')

			const result = convertTimeStringToUTC('01:00', leapDate, 'America/New_York')
			expect(result.getUTCHours()).toBe(6)
			expect(result.getUTCDate()).toBe(29)
			expect(result.getUTCMonth()).toBe(1) // February
		})
	})

	describe('01:00 with half-hour timezone offsets', () => {
		test('01:00 Adelaide (UTC+10:30 summer)', () => {
			// Adelaide is UTC+10:30 in summer (ACDT)
			const result = convertTimeStringToUTC('01:00', testDate, 'Australia/Adelaide')
			expect(result.getUTCHours()).toBe(14) // 1 AM ACDT = 2:30 PM UTC previous day
			expect(result.getUTCMinutes()).toBe(30)
			expect(result.getUTCDate()).toBe(14) // Should be previous day
		})

		test('01:00 India (UTC+5:30)', () => {
			const result = convertTimeStringToUTC('01:00', testDate, 'Asia/Kolkata')
			expect(result.getUTCHours()).toBe(19) // 1 AM IST = 7:30 PM UTC previous day
			expect(result.getUTCMinutes()).toBe(30)
			expect(result.getUTCDate()).toBe(14) // Should be previous day
		})

		test('01:00 Nepal (UTC+5:45)', () => {
			const result = convertTimeStringToUTC('01:00', testDate, 'Asia/Kathmandu')
			expect(result.getUTCHours()).toBe(19) // 1 AM NPT = 7:15 PM UTC previous day
			expect(result.getUTCMinutes()).toBe(15)
			expect(result.getUTCDate()).toBe(14) // Should be previous day
		})
	})
})
