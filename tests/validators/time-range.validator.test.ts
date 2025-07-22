import { describe, expect, test } from 'bun:test'
import { validateTimeRange } from '../../src/validators/time-range.validator.ts'

describe('Time Range Validator', () => {
	const validStart = new Date('2024-01-15T09:00:00Z')
	const validEnd = new Date('2024-01-15T17:00:00Z')

	describe('validateTimeRange', () => {
		test('should pass validation for valid time range', () => {
			expect(() => validateTimeRange(validStart, validEnd)).not.toThrow()
		})

		test('should throw error when start time is not a Date', () => {
			expect(() => validateTimeRange('invalid' as unknown, validEnd)).toThrow('Start time must be a valid Date')
		})

		test('should throw error when end time is not a Date', () => {
			expect(() => validateTimeRange(validStart, 'invalid' as unknown)).toThrow('End time must be a valid Date')
		})

		test('should throw error when start time is invalid Date', () => {
			const invalidDate = new Date('invalid')
			expect(() => validateTimeRange(invalidDate, validEnd)).toThrow('Start time must be a valid Date')
		})

		test('should throw error when end time is invalid Date', () => {
			const invalidDate = new Date('invalid')
			expect(() => validateTimeRange(validStart, invalidDate)).toThrow('End time must be a valid Date')
		})

		test('should throw error when start time equals end time', () => {
			expect(() => validateTimeRange(validStart, validStart)).toThrow('Start time must be before end time')
		})

		test('should throw error when start time is after end time', () => {
			expect(() => validateTimeRange(validEnd, validStart)).toThrow('Start time must be before end time')
		})

		test('should handle null start time', () => {
			expect(() => validateTimeRange(null as unknown, validEnd)).toThrow('Start time must be a valid Date')
		})

		test('should handle null end time', () => {
			expect(() => validateTimeRange(validStart, null as unknown)).toThrow('End time must be a valid Date')
		})

		test('should handle undefined start time', () => {
			expect(() => validateTimeRange(undefined as unknown, validEnd)).toThrow('Start time must be a valid Date')
		})

		test('should handle undefined end time', () => {
			expect(() => validateTimeRange(validStart, undefined as unknown)).toThrow('End time must be a valid Date')
		})

		test('should handle number inputs', () => {
			expect(() => validateTimeRange(123456789 as unknown, validEnd)).toThrow('Start time must be a valid Date')

			expect(() => validateTimeRange(validStart, 123456789 as unknown)).toThrow('End time must be a valid Date')
		})

		test('should handle very close times (millisecond apart)', () => {
			const start = new Date('2024-01-15T09:00:00.000Z')
			const end = new Date('2024-01-15T09:00:00.001Z')

			expect(() => validateTimeRange(start, end)).not.toThrow()
		})

		test('should handle very large time ranges', () => {
			const start = new Date('2024-01-01T00:00:00Z')
			const end = new Date('2025-12-31T23:59:59Z')

			expect(() => validateTimeRange(start, end)).not.toThrow()
		})

		test('should handle edge dates (epoch)', () => {
			const epochStart = new Date(0)
			const epochEnd = new Date(1000)

			expect(() => validateTimeRange(epochStart, epochEnd)).not.toThrow()
		})

		test('should handle far future dates', () => {
			const futureStart = new Date('2100-01-01T00:00:00Z')
			const futureEnd = new Date('2100-12-31T23:59:59Z')

			expect(() => validateTimeRange(futureStart, futureEnd)).not.toThrow()
		})

		test('should handle dates with different timezones (ISO strings)', () => {
			const start = new Date('2024-01-15T09:00:00+05:00')
			const end = new Date('2024-01-15T17:00:00+05:00')

			expect(() => validateTimeRange(start, end)).not.toThrow()
		})

		test('should handle leap year dates', () => {
			const leapStart = new Date('2024-02-29T09:00:00Z')
			const leapEnd = new Date('2024-02-29T17:00:00Z')

			expect(() => validateTimeRange(leapStart, leapEnd)).not.toThrow()
		})

		test('should handle Date objects with same time but microsecond difference', () => {
			const start = new Date('2024-01-15T09:00:00.123Z')
			const end = new Date('2024-01-15T09:00:00.124Z')

			expect(() => validateTimeRange(start, end)).not.toThrow()
		})

		test('should handle daylight saving time transitions', () => {
			// Spring forward transition (example)
			const dstStart = new Date('2024-03-10T06:00:00Z')
			const dstEnd = new Date('2024-03-10T08:00:00Z')

			expect(() => validateTimeRange(dstStart, dstEnd)).not.toThrow()
		})

		test('should handle array inputs', () => {
			expect(() => validateTimeRange([] as unknown, validEnd)).toThrow('Start time must be a valid Date')
		})

		test('should handle object inputs', () => {
			expect(() => validateTimeRange({} as unknown, validEnd)).toThrow('Start time must be a valid Date')
		})

		test('should handle boolean inputs', () => {
			expect(() => validateTimeRange(true as unknown, validEnd)).toThrow('Start time must be a valid Date')

			expect(() => validateTimeRange(validStart, false as unknown)).toThrow('End time must be a valid Date')
		})
	})
})
