import { describe, expect, test } from 'bun:test'
import { Scheduler } from '../../src/core/scheduler'

/**
 * What the scheduler accepts, and what it keeps.
 *
 * An `Invalid Date` compares false against everything, so a list containing one sorts into no
 * order at all and the scan that assumes order can walk past a real meeting — offering a slot
 * that is already taken. Rejecting it at ingest keeps that from ever becoming a scheduling
 * answer, and names the bad input while the caller can still see it.
 */

const busy = (hour: number) => ({
	start: new Date(Date.UTC(2024, 0, 15, hour)),
	end: new Date(Date.UTC(2024, 0, 15, hour + 1)),
})

const WINDOW = [new Date('2024-01-15T09:00:00Z'), new Date('2024-01-15T16:00:00Z')] as const

describe('busy time ingest', () => {
	describe('rejects what it cannot schedule against', () => {
		test('an unparseable start', () => {
			expect(() => new Scheduler([{ start: new Date('nope'), end: new Date('2024-01-15T11:00:00Z') }])).toThrow(
				/start must be a valid Date/
			)
		})

		test('an unparseable end', () => {
			expect(
				() => new Scheduler([{ start: new Date('2024-01-15T10:00:00Z'), end: new Date(undefined as never) }])
			).toThrow(/end must be a valid Date/)
		})

		test('an interval that ends before it starts', () => {
			expect(
				() =>
					new Scheduler([{ start: new Date('2024-01-15T11:00:00Z'), end: new Date('2024-01-15T10:00:00Z') }])
			).toThrow(/is before start/)
		})

		test('the same way through addBusyTime and addBusyTimes', () => {
			const scheduler = new Scheduler()

			expect(() => scheduler.addBusyTime({ start: new Date('nope'), end: new Date('nope') })).toThrow(
				/valid Date/
			)
			expect(() =>
				scheduler.addBusyTimes([busy(10), { start: new Date('nope'), end: new Date('nope') }])
			).toThrow(/valid Date/)
		})

		test('rather than letting one bad entry hide the real meetings', () => {
			const scheduler = new Scheduler([busy(10), busy(12)])
			expect(() => scheduler.addBusyTime({ start: new Date('nope'), end: new Date('nope') })).toThrow()

			const offered = scheduler
				.findAvailableSlots(WINDOW[0], WINDOW[1], { slotDuration: 60 })
				.map(slot => slot.start.toISOString().slice(11, 16))

			expect(offered).not.toContain('10:00')
			expect(offered).not.toContain('12:00')
		})
	})

	describe('keeps its own copy', () => {
		test('so mutating the input afterwards does not change the answer', () => {
			const input = [busy(10)]
			const scheduler = new Scheduler(input)

			input[0]!.end = new Date('2024-01-15T15:00:00Z')

			const offered = scheduler
				.findAvailableSlots(WINDOW[0], WINDOW[1], { slotDuration: 60 })
				.map(slot => slot.start.toISOString().slice(11, 16))

			expect(offered).toContain('11:00')
			expect(offered).not.toContain('10:00')
		})

		test('so mutating what getBusyTimes returns does not change the answer', () => {
			const scheduler = new Scheduler([busy(10)])

			const returned = scheduler.getBusyTimes()
			returned[0]!.end = new Date('2024-01-15T15:00:00Z')

			expect(scheduler.getBusyTimes()[0]!.end.toISOString()).toBe('2024-01-15T11:00:00.000Z')
		})
	})
})
