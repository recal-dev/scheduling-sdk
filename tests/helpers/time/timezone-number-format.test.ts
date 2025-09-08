import { describe, expect, test } from 'bun:test'
import { convertTimeStringToUTC } from '../../../src/helpers/time/timezone'

describe('Timezone conversion with number format (minutes from midnight)', () => {
	const testDate = new Date('2024-01-15') // Monday
	
	test('handles number format for various times', () => {
		// Test common times as minutes
		expect(convertTimeStringToUTC(0, testDate, 'UTC').getUTCHours()).toBe(0) // 0 min = 00:00
		expect(convertTimeStringToUTC(540, testDate, 'UTC').getUTCHours()).toBe(9) // 540 min = 09:00
		expect(convertTimeStringToUTC(720, testDate, 'UTC').getUTCHours()).toBe(12) // 720 min = 12:00
		expect(convertTimeStringToUTC(1020, testDate, 'UTC').getUTCHours()).toBe(17) // 1020 min = 17:00
		expect(convertTimeStringToUTC(1439, testDate, 'UTC').getUTCHours()).toBe(23) // 1439 min = 23:59
		expect(convertTimeStringToUTC(1439, testDate, 'UTC').getUTCMinutes()).toBe(59)
	})

	test('number format works with negative UTC offsets', () => {
		// 540 minutes = 9:00 AM
		// 9 AM EST = 14:00 UTC (UTC-5)
		const nyTime = convertTimeStringToUTC(540, testDate, 'America/New_York')
		expect(nyTime.getUTCHours()).toBe(14)
		
		// 9 AM PST = 17:00 UTC (UTC-8)
		const laTime = convertTimeStringToUTC(540, testDate, 'America/Los_Angeles')
		expect(laTime.getUTCHours()).toBe(17)
	})

	test('number format works with positive UTC offsets', () => {
		// 540 minutes = 9:00 AM
		// 9 AM JST = 00:00 UTC (UTC+9)
		const tokyoTime = convertTimeStringToUTC(540, testDate, 'Asia/Tokyo')
		expect(tokyoTime.getUTCHours()).toBe(0)
		
		// 9 AM AEDT = 22:00 UTC previous day (UTC+11 in Jan)
		const sydneyTime = convertTimeStringToUTC(540, testDate, 'Australia/Sydney')
		expect(sydneyTime.getUTCHours()).toBe(22)
		expect(sydneyTime.getUTCDate()).toBe(14) // Previous day
	})

	test('handles midnight edge cases with number format', () => {
		// 0 minutes = midnight
		const midnightNY = convertTimeStringToUTC(0, testDate, 'America/New_York')
		expect(midnightNY.getUTCHours()).toBe(5) // Midnight EST = 5 AM UTC
		
		const midnightTokyo = convertTimeStringToUTC(0, testDate, 'Asia/Tokyo')
		expect(midnightTokyo.getUTCHours()).toBe(15) // Midnight JST = 3 PM UTC previous day
		expect(midnightTokyo.getUTCDate()).toBe(14)
		
		// 1439 minutes = 23:59
		const lateNightLA = convertTimeStringToUTC(1439, testDate, 'America/Los_Angeles')
		expect(lateNightLA.getUTCHours()).toBe(7) // 23:59 PST = 07:59 UTC next day
		expect(lateNightLA.getUTCMinutes()).toBe(59)
		expect(lateNightLA.getUTCDate()).toBe(16) // Next day
	})

	test('handles half-hour timezone offsets with numbers', () => {
		// 570 minutes = 9:30 AM
		// 9:30 AM IST = 04:00 UTC (UTC+5:30)
		const indiaTime = convertTimeStringToUTC(570, testDate, 'Asia/Kolkata')
		expect(indiaTime.getUTCHours()).toBe(4)
		expect(indiaTime.getUTCMinutes()).toBe(0)
		
		// 9:30 AM ACDT = 23:00 UTC previous day (UTC+10:30 in Jan)
		const adelaideTime = convertTimeStringToUTC(570, testDate, 'Australia/Adelaide')
		expect(adelaideTime.getUTCHours()).toBe(23)
		expect(adelaideTime.getUTCMinutes()).toBe(0)
		expect(adelaideTime.getUTCDate()).toBe(14) // Previous day
	})

	test('validates number range', () => {
		// Should accept 0-1439
		expect(() => convertTimeStringToUTC(0, testDate, 'UTC')).not.toThrow()
		expect(() => convertTimeStringToUTC(1439, testDate, 'UTC')).not.toThrow()
		
		// Should reject out of range
		expect(() => convertTimeStringToUTC(-1, testDate, 'UTC')).toThrow('Invalid time in minutes: -1')
		expect(() => convertTimeStringToUTC(1440, testDate, 'UTC')).toThrow('Invalid time in minutes: 1440')
		expect(() => convertTimeStringToUTC(2000, testDate, 'UTC')).toThrow('Invalid time in minutes: 2000')
	})

	test('handles early morning times that cross to previous UTC day', () => {
		// 60 minutes = 01:00 AM
		// When timezone is ahead of UTC, early morning crosses to previous day
		
		// 1 AM Tokyo (UTC+9) = 4 PM previous day UTC
		const tokyoEarly = convertTimeStringToUTC(60, testDate, 'Asia/Tokyo')
		expect(tokyoEarly.getUTCHours()).toBe(16) // 4 PM
		expect(tokyoEarly.getUTCDate()).toBe(14) // Previous day (Jan 14)
		
		// 1 AM Sydney (UTC+11 in Jan) = 2 PM previous day UTC
		const sydneyEarly = convertTimeStringToUTC(60, testDate, 'Australia/Sydney')
		expect(sydneyEarly.getUTCHours()).toBe(14) // 2 PM
		expect(sydneyEarly.getUTCDate()).toBe(14) // Previous day
		
		// 2 AM Berlin (UTC+1 in Jan) = 1 AM same day UTC
		const berlinEarly = convertTimeStringToUTC(120, testDate, 'Europe/Berlin')
		expect(berlinEarly.getUTCHours()).toBe(1)
		expect(berlinEarly.getUTCDate()).toBe(15) // Same day
		
		// But 1 AM Berlin = midnight UTC
		const berlinVeryEarly = convertTimeStringToUTC(60, testDate, 'Europe/Berlin')
		expect(berlinVeryEarly.getUTCHours()).toBe(0)
		expect(berlinVeryEarly.getUTCDate()).toBe(15) // Same day
	})

	test('number and string formats produce identical results', () => {
		const timezones = ['UTC', 'America/New_York', 'Asia/Tokyo', 'Australia/Sydney']
		
		for (const tz of timezones) {
			// Test various times
			const times = [
				{ minutes: 0, string: '00:00' },
				{ minutes: 60, string: '01:00' },
				{ minutes: 540, string: '09:00' },
				{ minutes: 750, string: '12:30' },
				{ minutes: 1020, string: '17:00' },
				{ minutes: 1439, string: '23:59' }
			]
			
			for (const { minutes, string } of times) {
				const numberResult = convertTimeStringToUTC(minutes, testDate, tz)
				const stringResult = convertTimeStringToUTC(string, testDate, tz)
				
				expect(numberResult.getTime()).toBe(stringResult.getTime())
			}
		}
	})
})