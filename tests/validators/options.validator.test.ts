import { describe, expect, it } from 'bun:test'
import type { SchedulingOptions } from '../../src/types/scheduling.types.ts'
import {
	validateDailyWindow,
	validateDuration,
	validateMaxOverlaps,
	validateOffset,
	validateOptions,
	validatePadding,
	validateSplit,
	validateTimezone,
} from '../../src/validators/options.validator.ts'

describe('Options Validator', () => {
	describe('validateOptions', () => {
		it('should validate valid options without throwing', () => {
			const validOptions: SchedulingOptions = {
				slotDuration: 60,
				slotSplit: 30,
				padding: 15,
				offset: 10,
			}

			expect(() => validateOptions(validOptions)).not.toThrow()
		})

		it('should validate minimal valid options', () => {
			const minimalOptions: SchedulingOptions = {
				slotDuration: 30,
			}

			expect(() => validateOptions(minimalOptions)).not.toThrow()
		})

		it('should throw for invalid slot duration', () => {
			const invalidOptions: SchedulingOptions = {
				slotDuration: -30,
			}

			expect(() => validateOptions(invalidOptions)).toThrow('Slot duration must be a positive number')
		})

		it('should throw for invalid padding', () => {
			const invalidOptions: SchedulingOptions = {
				slotDuration: 60,
				padding: -10,
			}

			expect(() => validateOptions(invalidOptions)).toThrow('Padding must be a non-negative number')
		})

		it('should throw for invalid slot split', () => {
			const invalidOptions: SchedulingOptions = {
				slotDuration: 60,
				slotSplit: 0,
			}

			expect(() => validateOptions(invalidOptions)).toThrow('Slot split must be a positive number')
		})

		it('should throw for invalid offset', () => {
			const invalidOptions: SchedulingOptions = {
				slotDuration: 60,
				offset: -5,
			}

			expect(() => validateOptions(invalidOptions)).toThrow('Offset must be a non-negative number')
		})

		it('should handle undefined optional fields', () => {
			const optionsWithUndefined: SchedulingOptions = {
				slotDuration: 60,
				slotSplit: undefined,
				padding: undefined,
				offset: undefined,
			}

			expect(() => validateOptions(optionsWithUndefined)).not.toThrow()
		})
	})

	describe('validateDuration', () => {
		it('should accept positive numbers', () => {
			expect(() => validateDuration(30)).not.toThrow()
			expect(() => validateDuration(60)).not.toThrow()
			expect(() => validateDuration(120)).not.toThrow()
			expect(() => validateDuration(0.5)).not.toThrow()
		})

		it('should reject zero', () => {
			expect(() => validateDuration(0)).toThrow('Slot duration must be a positive number')
		})

		it('should reject negative numbers', () => {
			expect(() => validateDuration(-30)).toThrow('Slot duration must be a positive number')
			expect(() => validateDuration(-1)).toThrow('Slot duration must be a positive number')
		})

		it('should reject non-finite numbers', () => {
			expect(() => validateDuration(Infinity)).toThrow('Slot duration must be a positive number')
			expect(() => validateDuration(-Infinity)).toThrow('Slot duration must be a positive number')
			expect(() => validateDuration(NaN)).toThrow('Slot duration must be a positive number')
		})

		it('should reject non-numbers', () => {
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
			expect(() => validateDuration('30' as any)).toThrow('Slot duration must be a positive number')
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
			expect(() => validateDuration(null as any)).toThrow('Slot duration must be a positive number')
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
			expect(() => validateDuration(undefined as any)).toThrow('Slot duration must be a positive number')
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
			expect(() => validateDuration({} as any)).toThrow('Slot duration must be a positive number')
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative test
			expect(() => validateDuration([] as any)).toThrow('Slot duration must be a positive number')
		})
	})

	describe('validateSplit', () => {
		it('should accept positive numbers', () => {
			expect(() => validateSplit(15)).not.toThrow()
			expect(() => validateSplit(30)).not.toThrow()
			expect(() => validateSplit(60)).not.toThrow()
			expect(() => validateSplit(120)).not.toThrow()
		})

		it('should reject zero', () => {
			expect(() => validateSplit(0)).toThrow('Slot split must be a positive number')
		})

		it('should reject negative numbers', () => {
			expect(() => validateSplit(-30)).toThrow('Slot split must be a positive number')
			expect(() => validateSplit(-1)).toThrow('Slot split must be a positive number')
		})

		it('should reject non-finite numbers', () => {
			expect(() => validateSplit(Infinity)).toThrow('Slot split must be a positive number')
			expect(() => validateSplit(-Infinity)).toThrow('Slot split must be a positive number')
			expect(() => validateSplit(NaN)).toThrow('Slot split must be a positive number')
		})

		it('should reject non-numbers', () => {
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative tests
			expect(() => validateSplit('30' as any)).toThrow('Slot split must be a positive number')
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative tests
			expect(() => validateSplit(null as any)).toThrow('Slot split must be a positive number')
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative tests
			expect(() => validateSplit(undefined as any)).toThrow('Slot split must be a positive number')
		})
	})

	describe('validateOffset', () => {
		it('should accept zero', () => {
			expect(() => validateOffset(0)).not.toThrow()
		})

		it('should accept positive numbers', () => {
			expect(() => validateOffset(5)).not.toThrow()
			expect(() => validateOffset(15)).not.toThrow()
			expect(() => validateOffset(30)).not.toThrow()
			expect(() => validateOffset(0.5)).not.toThrow()
		})

		it('should reject negative numbers', () => {
			expect(() => validateOffset(-1)).toThrow('Offset must be a non-negative number')
			expect(() => validateOffset(-30)).toThrow('Offset must be a non-negative number')
		})

		it('should reject non-finite numbers', () => {
			expect(() => validateOffset(Infinity)).toThrow('Offset must be a non-negative number')
			expect(() => validateOffset(-Infinity)).toThrow('Offset must be a non-negative number')
			expect(() => validateOffset(NaN)).toThrow('Offset must be a non-negative number')
		})

		it('should reject non-numbers', () => {
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative tests
			expect(() => validateOffset('15' as any)).toThrow('Offset must be a non-negative number')
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative tests
			expect(() => validateOffset(null as any)).toThrow('Offset must be a non-negative number')
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative tests
			expect(() => validateOffset(undefined as any)).toThrow('Offset must be a non-negative number')
		})
	})

	describe('validatePadding', () => {
		it('should accept zero', () => {
			expect(() => validatePadding(0)).not.toThrow()
		})

		it('should accept positive numbers', () => {
			expect(() => validatePadding(5)).not.toThrow()
			expect(() => validatePadding(15)).not.toThrow()
			expect(() => validatePadding(30)).not.toThrow()
			expect(() => validatePadding(0.5)).not.toThrow()
		})

		it('should reject negative numbers', () => {
			expect(() => validatePadding(-1)).toThrow('Padding must be a non-negative number')
			expect(() => validatePadding(-30)).toThrow('Padding must be a non-negative number')
		})

		it('should reject non-finite numbers', () => {
			expect(() => validatePadding(Infinity)).toThrow('Padding must be a non-negative number')
			expect(() => validatePadding(-Infinity)).toThrow('Padding must be a non-negative number')
			expect(() => validatePadding(NaN)).toThrow('Padding must be a non-negative number')
		})

		it('should reject non-numbers', () => {
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative tests
			expect(() => validatePadding('15' as any)).toThrow('Padding must be a non-negative number')
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative tests
			expect(() => validatePadding(null as any)).toThrow('Padding must be a non-negative number')
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative tests
			expect(() => validatePadding(undefined as any)).toThrow('Padding must be a non-negative number')
		})
	})

	describe('validateMaxOverlaps', () => {
		it('should accept zero', () => {
			expect(() => validateMaxOverlaps(0)).not.toThrow()
		})

		it('should accept positive integers', () => {
			expect(() => validateMaxOverlaps(1)).not.toThrow()
			expect(() => validateMaxOverlaps(5)).not.toThrow()
			expect(() => validateMaxOverlaps(10)).not.toThrow()
			expect(() => validateMaxOverlaps(100)).not.toThrow()
		})

		it('should reject negative numbers', () => {
			expect(() => validateMaxOverlaps(-1)).toThrow('maxOverlaps must be a non-negative integer')
			expect(() => validateMaxOverlaps(-10)).toThrow('maxOverlaps must be a non-negative integer')
		})

		it('should reject non-integers', () => {
			expect(() => validateMaxOverlaps(1.5)).toThrow('maxOverlaps must be a non-negative integer')
			expect(() => validateMaxOverlaps(0.1)).toThrow('maxOverlaps must be a non-negative integer')
			expect(() => validateMaxOverlaps(10.99)).toThrow('maxOverlaps must be a non-negative integer')
		})

		it('should reject non-finite numbers', () => {
			expect(() => validateMaxOverlaps(Infinity)).toThrow('maxOverlaps must be a non-negative integer')
			expect(() => validateMaxOverlaps(-Infinity)).toThrow('maxOverlaps must be a non-negative integer')
			expect(() => validateMaxOverlaps(NaN)).toThrow('maxOverlaps must be a non-negative integer')
		})

		it('should reject non-numbers', () => {
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative tests
			expect(() => validateMaxOverlaps('5' as any)).toThrow('maxOverlaps must be a non-negative integer')
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative tests
			expect(() => validateMaxOverlaps(null as any)).toThrow('maxOverlaps must be a non-negative integer')
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative tests
			expect(() => validateMaxOverlaps(undefined as any)).toThrow('maxOverlaps must be a non-negative integer')
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative tests
			expect(() => validateMaxOverlaps({} as any)).toThrow('maxOverlaps must be a non-negative integer')
			// biome-ignore lint/suspicious/noExplicitAny: needed for negative tests
			expect(() => validateMaxOverlaps([] as any)).toThrow('maxOverlaps must be a non-negative integer')
		})
	})

	describe('validateTimezone', () => {
		it('should accept valid IANA timezones', () => {
			expect(() => validateTimezone('America/New_York')).not.toThrow()
			expect(() => validateTimezone('Europe/London')).not.toThrow()
			expect(() => validateTimezone('Asia/Tokyo')).not.toThrow()
			expect(() => validateTimezone('UTC')).not.toThrow()
			expect(() => validateTimezone('America/Los_Angeles')).not.toThrow()
		})

		it('should throw for undefined timezone', () => {
			expect(() => validateTimezone(undefined)).toThrow(
				'Timezone must be specified when using earliestTime/latestTime'
			)
		})

		it('should throw for empty string timezone', () => {
			expect(() => validateTimezone('')).toThrow('Invalid timezone: . Must be a valid IANA timezone identifier.')
		})

		it('should throw for invalid timezone strings', () => {
			expect(() => validateTimezone('Invalid/Timezone')).toThrow(
				'Invalid timezone: Invalid/Timezone. Must be a valid IANA timezone identifier.'
			)
			expect(() => validateTimezone('NotATimezone')).toThrow(
				'Invalid timezone: NotATimezone. Must be a valid IANA timezone identifier.'
			)
			expect(() => validateTimezone('America/InvalidCity')).toThrow(
				'Invalid timezone: America/InvalidCity. Must be a valid IANA timezone identifier.'
			)
			expect(() => validateTimezone('123')).toThrow(
				'Invalid timezone: 123. Must be a valid IANA timezone identifier.'
			)
		})
	})

	describe('validateDailyWindow', () => {
		describe('with HH:mm string format', () => {
			it('should accept valid time windows', () => {
				expect(() => validateDailyWindow('09:00', '17:00')).not.toThrow()
				expect(() => validateDailyWindow('00:00', '23:59')).not.toThrow()
				expect(() => validateDailyWindow('00:00', '24:00')).not.toThrow()
				expect(() => validateDailyWindow('08:30', '18:45')).not.toThrow()
			})

			it('should accept undefined values (uses defaults)', () => {
				expect(() => validateDailyWindow(undefined, '17:00')).not.toThrow()
				expect(() => validateDailyWindow('09:00', undefined)).not.toThrow()
				expect(() => validateDailyWindow(undefined, undefined)).not.toThrow()
			})

			it('should throw for invalid time format', () => {
				expect(() => validateDailyWindow('25:00', '17:00')).toThrow(
					'Invalid time format: 25:00. Expected HH:mm (0<=HH<=23, 0<=MM<=59)'
				)
				expect(() => validateDailyWindow('09:60', '17:00')).toThrow(
					'Invalid time format: 09:60. Expected HH:mm (0<=HH<=23, 0<=MM<=59)'
				)
				expect(() => validateDailyWindow('09:00', '24:01')).toThrow(
					'Invalid time format: 24:01. Expected HH:mm (0<=HH<=23, 0<=MM<=59)'
				)
				expect(() => validateDailyWindow('9:00', '17:00')).toThrow('Invalid time format: 9:00. Expected HH:mm')
				expect(() => validateDailyWindow('09', '17:00')).toThrow('Invalid time format: 09. Expected HH:mm')
				expect(() => validateDailyWindow('abc', '17:00')).toThrow('Invalid time format: abc. Expected HH:mm')
				expect(() => validateDailyWindow('09:00', 'xyz')).toThrow('Invalid time format: xyz. Expected HH:mm')
			})

			it('should throw when earliest is not before latest', () => {
				expect(() => validateDailyWindow('17:00', '09:00')).toThrow(
					'earliestTime (17:00) must be before latestTime (09:00)'
				)
				expect(() => validateDailyWindow('12:00', '12:00')).toThrow(
					'earliestTime (12:00) must be before latestTime (12:00)'
				)
				expect(() => validateDailyWindow('23:59', '00:00')).toThrow(
					'earliestTime (23:59) must be before latestTime (00:00)'
				)
			})
		})

		describe('with minute numbers', () => {
			it('should accept valid minute ranges', () => {
				expect(() => validateDailyWindow(0, 1440)).not.toThrow()
				expect(() => validateDailyWindow(540, 1020)).not.toThrow() // 9:00 to 17:00
				expect(() => validateDailyWindow(0, 1439)).not.toThrow()
				expect(() => validateDailyWindow(60, 120)).not.toThrow()
			})

			it('should throw for out of range minutes', () => {
				expect(() => validateDailyWindow(-1, 1440)).toThrow(
					'Time minutes must be between 0 and 1439 (received -1)'
				)
				expect(() => validateDailyWindow(1440, 1440)).toThrow(
					'Time minutes must be between 0 and 1439 (received 1440)'
				)
				expect(() => validateDailyWindow(0, 1441)).toThrow(
					'Time minutes must be between 0 and 1440 (received 1441)'
				)
				expect(() => validateDailyWindow(0, -1)).toThrow(
					'Time minutes must be between 0 and 1440 (received -1)'
				)
			})

			it('should throw for non-finite numbers', () => {
				expect(() => validateDailyWindow(Infinity, 1440)).toThrow('Time must be a finite number of minutes')
				expect(() => validateDailyWindow(0, Infinity)).toThrow('Time must be a finite number of minutes')
				expect(() => validateDailyWindow(NaN, 1440)).toThrow('Time must be a finite number of minutes')
				expect(() => validateDailyWindow(0, NaN)).toThrow('Time must be a finite number of minutes')
			})

			it('should throw when earliest is not before latest', () => {
				expect(() => validateDailyWindow(1020, 540)).toThrow(
					'earliestTime (1020) must be before latestTime (540)'
				)
				expect(() => validateDailyWindow(720, 720)).toThrow(
					'earliestTime (720) must be before latestTime (720)'
				)
			})
		})

		describe('with mixed formats', () => {
			it('should accept mixed valid formats', () => {
				expect(() => validateDailyWindow('09:00', 1020)).not.toThrow() // 9:00 to 17:00
				expect(() => validateDailyWindow(540, '17:00')).not.toThrow() // 9:00 to 17:00
			})

			it('should throw for invalid combinations', () => {
				expect(() => validateDailyWindow('17:00', 540)).toThrow(
					'earliestTime (17:00) must be before latestTime (540)'
				)
				expect(() => validateDailyWindow(1020, '09:00')).toThrow(
					'earliestTime (1020) must be before latestTime (09:00)'
				)
			})
		})
	})

	describe('edge cases and boundary conditions', () => {
		it('should handle very small positive numbers', () => {
			expect(() => validateDuration(0.001)).not.toThrow()
			expect(() => validateSplit(0.001)).not.toThrow()
			expect(() => validateOffset(0.001)).not.toThrow()
			expect(() => validatePadding(0.001)).not.toThrow()
		})

		it('should handle very large numbers', () => {
			const largeNumber = Number.MAX_SAFE_INTEGER
			expect(() => validateDuration(largeNumber)).not.toThrow()
			expect(() => validateSplit(largeNumber)).not.toThrow()
			expect(() => validateOffset(largeNumber)).not.toThrow()
			expect(() => validatePadding(largeNumber)).not.toThrow()
		})

		it('should handle decimal numbers', () => {
			expect(() => validateDuration(30.5)).not.toThrow()
			expect(() => validateSplit(15.25)).not.toThrow()
			expect(() => validateOffset(7.5)).not.toThrow()
			expect(() => validatePadding(2.75)).not.toThrow()
		})
	})

	describe('comprehensive integration tests', () => {
		it('should validate complex valid options', () => {
			const complexOptions: SchedulingOptions = {
				slotDuration: 90,
				slotSplit: 30,
				padding: 10,
				offset: 15,
			}

			expect(() => validateOptions(complexOptions)).not.toThrow()
		})

		it('should validate options with zero padding and offset', () => {
			const zeroOptions: SchedulingOptions = {
				slotDuration: 60,
				slotSplit: 30,
				padding: 0,
				offset: 0,
			}

			expect(() => validateOptions(zeroOptions)).not.toThrow()
		})

		it('should handle mixed valid and undefined options', () => {
			const mixedOptions: SchedulingOptions = {
				slotDuration: 45,
				slotSplit: 15,
				padding: undefined,
				offset: 20,
			}

			expect(() => validateOptions(mixedOptions)).not.toThrow()
		})

		it('should validate options with maxOverlaps', () => {
			const optionsWithOverlaps: SchedulingOptions = {
				slotDuration: 60,
				maxOverlaps: 3,
			}

			expect(() => validateOptions(optionsWithOverlaps)).not.toThrow()
		})

		it('should throw for invalid maxOverlaps in options', () => {
			const invalidOptions: SchedulingOptions = {
				slotDuration: 60,
				maxOverlaps: -1,
			}

			expect(() => validateOptions(invalidOptions)).toThrow('maxOverlaps must be a non-negative integer')
		})

		it('should validate options with timezone and daily windows', () => {
			const optionsWithTimezone: SchedulingOptions = {
				slotDuration: 30,
				timezone: 'America/New_York',
				earliestTime: '09:00',
				latestTime: '17:00',
			}

			expect(() => validateOptions(optionsWithTimezone)).not.toThrow()
		})

		it('should validate options with timezone and minute-based daily windows', () => {
			const optionsWithMinutes: SchedulingOptions = {
				slotDuration: 30,
				timezone: 'Europe/London',
				earliestTime: 540, // 9:00
				latestTime: 1020, // 17:00
			}

			expect(() => validateOptions(optionsWithMinutes)).not.toThrow()
		})

		it('should validate options with timezone and only earliestTime', () => {
			const optionsWithEarliest: SchedulingOptions = {
				slotDuration: 30,
				timezone: 'Asia/Tokyo',
				earliestTime: '08:00',
			}

			expect(() => validateOptions(optionsWithEarliest)).not.toThrow()
		})

		it('should validate options with timezone and only latestTime', () => {
			const optionsWithLatest: SchedulingOptions = {
				slotDuration: 30,
				timezone: 'UTC',
				latestTime: '20:00',
			}

			expect(() => validateOptions(optionsWithLatest)).not.toThrow()
		})

		it('should throw when earliestTime/latestTime is provided without timezone', () => {
			const optionsWithoutTimezone: SchedulingOptions = {
				slotDuration: 30,
				earliestTime: '09:00',
				latestTime: '17:00',
			}

			expect(() => validateOptions(optionsWithoutTimezone)).toThrow(
				'Timezone must be specified when using earliestTime/latestTime'
			)
		})

		it('should throw when only earliestTime is provided without timezone', () => {
			const optionsWithoutTimezone: SchedulingOptions = {
				slotDuration: 30,
				earliestTime: '09:00',
			}

			expect(() => validateOptions(optionsWithoutTimezone)).toThrow(
				'Timezone must be specified when using earliestTime/latestTime'
			)
		})

		it('should throw when only latestTime is provided without timezone', () => {
			const optionsWithoutTimezone: SchedulingOptions = {
				slotDuration: 30,
				latestTime: '17:00',
			}

			expect(() => validateOptions(optionsWithoutTimezone)).toThrow(
				'Timezone must be specified when using earliestTime/latestTime'
			)
		})

		it('should throw for invalid timezone in options', () => {
			const optionsWithInvalidTimezone: SchedulingOptions = {
				slotDuration: 30,
				timezone: 'Invalid/Zone',
				earliestTime: '09:00',
				latestTime: '17:00',
			}

			expect(() => validateOptions(optionsWithInvalidTimezone)).toThrow(
				'Invalid timezone: Invalid/Zone. Must be a valid IANA timezone identifier.'
			)
		})

		it('should throw for invalid time window in options', () => {
			const optionsWithInvalidWindow: SchedulingOptions = {
				slotDuration: 30,
				timezone: 'America/New_York',
				earliestTime: '17:00',
				latestTime: '09:00',
			}

			expect(() => validateOptions(optionsWithInvalidWindow)).toThrow(
				'earliestTime (17:00) must be before latestTime (09:00)'
			)
		})

		it('should validate options with all features combined', () => {
			const fullOptions: SchedulingOptions = {
				slotDuration: 45,
				slotSplit: 15,
				padding: 5,
				offset: 10,
				maxOverlaps: 2,
				timezone: 'America/Chicago',
				earliestTime: '08:30',
				latestTime: '18:30',
			}

			expect(() => validateOptions(fullOptions)).not.toThrow()
		})
	})
})
