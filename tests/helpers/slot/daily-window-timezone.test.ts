import { describe, expect, test } from 'bun:test'
import { Scheduler } from '../../../src/core/scheduler'

/**
 * `earliestTime`/`latestTime` describe a time of day on the caller's clock, so the window has to
 * be measured there.
 *
 * It was measured on the slot's UTC calendar date instead, which is a different day for any local
 * time that straddles UTC midnight — the evening west of UTC, the early morning east of it. The
 * slot was then tested against the neighbouring day's window and silently dropped.
 */

function localHours(slots: { start: Date }[], timeZone: string): string[] {
	return slots.map(slot =>
		new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false }).format(
			slot.start
		)
	)
}

describe('daily window across a UTC day boundary', () => {
	test('keeps every New York evening slot inside a 09:00-22:00 window', () => {
		const slots = new Scheduler([]).findAvailableSlots(
			new Date('2024-01-15T14:00:00Z'),
			new Date('2024-01-16T04:00:00Z'),
			{ slotDuration: 60, timezone: 'America/New_York', earliestTime: '09:00', latestTime: '22:00' }
		)

		expect(localHours(slots, 'America/New_York')).toEqual([
			'09:00',
			'10:00',
			'11:00',
			'12:00',
			'13:00',
			'14:00',
			'15:00',
			'16:00',
			'17:00',
			'18:00',
			'19:00',
			'20:00',
			'21:00',
		])
	})

	test('keeps every Tokyo early-morning slot inside a 02:00-06:00 window', () => {
		const slots = new Scheduler([]).findAvailableSlots(
			new Date('2024-01-14T15:00:00Z'),
			new Date('2024-01-15T00:00:00Z'),
			{ slotDuration: 60, timezone: 'Asia/Tokyo', earliestTime: '02:00', latestTime: '06:00' }
		)

		expect(localHours(slots, 'Asia/Tokyo')).toEqual(['02:00', '03:00', '04:00', '05:00'])
	})

	test('treats latestTime 24:00 as the end of the local day', () => {
		const slots = new Scheduler([]).findAvailableSlots(
			new Date('2024-01-15T14:00:00Z'),
			new Date('2024-01-16T06:00:00Z'),
			{ slotDuration: 60, timezone: 'America/New_York', earliestTime: '20:00', latestTime: '24:00' }
		)

		expect(localHours(slots, 'America/New_York')).toEqual(['20:00', '21:00', '22:00', '23:00'])
	})

	test('offers nothing outside the window, whatever the grid the range start implies', () => {
		const slots = new Scheduler([]).findAvailableSlots(
			new Date('2024-01-15T13:59:00Z'),
			new Date('2024-01-15T18:00:00Z'),
			{ slotDuration: 30, timezone: 'America/New_York', earliestTime: '09:00', latestTime: '11:00' }
		)

		expect(slots.length).toBeGreaterThan(0)
		for (const local of localHours(slots, 'America/New_York')) {
			expect(local >= '09:00' && local < '11:00').toBe(true)
		}
	})
})
