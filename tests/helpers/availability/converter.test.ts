import { describe, test, expect } from 'bun:test'
import { weeklyAvailabilityToBusyTimes } from '../../../src/helpers/availability/converter.ts'
import type { WeeklyAvailability } from '../../../src/types/availability.types.ts'

describe('weeklyAvailabilityToBusyTimes', () => {
    const mondayStart = new Date('2024-01-01T00:00:00Z') // Monday

    test('converts single day availability to busy times', () => {
        const availability: WeeklyAvailability = {
            schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
        }

        const busyTimes = weeklyAvailabilityToBusyTimes(availability, mondayStart)

        // Should have busy times for:
        // - Monday 00:00-09:00 and 17:00-24:00
        // - Tuesday-Sunday all day
        expect(busyTimes).toHaveLength(8) // 2 for Monday + 6 full days

        // Check Monday busy times
        const mondayBusy = busyTimes.filter(
            bt => bt.start.getDay() === 1 // Monday
        )
        expect(mondayBusy).toHaveLength(2)
        expect(mondayBusy[0]!.start).toEqual(new Date('2024-01-01T00:00:00Z'))
        expect(mondayBusy[0]!.end).toEqual(new Date('2024-01-01T09:00:00Z'))
        expect(mondayBusy[1]!.start).toEqual(new Date('2024-01-01T17:00:00Z'))
        expect(mondayBusy[1]!.end).toEqual(new Date('2024-01-01T23:59:59.999Z'))
    })

    test('converts multiple days availability', () => {
        const availability: WeeklyAvailability = {
            schedules: [{ days: ['monday', 'wednesday', 'friday'], start: '09:00', end: '17:00' }],
        }

        const busyTimes = weeklyAvailabilityToBusyTimes(availability, mondayStart)

        // Should have busy times for start/end of available days + full busy days
        expect(busyTimes).toHaveLength(10) // 6 partial busy periods + 4 full days
    })

    test('converts multiple schedules for same day (breaks)', () => {
        const availability: WeeklyAvailability = {
            schedules: [
                { days: ['monday'], start: '09:00', end: '12:00' },
                { days: ['monday'], start: '13:00', end: '17:00' },
            ],
        }

        const busyTimes = weeklyAvailabilityToBusyTimes(availability, mondayStart)

        // Should have busy times for:
        // - Monday 00:00-09:00, 12:00-13:00, 17:00-24:00
        // - Tuesday-Sunday all day
        const mondayBusy = busyTimes.filter(bt => bt.start.getDay() === 1)
        expect(mondayBusy).toHaveLength(3)

        // Check lunch break busy time
        const lunchBreak = mondayBusy.find(bt => bt.start.getHours() === 12 && bt.end.getHours() === 13)
        expect(lunchBreak).toBeDefined()
    })

    test('handles full day availability', () => {
        const availability: WeeklyAvailability = {
            schedules: [{ days: ['monday'], start: '00:00', end: '23:59' }],
        }

        const busyTimes = weeklyAvailabilityToBusyTimes(availability, mondayStart)

        // Should have busy times for Tuesday-Sunday (6 days) + 1 minute at end of Monday
        expect(busyTimes).toHaveLength(7)

        // One tiny busy time for Monday (23:59-24:00)
        const mondayBusy = busyTimes.filter(bt => bt.start.getDay() === 1)
        expect(mondayBusy).toHaveLength(1)
        expect(mondayBusy[0]!.start.getHours()).toBe(23)
        expect(mondayBusy[0]!.start.getMinutes()).toBe(59)
    })

    test('handles no availability (all days busy)', () => {
        const availability: WeeklyAvailability = {
            schedules: [],
        }

        const busyTimes = weeklyAvailabilityToBusyTimes(availability, mondayStart)
        expect(busyTimes).toHaveLength(7) // All 7 days busy
    })

    test('throws error for non-Monday start date', () => {
        const tuesday = new Date('2024-01-02T00:00:00Z')
        const availability: WeeklyAvailability = {
            schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
        }

        expect(() => weeklyAvailabilityToBusyTimes(availability, tuesday)).toThrow('weekStart must be a Monday')
    })

    test('throws error for invalid time range', () => {
        const availability: WeeklyAvailability = {
            schedules: [{ days: ['monday'], start: '17:00', end: '09:00' }],
        }

        expect(() => weeklyAvailabilityToBusyTimes(availability, mondayStart)).toThrow('Invalid time range')
    })

    test('throws error for invalid time format', () => {
        const availability: WeeklyAvailability = {
            schedules: [{ days: ['monday'], start: '25:00', end: '17:00' }],
        }

        expect(() => weeklyAvailabilityToBusyTimes(availability, mondayStart)).toThrow('Invalid time format')
    })

    test('handles weekend availability', () => {
        const availability: WeeklyAvailability = {
            schedules: [{ days: ['saturday', 'sunday'], start: '10:00', end: '16:00' }],
        }

        const busyTimes = weeklyAvailabilityToBusyTimes(availability, mondayStart)

        // Should have busy times for Monday-Friday (full) + Saturday-Sunday (partial)
        expect(busyTimes).toHaveLength(9) // 5 full days + 4 partial periods for weekend

        const saturdayBusy = busyTimes.filter(bt => bt.start.getDay() === 6)
        const sundayBusy = busyTimes.filter(bt => bt.start.getDay() === 0)

        expect(saturdayBusy).toHaveLength(2) // Before 10:00 and after 16:00
        expect(sundayBusy).toHaveLength(2) // Before 10:00 and after 16:00
    })

    test('handles complex weekly schedule', () => {
        const availability: WeeklyAvailability = {
            schedules: [
                { days: ['monday', 'tuesday', 'wednesday'], start: '09:00', end: '17:00' },
                { days: ['thursday', 'friday'], start: '10:00', end: '16:00' },
                { days: ['saturday'], start: '09:00', end: '12:00' },
            ],
        }

        const busyTimes = weeklyAvailabilityToBusyTimes(availability, mondayStart)

        // Complex calculation: various partial busy periods + Sunday full day
        expect(busyTimes.length).toBeGreaterThan(0)

        // Sunday should be fully busy (single busy time for the entire day)
        const sundayBusy = busyTimes.filter(bt => bt.start.getDay() === 0)
        expect(sundayBusy).toHaveLength(1)
        expect(sundayBusy[0]!.start.getHours()).toBe(0)
        expect(sundayBusy[0]!.end.getHours()).toBe(23)
    })
})
