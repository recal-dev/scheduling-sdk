import { describe, expect, it } from 'bun:test'
import type { SchedulingOptions } from '../../src/types/scheduling.types.ts'
import {
	validateDuration,
	validateOffset,
	validateOptions,
	validatePadding,
	validateSplit,
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
			expect(() => validateDuration('30' as unknown)).toThrow('Slot duration must be a positive number')
			expect(() => validateDuration(null as unknown)).toThrow('Slot duration must be a positive number')
			expect(() => validateDuration(undefined as unknown)).toThrow('Slot duration must be a positive number')
			expect(() => validateDuration({} as unknown)).toThrow('Slot duration must be a positive number')
			expect(() => validateDuration([] as unknown)).toThrow('Slot duration must be a positive number')
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
			expect(() => validateSplit('30' as unknown)).toThrow('Slot split must be a positive number')
			expect(() => validateSplit(null as unknown)).toThrow('Slot split must be a positive number')
			expect(() => validateSplit(undefined as unknown)).toThrow('Slot split must be a positive number')
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
			expect(() => validateOffset('15' as unknown)).toThrow('Offset must be a non-negative number')
			expect(() => validateOffset(null as unknown)).toThrow('Offset must be a non-negative number')
			expect(() => validateOffset(undefined as unknown)).toThrow('Offset must be a non-negative number')
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
			expect(() => validatePadding('15' as unknown)).toThrow('Padding must be a non-negative number')
			expect(() => validatePadding(null as unknown)).toThrow('Padding must be a non-negative number')
			expect(() => validatePadding(undefined as unknown)).toThrow('Padding must be a non-negative number')
		})
	})

	describe('edge cases and boundary conditions', () => {
		it('should handle very small positive numbers', () => {
			expect(() => validateDuration(0.001)).not.toThrow()
			expect(() => validateSplit(0.001, 60)).not.toThrow()
			expect(() => validateOffset(0.001)).not.toThrow()
			expect(() => validatePadding(0.001)).not.toThrow()
		})

		it('should handle very large numbers', () => {
			const largeNumber = Number.MAX_SAFE_INTEGER
			expect(() => validateDuration(largeNumber)).not.toThrow()
			expect(() => validateSplit(largeNumber, 60)).not.toThrow()
			expect(() => validateOffset(largeNumber)).not.toThrow()
			expect(() => validatePadding(largeNumber)).not.toThrow()
		})

		it('should handle decimal numbers', () => {
			expect(() => validateDuration(30.5)).not.toThrow()
			expect(() => validateSplit(15.25, 60)).not.toThrow()
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
	})
})
