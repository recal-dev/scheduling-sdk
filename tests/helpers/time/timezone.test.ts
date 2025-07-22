import { describe, expect, test } from 'bun:test'
import { convertTimeStringToUTC, createDateInTimezone, isValidTimezone } from '../../../src/helpers/time/timezone'

describe('Timezone Utilities', () => {
	describe('convertTimeStringToUTC', () => {
		test('converts New York time to UTC correctly', () => {
			// January 15, 2024 is in EST (UTC-5)
			const date = new Date('2024-01-15')
			const utcDate = convertTimeStringToUTC('09:00', date, 'America/New_York')

			// 9 AM EST should be 2 PM UTC (14:00)
			expect(utcDate.getUTCHours()).toBe(14)
			expect(utcDate.getUTCMinutes()).toBe(0)
		})

		test('handles DST transitions correctly', () => {
			// July 15, 2024 is in EDT (UTC-4)
			const date = new Date('2024-07-15')
			const utcDate = convertTimeStringToUTC('09:00', date, 'America/New_York')

			// 9 AM EDT should be 1 PM UTC (13:00)
			expect(utcDate.getUTCHours()).toBe(13)
			expect(utcDate.getUTCMinutes()).toBe(0)
		})

		test('converts London time to UTC correctly', () => {
			// January 15, 2024 is in GMT (UTC+0)
			const date = new Date('2024-01-15')
			const utcDate = convertTimeStringToUTC('09:00', date, 'Europe/London')

			// 9 AM GMT should be 9 AM UTC
			expect(utcDate.getUTCHours()).toBe(9)
			expect(utcDate.getUTCMinutes()).toBe(0)
		})

		test('throws error for invalid time format', () => {
			const date = new Date('2024-01-15')
			expect(() => convertTimeStringToUTC('25:00', date, 'America/New_York')).toThrow('Invalid time format')
			expect(() => convertTimeStringToUTC('09:70', date, 'America/New_York')).toThrow('Invalid time format')
			expect(() => convertTimeStringToUTC('abc', date, 'America/New_York')).toThrow('Invalid time format')
		})

		test('throws error for invalid timezone', () => {
			const date = new Date('2024-01-15')
			expect(() => convertTimeStringToUTC('09:00', date, 'Invalid/Timezone')).toThrow('Invalid timezone')
		})
	})

	describe('createDateInTimezone', () => {
		test('creates timezone-aware date correctly', () => {
			const date = new Date('2024-01-15')
			const utcDate = createDateInTimezone(date, 9, 30, 'America/New_York')

			// 9:30 AM EST should be 2:30 PM UTC
			expect(utcDate.getUTCHours()).toBe(14)
			expect(utcDate.getUTCMinutes()).toBe(30)
		})
	})

	describe('isValidTimezone', () => {
		test('validates correct IANA timezones', () => {
			expect(isValidTimezone('America/New_York')).toBe(true)
			expect(isValidTimezone('Europe/London')).toBe(true)
			expect(isValidTimezone('Asia/Tokyo')).toBe(true)
			expect(isValidTimezone('UTC')).toBe(true)
		})

		test('rejects invalid timezones', () => {
			expect(isValidTimezone('EST')).toBe(false)
			expect(isValidTimezone('Invalid/Timezone')).toBe(false)
			expect(isValidTimezone('')).toBe(false)
		})
	})
})
