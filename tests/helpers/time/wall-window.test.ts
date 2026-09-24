import { describe, expect, test } from 'bun:test'
import { resolveWallWindow } from '../../../src/helpers/time/timezone'

/**
 * A weekly pattern names times on the host's clock, so the rule is simply: every instant the
 * window returns must read, on that clock, as a time inside the window — and every instant it
 * leaves out must not.
 *
 * Stating it as an invariant rather than as expected outputs is deliberate. The two defects this
 * replaces were each an answer someone had written down by running the code, so the tests agreed
 * with the implementation and could not disagree with the bug.
 */

const ZONES = [
	'UTC',
	'America/New_York',
	'Europe/Berlin',
	'Asia/Kolkata',
	'Pacific/Auckland',
	'Australia/Lord_Howe',
	'America/Santiago',
	'Asia/Tehran',
]

/** Transition weekends north and south, plus ordinary dates. */
const DATES: Array<[number, number, number]> = [
	[2024, 2, 10],
	[2024, 10, 3],
	[2024, 2, 31],
	[2024, 9, 27],
	[2024, 8, 29],
	[2024, 3, 7],
	[2024, 5, 11],
	[2024, 0, 1],
	[2024, 11, 31],
]

const WINDOWS: Array<[number, number]> = [
	[540, 1020],
	[60, 300],
	[0, 1440],
	[1320, 1440],
	[150, 300],
	[0, 60],
	[690, 780],
]

function wallMinutes(instant: Date, timezone: string): number {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: timezone,
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	}).formatToParts(instant)
	const read = (type: string): number => Number(parts.find(part => part.type === type)?.value ?? '0')
	return (read('hour') % 24) * 60 + read('minute')
}

function localDate(instant: Date, timezone: string): string {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(instant)
}

describe('resolveWallWindow', () => {
	// A sweep, not an example: it resolves every zone x date x window combination and probes
	// inside each interval, which is thousands of offset lookups and well past the default limit.
	test('returns only instants whose local clock reads inside the window', () => {
		let probes = 0

		for (const timezone of ZONES) {
			for (const [year, month, day] of DATES) {
				for (const [startMinutes, endMinutes] of WINDOWS) {
					const intervals = resolveWallWindow(year, month, day, startMinutes, endMinutes, timezone)
					const expectedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

					for (const interval of intervals) {
						expect(interval.start.getTime()).toBeLessThan(interval.end.getTime())

						// Sample the inside of each interval; the exclusive end is not part of it.
						const span = interval.end.getTime() - interval.start.getTime()
						for (const fraction of [0, 0.25, 0.5, 0.75, 0.99]) {
							const instant = new Date(interval.start.getTime() + Math.floor(span * fraction))
							const minutes = wallMinutes(instant, timezone)
							const onExpectedDate = localDate(instant, timezone) === expectedDate
							const withinWindow =
								endMinutes >= 1440
									? minutes >= startMinutes && onExpectedDate
									: minutes >= startMinutes && minutes < endMinutes && onExpectedDate
							expect(withinWindow).toBe(true)
							probes++
						}
					}
				}
			}
		}

		expect(probes).toBeGreaterThan(1000)
	}, 30_000)

	test('loses exactly the skipped hour when the clock springs forward', () => {
		const intervals = resolveWallWindow(2024, 2, 10, 60, 300, 'America/New_York')
		const elapsed = intervals.reduce((sum, i) => sum + (i.end.getTime() - i.start.getTime()), 0)

		expect(elapsed).toBe(3 * 60 * 60 * 1000)
	})

	test('covers the repeated hour twice when the clock falls back', () => {
		const intervals = resolveWallWindow(2024, 10, 3, 60, 300, 'America/New_York')
		const elapsed = intervals.reduce((sum, i) => sum + (i.end.getTime() - i.start.getTime()), 0)

		expect(elapsed).toBe(5 * 60 * 60 * 1000)
	})

	test('omits a window whose wall time the clock never reaches', () => {
		expect(resolveWallWindow(2024, 2, 10, 150, 180, 'America/New_York')).toEqual([])
	})

	test('is unchanged on an ordinary day', () => {
		const intervals = resolveWallWindow(2024, 5, 11, 540, 1020, 'America/New_York')

		expect(intervals).toHaveLength(1)
		expect(intervals[0]!.start.toISOString()).toBe('2024-06-11T13:00:00.000Z')
		expect(intervals[0]!.end.toISOString()).toBe('2024-06-11T21:00:00.000Z')
	})
})
