import { describe, expect, test } from 'bun:test'
import type { WeeklyAvailability } from '../../src/types/availability.types'
import { validateWeeklyAvailability } from '../../src/validators/availability.validator'

describe('Availability Validator Error Cases', () => {
	test('throws error for non-object availability', () => {
		// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
		expect(() => validateWeeklyAvailability(null as any)).toThrow('Availability must be an object')
		// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
		expect(() => validateWeeklyAvailability('invalid' as any)).toThrow('Availability must be an object')
		// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
		expect(() => validateWeeklyAvailability(123 as any)).toThrow('Availability must be an object')
		// Arrays are objects in JavaScript, so they pass the typeof check but fail the schedules check
		// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
		expect(() => validateWeeklyAvailability([] as any)).toThrow('Availability.schedules must be an array')
	})

	test('throws error for invalid schedules array', () => {
		// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
		expect(() => validateWeeklyAvailability({ schedules: null as any })).toThrow(
			'Availability.schedules must be an array'
		)
		// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
		expect(() => validateWeeklyAvailability({ schedules: 'invalid' as any })).toThrow(
			'Availability.schedules must be an array'
		)
		// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
		expect(() => validateWeeklyAvailability({ schedules: {} as any })).toThrow(
			'Availability.schedules must be an array'
		)
	})

	test('throws error for empty schedules array', () => {
		expect(() => validateWeeklyAvailability({ schedules: [] })).toThrow('Availability.schedules cannot be empty')
	})

	test('throws error for invalid schedule objects', () => {
		expect(() =>
			validateWeeklyAvailability({
				// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
				schedules: [null as any],
			})
		).toThrow('Schedule at index 0 must be an object')

		expect(() =>
			validateWeeklyAvailability({
				// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
				schedules: ['invalid' as any],
			})
		).toThrow('Schedule at index 0 must be an object')

		expect(() =>
			validateWeeklyAvailability({
				// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
				schedules: [123 as any],
			})
		).toThrow('Schedule at index 0 must be an object')
	})

	test('throws error for invalid days array', () => {
		expect(() =>
			validateWeeklyAvailability({
				// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
				schedules: [{ days: null as any, start: '09:00', end: '17:00' }],
			})
		).toThrow('Schedule at index 0: days must be an array')

		expect(() =>
			validateWeeklyAvailability({
				// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
				schedules: [{ days: 'monday' as any, start: '09:00', end: '17:00' }],
			})
		).toThrow('Schedule at index 0: days must be an array')

		expect(() =>
			validateWeeklyAvailability({
				// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
				schedules: [{ days: {} as any, start: '09:00', end: '17:00' }],
			})
		).toThrow('Schedule at index 0: days must be an array')
	})

	test('throws error for invalid day names', () => {
		expect(() =>
			validateWeeklyAvailability({
				// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
				schedules: [{ days: ['invalidday'] as any, start: '09:00', end: '17:00' }],
			})
		).toThrow(
			'Schedule at index 0: invalid day "invalidday". Valid days: monday, tuesday, wednesday, thursday, friday, saturday, sunday'
		)

		expect(() =>
			validateWeeklyAvailability({
				// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
				schedules: [{ days: ['monday', 'funday'] as any, start: '09:00', end: '17:00' }],
			})
		).toThrow(
			'Schedule at index 0: invalid day "funday". Valid days: monday, tuesday, wednesday, thursday, friday, saturday, sunday'
		)
	})

	test('throws error for duplicate days within same schedule', () => {
		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday', 'monday'], start: '09:00', end: '17:00' }],
			})
		).toThrow('Schedule at index 0: duplicate days found')

		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['tuesday', 'wednesday', 'tuesday'], start: '09:00', end: '17:00' }],
			})
		).toThrow('Schedule at index 0: duplicate days found')
	})

	test('throws error for invalid string time formats', () => {
		// Invalid start time formats
		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday'], start: 'invalid', end: '17:00' }],
			})
		).toThrow('Schedule at index 0: start must be in HH:mm format (e.g., "09:00")')

		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday'], start: '25:00', end: '17:00' }],
			})
		).toThrow('Schedule at index 0: start must be in HH:mm format (e.g., "09:00")')

		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday'], start: '09:70', end: '17:00' }],
			})
		).toThrow('Schedule at index 0: start must be in HH:mm format (e.g., "09:00")')

		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday'], start: '9:70', end: '17:00' }],
			})
		).toThrow('Schedule at index 0: start must be in HH:mm format (e.g., "09:00")')

		// Invalid end time formats
		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday'], start: '09:00', end: 'invalid' }],
			})
		).toThrow('Schedule at index 0: end must be in HH:mm format (e.g., "17:00")')

		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday'], start: '09:00', end: '25:00' }],
			})
		).toThrow('Schedule at index 0: end must be in HH:mm format (e.g., "17:00")')

		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday'], start: '09:00', end: '17:70' }],
			})
		).toThrow('Schedule at index 0: end must be in HH:mm format (e.g., "17:00")')
	})

	test('throws error for invalid number time formats', () => {
		// Invalid start time numbers
		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday'], start: -1, end: 1020 }],
			})
		).toThrow('Schedule at index 0: start must be between 0 and 1439 minutes')

		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday'], start: 1440, end: 1020 }],
			})
		).toThrow('Schedule at index 0: start must be between 0 and 1439 minutes')

		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday'], start: 2000, end: 1020 }],
			})
		).toThrow('Schedule at index 0: start must be between 0 and 1439 minutes')

		// Invalid end time numbers
		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday'], start: 540, end: -1 }],
			})
		).toThrow('Schedule at index 0: end must be between 0 and 1439 minutes')

		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday'], start: 540, end: 1440 }],
			})
		).toThrow('Schedule at index 0: end must be between 0 and 1439 minutes')

		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday'], start: 540, end: 3000 }],
			})
		).toThrow('Schedule at index 0: end must be between 0 and 1439 minutes')
	})

	test('throws error for invalid time types', () => {
		// Invalid start time types
		expect(() =>
			validateWeeklyAvailability({
				// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
				schedules: [{ days: ['monday'], start: null as any, end: '17:00' }],
			})
		).toThrow('Schedule at index 0: start must be a string (HH:mm) or number (minutes)')

		expect(() =>
			validateWeeklyAvailability({
				// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
				schedules: [{ days: ['monday'], start: {} as any, end: '17:00' }],
			})
		).toThrow('Schedule at index 0: start must be a string (HH:mm) or number (minutes)')

		expect(() =>
			validateWeeklyAvailability({
				// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
				schedules: [{ days: ['monday'], start: [] as any, end: '17:00' }],
			})
		).toThrow('Schedule at index 0: start must be a string (HH:mm) or number (minutes)')

		// Invalid end time types
		expect(() =>
			validateWeeklyAvailability({
				// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
				schedules: [{ days: ['monday'], start: '09:00', end: null as any }],
			})
		).toThrow('Schedule at index 0: end must be a string (HH:mm) or number (minutes)')

		expect(() =>
			validateWeeklyAvailability({
				// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
				schedules: [{ days: ['monday'], start: '09:00', end: {} as any }],
			})
		).toThrow('Schedule at index 0: end must be a string (HH:mm) or number (minutes)')

		expect(() =>
			validateWeeklyAvailability({
				// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
				schedules: [{ days: ['monday'], start: '09:00', end: [] as any }],
			})
		).toThrow('Schedule at index 0: end must be a string (HH:mm) or number (minutes)')
	})

	test('throws error for invalid time ranges (start >= end)', () => {
		// String format - start after end
		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday'], start: '17:00', end: '09:00' }],
			})
		).toThrow('Schedule at index 0: start time (17:00) must be before end time (09:00)')

		// String format - start equals end
		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday'], start: '12:00', end: '12:00' }],
			})
		).toThrow('Schedule at index 0: start time (12:00) must be before end time (12:00)')

		// Number format - start after end
		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday'], start: 1020, end: 540 }],
			})
		).toThrow('Schedule at index 0: start time (1020) must be before end time (540)')

		// Number format - start equals end
		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday'], start: 720, end: 720 }],
			})
		).toThrow('Schedule at index 0: start time (720) must be before end time (720)')

		// Mixed formats
		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: ['monday'], start: '17:00', end: 540 }],
			})
		).toThrow('Schedule at index 0: start time (17:00) must be before end time (540)')
	})

	test('throws error for overlapping schedules on same day', () => {
		// Complete overlap
		expect(() =>
			validateWeeklyAvailability({
				schedules: [
					{ days: ['monday'], start: '09:00', end: '17:00' },
					{ days: ['monday'], start: '10:00', end: '16:00' },
				],
			})
		).toThrow('Overlapping schedules found for monday: schedule 1 (10:00-16:00) overlaps with schedule 0')

		// Partial overlap - start overlaps
		expect(() =>
			validateWeeklyAvailability({
				schedules: [
					{ days: ['tuesday'], start: '09:00', end: '12:00' },
					{ days: ['tuesday'], start: '11:00', end: '15:00' },
				],
			})
		).toThrow('Overlapping schedules found for tuesday: schedule 1 (11:00-15:00) overlaps with schedule 0')

		// Partial overlap - end overlaps
		expect(() =>
			validateWeeklyAvailability({
				schedules: [
					{ days: ['wednesday'], start: '13:00', end: '17:00' },
					{ days: ['wednesday'], start: '09:00', end: '14:00' },
				],
			})
		).toThrow('Overlapping schedules found for wednesday: schedule 1 (09:00-14:00) overlaps with schedule 0')

		// Touching schedules (should not overlap)
		expect(() =>
			validateWeeklyAvailability({
				schedules: [
					{ days: ['thursday'], start: '09:00', end: '12:00' },
					{ days: ['thursday'], start: '12:00', end: '17:00' },
				],
			})
		).not.toThrow()

		// Mixed number and string formats overlapping
		expect(() =>
			validateWeeklyAvailability({
				schedules: [
					{ days: ['friday'], start: 540, end: 720 }, // 09:00-12:00
					{ days: ['friday'], start: '11:00', end: '15:00' },
				],
			})
		).toThrow('Overlapping schedules found for friday: schedule 1 (11:00-15:00) overlaps with schedule 0')

		// Multiple day overlap
		expect(() =>
			validateWeeklyAvailability({
				schedules: [
					{ days: ['saturday', 'sunday'], start: '10:00', end: '14:00' },
					{ days: ['sunday'], start: '12:00', end: '16:00' },
				],
			})
		).toThrow('Overlapping schedules found for sunday: schedule 1 (12:00-16:00) overlaps with schedule 0')
	})

	test('throws errors with correct schedule indices for multiple schedules', () => {
		// Error in second schedule
		expect(() =>
			validateWeeklyAvailability({
				schedules: [
					{ days: ['monday'], start: '09:00', end: '17:00' },
					{ days: ['tuesday'], start: 'invalid', end: '17:00' },
				],
			})
		).toThrow('Schedule at index 1: start must be in HH:mm format (e.g., "09:00")')

		// Error in third schedule
		expect(() =>
			validateWeeklyAvailability({
				schedules: [
					{ days: ['monday'], start: '09:00', end: '17:00' },
					{ days: ['tuesday'], start: '10:00', end: '16:00' },
					{ days: ['wednesday'], start: 540, end: 300 },
				],
			})
		).toThrow('Schedule at index 2: start time (540) must be before end time (300)')
	})

	test('allows valid schedules to pass', () => {
		// Valid string format
		expect(() =>
			validateWeeklyAvailability({
				schedules: [
					{ days: ['monday', 'tuesday'], start: '09:00', end: '17:00' },
					{ days: ['wednesday'], start: '10:00', end: '16:00' },
				],
			})
		).not.toThrow()

		// Valid number format
		expect(() =>
			validateWeeklyAvailability({
				schedules: [
					{ days: ['thursday'], start: 540, end: 1020 }, // 09:00-17:00
					{ days: ['friday'], start: 600, end: 960 }, // 10:00-16:00
				],
			})
		).not.toThrow()

		// Mixed formats
		expect(() =>
			validateWeeklyAvailability({
				schedules: [
					{ days: ['saturday'], start: '09:00', end: '17:00' },
					{ days: ['sunday'], start: 600, end: 960 },
				],
			})
		).not.toThrow()

		// Empty days array (should be valid)
		expect(() =>
			validateWeeklyAvailability({
				schedules: [{ days: [], start: '09:00', end: '17:00' }],
			})
		).not.toThrow()

		// Boundary values
		expect(() =>
			validateWeeklyAvailability({
				schedules: [
					{ days: ['monday'], start: 0, end: 1439 }, // 00:00-23:59
					{ days: ['tuesday'], start: '00:00', end: '23:59' },
				],
			})
		).not.toThrow()
	})

	test('allows undefined availability (optional parameter)', () => {
		expect(() => validateWeeklyAvailability(undefined)).not.toThrow()
		expect(() => validateWeeklyAvailability()).not.toThrow()
	})
})
