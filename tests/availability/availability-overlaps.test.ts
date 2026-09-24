import { describe, expect, test } from 'bun:test'
import { AvailabilityScheduler } from '../../src/availability/scheduler'
import type { DayOfWeek } from '../../src/types/availability.types'
import type { BusyTime, TimeSlot } from '../../src/types/scheduling.types'

/**
 * How `maxOverlaps` and a weekly availability pattern combine.
 *
 * They answer different questions and must not be counted together: `maxOverlaps` says how many
 * *meetings* may share a moment, while the pattern says when bookings are possible at all.
 * Counting the pattern as an ordinary busy time gives it depth one, so any `maxOverlaps >= 1`
 * waves it through and offers the whole day.
 */

const MONDAY_9_TO_5 = { days: ['monday'] as DayOfWeek[], start: '09:00', end: '17:00' }
const MONDAY = new Date('2024-01-15T00:00:00Z')
const TUESDAY = new Date('2024-01-16T00:00:00Z')

function busy(start: string, end: string): BusyTime {
	return { start: new Date(`2024-01-15T${start}:00Z`), end: new Date(`2024-01-15T${end}:00Z`) }
}

function scheduler(busyTimes: BusyTime[] = [], schedules = [MONDAY_9_TO_5]): AvailabilityScheduler {
	const instance = new AvailabilityScheduler({ schedules })
	if (busyTimes.length > 0) instance.addBusyTimes(busyTimes)
	return instance
}

function startsOf(slots: TimeSlot[]): string[] {
	return slots.map(slot => slot.start.toISOString().slice(11, 16))
}

function hourSlots(instance: AvailabilityScheduler, maxOverlaps: number, from = MONDAY, to = TUESDAY): TimeSlot[] {
	return instance.findAvailableSlots(from, to, { slotDuration: 60, maxOverlaps })
}

describe('maxOverlaps with a weekly availability pattern', () => {
	describe('the pattern bounds the answer at every K', () => {
		test.each([0, 1, 2, 5])('K=%i offers only the eight hours the pattern allows', maxOverlaps => {
			const slots = hourSlots(scheduler(), maxOverlaps)

			expect(startsOf(slots)).toEqual(['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'])
			expect(slots.at(-1)?.end.toISOString()).toBe('2024-01-15T17:00:00.000Z')
		})

		test('a day the pattern does not cover yields nothing, whatever K is', () => {
			const tuesdayToWednesday = [TUESDAY, new Date('2024-01-17T00:00:00Z')] as const

			for (const maxOverlaps of [0, 1, 3]) {
				const slots = hourSlots(scheduler(), maxOverlaps, tuesdayToWednesday[0], tuesdayToWednesday[1])
				expect(slots).toEqual([])
			}
		})

		test('a meeting outside the pattern changes nothing, because that time was never offered', () => {
			const outside = scheduler([busy('03:00', '04:00')])

			expect(startsOf(hourSlots(outside, 1))).toEqual(startsOf(hourSlots(scheduler(), 1)))
		})

		test('a pattern covering several days offers each of them and nothing between', () => {
			const monAndWed = scheduler(
				[],
				[{ days: ['monday', 'wednesday'] as DayOfWeek[], start: '09:00', end: '11:00' }]
			)

			const slots = monAndWed.findAvailableSlots(MONDAY, new Date('2024-01-19T00:00:00Z'), {
				slotDuration: 60,
				maxOverlaps: 1,
			})

			expect(slots.map(slot => slot.start.toISOString())).toEqual([
				'2024-01-15T09:00:00.000Z',
				'2024-01-15T10:00:00.000Z',
				'2024-01-17T09:00:00.000Z',
				'2024-01-17T10:00:00.000Z',
			])
		})
	})

	describe('K counts meetings, and only meetings', () => {
		test('one meeting is still offered at K=1 and withheld at K=0', () => {
			const oneMeeting = () => scheduler([busy('10:00', '11:00')])

			expect(startsOf(hourSlots(oneMeeting(), 1))).toContain('10:00')
			expect(startsOf(hourSlots(oneMeeting(), 0))).not.toContain('10:00')
		})

		test('two meetings on one hour need K=2, and withhold only that hour', () => {
			const doubleBooked = () => scheduler([busy('10:00', '11:00'), busy('10:00', '11:00')])

			expect(startsOf(hourSlots(doubleBooked(), 1))).not.toContain('10:00')
			expect(startsOf(hourSlots(doubleBooked(), 2))).toContain('10:00')
			expect(startsOf(hourSlots(doubleBooked(), 1))).toEqual([
				'09:00',
				'11:00',
				'12:00',
				'13:00',
				'14:00',
				'15:00',
				'16:00',
			])
		})

		test('depth is counted per moment, so partly overlapping meetings withhold only their shared part', () => {
			const staggered = scheduler([busy('10:00', '11:00'), busy('10:30', '11:30')])

			const slots = hourSlots(staggered, 1)

			const coversSharedHalfHour = slots.some(
				slot =>
					slot.start.getTime() < Date.parse('2024-01-15T11:00:00Z') &&
					slot.end.getTime() > Date.parse('2024-01-15T10:30:00Z')
			)
			expect(coversSharedHalfHour).toBe(false)
			expect(startsOf(slots)).toContain('09:00')
		})

		test('a meeting running past the end of the pattern never extends it', () => {
			const overrunning = () => scheduler([busy('16:30', '17:30')])

			expect(startsOf(hourSlots(overrunning(), 0))).not.toContain('16:00')
			expect(startsOf(hourSlots(overrunning(), 1))).toContain('16:00')
			for (const maxOverlaps of [0, 1, 2]) {
				const last = hourSlots(overrunning(), maxOverlaps).at(-1)
				expect(last === undefined || last.end.getTime() <= Date.parse('2024-01-15T17:00:00Z')).toBe(true)
			}
		})
	})

	describe('slots stay whole', () => {
		test('no slot is emitted that would run past the end of the pattern', () => {
			const slots = scheduler().findAvailableSlots(MONDAY, TUESDAY, { slotDuration: 90, maxOverlaps: 1 })

			expect(slots.every(slot => slot.end.getTime() <= Date.parse('2024-01-15T17:00:00Z'))).toBe(true)
			expect(slots.every(slot => slot.start.getTime() >= Date.parse('2024-01-15T09:00:00Z'))).toBe(true)
		})

		test('a gap too short for the duration is not offered', () => {
			const tightGap = scheduler([busy('09:00', '10:00'), busy('10:30', '17:00')])

			expect(hourSlots(tightGap, 0)).toEqual([])
		})
	})

	describe('a pattern given in a timezone', () => {
		test('K=1 keeps to the pattern once it is resolved to UTC', () => {
			const newYork = new AvailabilityScheduler(
				{ schedules: [{ days: ['monday'] as DayOfWeek[], start: '09:00', end: '17:00' }] },
				'America/New_York'
			)

			const slots = newYork.findAvailableSlots(MONDAY, TUESDAY, { slotDuration: 60, maxOverlaps: 1 })

			expect(startsOf(slots)).toEqual(['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'])
		})
	})
})
