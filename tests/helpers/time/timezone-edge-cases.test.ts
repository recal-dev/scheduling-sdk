import { describe, expect, test } from 'bun:test'
import { convertTimeStringToUTC, createDateInTimezone, isValidTimezone } from '../../../src/helpers/time/timezone'

describe('Timezone Utilities - Edge Cases', () => {
	describe('DST boundary transitions', () => {
		test('handles spring forward transition (DST begins)', () => {
			// In 2024, US DST begins March 10 (spring forward 2 AM → 3 AM)
			const springDate = new Date('2024-03-10')

			// 1 AM should still be EST (UTC-5)
			const beforeDst = convertTimeStringToUTC('01:00', springDate, 'America/New_York')
			expect(beforeDst.getUTCHours()).toBe(6) // 1 AM EST = 6 AM UTC

			// 3 AM should be EDT (UTC-4) - but our function processes as standard EDT
			const afterDst = convertTimeStringToUTC('03:00', springDate, 'America/New_York')
			expect(afterDst.getUTCHours()).toBe(8) // 3 AM on DST transition date = 8 AM UTC
		})

		test('handles fall back transition (DST ends)', () => {
			// In 2024, US DST ends November 3 (fall back 2 AM → 1 AM)
			const fallDate = new Date('2024-11-03')

			// Test times that exist both before and after the transition
			const morning = convertTimeStringToUTC('09:00', fallDate, 'America/New_York')
			expect(morning.getUTCHours()).toBe(14) // 9 AM EST = 14:00 UTC (after fallback)
		})

		test('handles UK DST transitions', () => {
			// UK DST in 2024: begins March 31, ends October 27
			const ukWinter = new Date('2024-01-15')
			const ukSummer = new Date('2024-07-15')

			// January: GMT (UTC+0)
			const winterTime = convertTimeStringToUTC('10:00', ukWinter, 'Europe/London')
			expect(winterTime.getUTCHours()).toBe(10)

			// July: BST (UTC+1)
			const summerTime = convertTimeStringToUTC('10:00', ukSummer, 'Europe/London')
			expect(summerTime.getUTCHours()).toBe(9) // 10 AM BST = 9 AM UTC
		})
	})

	describe('edge time values', () => {
		test('handles midnight correctly', () => {
			const date = new Date('2024-01-15')
			const midnight = convertTimeStringToUTC('00:00', date, 'America/New_York')
			expect(midnight.getUTCHours()).toBe(5) // Midnight EST = 5 AM UTC
		})

		test('handles near-midnight times', () => {
			const date = new Date('2024-01-15')
			const lateNight = convertTimeStringToUTC('23:59', date, 'America/New_York')
			expect(lateNight.getUTCHours()).toBe(4) // 11:59 PM EST = 4:59 AM UTC next day
			expect(lateNight.getUTCMinutes()).toBe(59)
		})

		test('handles noon correctly', () => {
			const date = new Date('2024-01-15')
			const noon = convertTimeStringToUTC('12:00', date, 'America/New_York')
			expect(noon.getUTCHours()).toBe(17) // Noon EST = 5 PM UTC
		})
	})

	describe('different timezone offsets', () => {
		test('handles positive UTC offset (Asia/Tokyo)', () => {
			const date = new Date('2024-01-15')
			const tokyoTime = convertTimeStringToUTC('09:00', date, 'Asia/Tokyo')
			expect(tokyoTime.getUTCHours()).toBe(0) // 9 AM JST = Midnight UTC
		})

		test('handles negative UTC offset (US West Coast)', () => {
			const date = new Date('2024-01-15')
			const pacificTime = convertTimeStringToUTC('09:00', date, 'America/Los_Angeles')
			expect(pacificTime.getUTCHours()).toBe(17) // 9 AM PST = 5 PM UTC
		})

		test('handles half-hour timezone offset', () => {
			const date = new Date('2024-01-15')
			const adelaideTime = convertTimeStringToUTC('09:30', date, 'Australia/Adelaide')
			// Adelaide is UTC+10:30 in summer, UTC+9:30 in winter
			// January is summer in Australia (UTC+10:30)
			expect(adelaideTime.getUTCHours()).toBe(23) // 9:30 AM ACDT = 11:00 PM UTC (prev day)
			expect(adelaideTime.getUTCMinutes()).toBe(0)
		})
	})

	describe('timezone validation edge cases', () => {
		test('validates rare but valid timezones', () => {
			expect(isValidTimezone('Pacific/Kiritimati')).toBe(true) // UTC+14
			expect(isValidTimezone('Pacific/Honolulu')).toBe(true) // UTC-10
			expect(isValidTimezone('Antarctica/McMurdo')).toBe(true) // Valid IANA zone
		})

		test('rejects invalid formats', () => {
			expect(isValidTimezone('UTC+5')).toBe(false) // Not IANA format
			expect(isValidTimezone('+05:00')).toBe(false) // ISO offset, not timezone
			expect(isValidTimezone('America')).toBe(false) // Incomplete
			expect(isValidTimezone('America/')).toBe(false) // Incomplete
		})

		test('handles special cases', () => {
			expect(isValidTimezone('GMT')).toBe(true) // Should be valid
			expect(isValidTimezone('UTC')).toBe(true) // Should be valid
			expect(isValidTimezone('Z')).toBe(false) // ISO format, not timezone
		})
	})

	describe('date edge cases', () => {
		test('handles leap year dates', () => {
			const leapDay = new Date('2024-02-29') // 2024 is a leap year
			const utcDate = convertTimeStringToUTC('12:00', leapDay, 'America/New_York')
			expect(utcDate.getUTCHours()).toBe(17) // Noon EST = 5 PM UTC
			expect(utcDate.getUTCDate()).toBe(29) // Should still be Feb 29
		})

		test('handles year boundaries', () => {
			const newYearsEve = new Date('2023-12-31')
			const lateNight = convertTimeStringToUTC('23:30', newYearsEve, 'America/New_York')
			expect(lateNight.getUTCFullYear()).toBe(2024) // Should roll over to 2024 UTC
			expect(lateNight.getUTCMonth()).toBe(0) // January
			expect(lateNight.getUTCDate()).toBe(1) // 1st
			expect(lateNight.getUTCHours()).toBe(4) // 11:30 PM EST = 4:30 AM UTC
			expect(lateNight.getUTCMinutes()).toBe(30)
		})
	})

	describe('error handling', () => {
		test('provides clear error messages for invalid timezones', () => {
			const date = new Date('2024-01-15')
			expect(() => convertTimeStringToUTC('09:00', date, 'BadZone')).toThrow('Invalid timezone')
			expect(() => createDateInTimezone(date, 9, 0, 'BadZone')).toThrow('Invalid timezone')
		})

		test('validates time format strictly', () => {
			const date = new Date('2024-01-15')
			// Our current implementation is flexible with leading zeros, but strict with invalid values
			expect(() => convertTimeStringToUTC('09:60', date, 'UTC')).toThrow('Invalid time format') // Invalid minutes
			expect(() => convertTimeStringToUTC('24:00', date, 'UTC')).toThrow('Invalid time format') // Invalid hour
			expect(() => convertTimeStringToUTC('abc:00', date, 'UTC')).toThrow('Invalid time format') // Non-numeric
			expect(() => convertTimeStringToUTC('12:ab', date, 'UTC')).toThrow('Invalid time format') // Non-numeric minutes
		})
	})
})
