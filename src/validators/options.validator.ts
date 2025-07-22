import type { SchedulingOptions } from '../types/scheduling.types.ts'

export function validateOptions(options: SchedulingOptions): void {
	validateDuration(options.slotDuration)

	if (options.padding !== undefined) {
		validatePadding(options.padding)
	}

	if (options.slotSplit !== undefined) {
		validateSplit(options.slotSplit)
	}

	if (options.offset !== undefined) {
		validateOffset(options.offset)
	}
}

export function validateDuration(duration: number): void {
	if (typeof duration !== 'number' || duration <= 0 || !Number.isFinite(duration)) {
		throw new Error('Slot duration must be a positive number')
	}
}

export function validateSplit(split: number): void {
	if (typeof split !== 'number' || split <= 0 || !Number.isFinite(split)) {
		throw new Error('Slot split must be a positive number')
	}
}

export function validateOffset(offset: number): void {
	if (typeof offset !== 'number' || offset < 0 || !Number.isFinite(offset)) {
		throw new Error('Offset must be a non-negative number')
	}
}

export function validatePadding(padding: number): void {
	if (typeof padding !== 'number' || padding < 0 || !Number.isFinite(padding)) {
		throw new Error('Padding must be a non-negative number')
	}
}
