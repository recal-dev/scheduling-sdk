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

	if (options.maxOverlaps !== undefined) {
		validateMaxOverlaps(options.maxOverlaps)
	}

	// If earliest/latest are provided, ensure timezone is present
	const hasDailyWindow = options.earliestTime !== undefined || options.latestTime !== undefined
	if (hasDailyWindow) {
		validateTimezone(options.timezone)
		validateDailyWindow(options.earliestTime, options.latestTime)
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

export function validateMaxOverlaps(maxOverlaps: number): void {
	if (
		typeof maxOverlaps !== 'number' ||
		!Number.isFinite(maxOverlaps) ||
		maxOverlaps < 0 ||
		!Number.isInteger(maxOverlaps)
	) {
		throw new Error('maxOverlaps must be a non-negative integer')
	}
}

export function validateTimezone(timezone?: string): void {
	if (timezone === undefined) {
		throw new Error('Timezone must be specified when using earliestTime/latestTime')
	}
	if (timezone === '') {
		throw new Error(`Invalid timezone: ${timezone}. Must be a valid IANA timezone identifier.`)
	}
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: timezone })
	} catch {
		throw new Error(`Invalid timezone: ${timezone}. Must be a valid IANA timezone identifier.`)
	}
}

function parseTimeToMinutes(time: string | number, allowEndOfDay: boolean): number {
	if (typeof time === 'number') {
		if (!Number.isFinite(time)) throw new Error('Time must be a finite number of minutes')
		if (time < 0 || time > (allowEndOfDay ? 1440 : 1439)) {
			throw new Error(`Time minutes must be between 0 and ${allowEndOfDay ? 1440 : 1439} (received ${time})`)
		}
		return time
	}

	// Expect HH:mm
	const [hoursStr, minutesStr] = time.split(':')
	const hours = Number.parseInt(hoursStr!, 10)
	const minutes = Number.parseInt(minutesStr!, 10)
	if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
		throw new Error(`Invalid time format: ${time}. Expected HH:mm`)
	}
	if (hours === 24 && minutes === 0 && allowEndOfDay) {
		return 1440
	}
	if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
		throw new Error(`Invalid time format: ${time}. Expected HH:mm`)
	}
	return hours * 60 + minutes
}

export function validateDailyWindow(earliest?: string | number, latest?: string | number): void {
	// earliest defaults to 0, latest defaults to 1440 for validation purposes
	const earliestMinutes = earliest === undefined ? 0 : parseTimeToMinutes(earliest, false)
	const latestMinutes = latest === undefined ? 1440 : parseTimeToMinutes(latest, true)

	if (!(earliestMinutes < latestMinutes)) {
		const earliestStr = typeof earliest === 'string' ? earliest : String(earliestMinutes)
		const latestStr = typeof latest === 'string' ? latest : String(latestMinutes)
		throw new Error(`earliestTime (${earliestStr}) must be before latestTime (${latestStr})`)
	}
}
