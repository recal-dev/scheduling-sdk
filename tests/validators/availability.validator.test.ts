import { describe, test, expect } from 'bun:test'
import { validateWeeklyAvailability } from '../../src/validators/availability.validator.ts'
import type { WeeklyAvailability } from '../../src/types/availability.types.ts'

describe('validateWeeklyAvailability', () => {
    test('validates undefined availability (should pass)', () => {
        expect(() => validateWeeklyAvailability()).not.toThrow()
        expect(() => validateWeeklyAvailability(undefined)).not.toThrow()
    })

    test('validates valid availability', () => {
        const availability: WeeklyAvailability = {
            schedules: [
                { days: ['monday', 'tuesday'], start: '09:00', end: '17:00' },
                { days: ['wednesday'], start: '10:00', end: '16:00' }
            ],
            timezone: 'America/New_York'
        }
        expect(() => validateWeeklyAvailability(availability)).not.toThrow()
    })

    test('validates availability without timezone', () => {
        const availability: WeeklyAvailability = {
            schedules: [
                { days: ['monday'], start: '09:00', end: '17:00' }
            ]
        }
        expect(() => validateWeeklyAvailability(availability)).not.toThrow()
    })

    test('throws for non-object availability', () => {
        expect(() => validateWeeklyAvailability('invalid' as unknown as WeeklyAvailability)).toThrow('Availability must be an object')
        expect(() => validateWeeklyAvailability(123 as unknown as WeeklyAvailability)).toThrow('Availability must be an object')
        expect(() => validateWeeklyAvailability(null as unknown as WeeklyAvailability)).toThrow('Availability must be an object')
    })

    test('throws for missing schedules array', () => {
        expect(() => validateWeeklyAvailability({} as unknown as WeeklyAvailability)).toThrow('Availability.schedules must be an array')
        expect(() => validateWeeklyAvailability({ schedules: 'invalid' } as unknown as WeeklyAvailability)).toThrow('Availability.schedules must be an array')
    })

    test('throws for empty schedules array', () => {
        expect(() => validateWeeklyAvailability({ schedules: [] })).toThrow('Availability.schedules cannot be empty')
    })

    test('throws for invalid timezone', () => {
        const availability = {
            schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
            timezone: ''
        }
        expect(() => validateWeeklyAvailability(availability as unknown as WeeklyAvailability)).toThrow('Availability.timezone must be a non-empty string')
        
        const availability2 = {
            schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
            timezone: 'invalid-timezone'
        }
        expect(() => validateWeeklyAvailability(availability2 as unknown as WeeklyAvailability)).toThrow('Availability.timezone must be a valid IANA timezone identifier')
    })

    test('throws for non-object schedule', () => {
        const availability = {
            schedules: ['invalid']
        }
        expect(() => validateWeeklyAvailability(availability as unknown as WeeklyAvailability)).toThrow('Schedule at index 0 must be an object')
    })

    test('throws for missing days array', () => {
        const availability = {
            schedules: [{ start: '09:00', end: '17:00' }]
        }
        expect(() => validateWeeklyAvailability(availability as unknown as WeeklyAvailability)).toThrow('Schedule at index 0: days must be an array')
    })

    test('throws for empty days array', () => {
        const availability = {
            schedules: [{ days: [], start: '09:00', end: '17:00' }]
        }
        expect(() => validateWeeklyAvailability(availability as unknown as WeeklyAvailability)).toThrow('Schedule at index 0: days array cannot be empty')
    })

    test('throws for invalid day names', () => {
        const availability = {
            schedules: [{ days: ['invalid-day'], start: '09:00', end: '17:00' }]
        }
        expect(() => validateWeeklyAvailability(availability as unknown as WeeklyAvailability)).toThrow('Schedule at index 0: invalid day "invalid-day"')
    })

    test('throws for duplicate days in same schedule', () => {
        const availability = {
            schedules: [{ days: ['monday', 'monday'], start: '09:00', end: '17:00' }]
        }
        expect(() => validateWeeklyAvailability(availability as unknown as WeeklyAvailability)).toThrow('Schedule at index 0: duplicate days found')
    })

    test('throws for invalid time format', () => {
        const availability1 = {
            schedules: [{ days: ['monday'], start: 'invalid', end: '17:00' }]
        }
        expect(() => validateWeeklyAvailability(availability1 as unknown as WeeklyAvailability)).toThrow('Schedule at index 0: start must be in HH:mm format')

        const availability2 = {
            schedules: [{ days: ['monday'], start: '09:00', end: 'invalid' }]
        }
        expect(() => validateWeeklyAvailability(availability2 as unknown as WeeklyAvailability)).toThrow('Schedule at index 0: end must be in HH:mm format')

        const availability3 = {
            schedules: [{ days: ['monday'], start: '25:00', end: '17:00' }]
        }
        expect(() => validateWeeklyAvailability(availability3 as unknown as WeeklyAvailability)).toThrow('Schedule at index 0: start must be in HH:mm format')
    })

    test('throws for invalid time range (start >= end)', () => {
        const availability1 = {
            schedules: [{ days: ['monday'], start: '17:00', end: '09:00' }]
        }
        expect(() => validateWeeklyAvailability(availability1 as unknown as WeeklyAvailability)).toThrow('Schedule at index 0: start time (17:00) must be before end time (09:00)')

        const availability2 = {
            schedules: [{ days: ['monday'], start: '09:00', end: '09:00' }]
        }
        expect(() => validateWeeklyAvailability(availability2 as unknown as WeeklyAvailability)).toThrow('Schedule at index 0: start time (09:00) must be before end time (09:00)')
    })

    test('throws for overlapping schedules on same day', () => {
        const availability = {
            schedules: [
                { days: ['monday'], start: '09:00', end: '17:00' },
                { days: ['monday'], start: '16:00', end: '18:00' }
            ]
        }
        expect(() => validateWeeklyAvailability(availability as unknown as WeeklyAvailability)).toThrow('Overlapping schedules found for monday')
    })

    test('allows adjacent schedules on same day', () => {
        const availability = {
            schedules: [
                { days: ['monday'], start: '09:00', end: '12:00' },
                { days: ['monday'], start: '12:00', end: '17:00' }
            ]
        }
        expect(() => validateWeeklyAvailability(availability as unknown as WeeklyAvailability)).not.toThrow()
    })

    test('allows same day in different schedules if no overlap', () => {
        const availability = {
            schedules: [
                { days: ['monday'], start: '09:00', end: '12:00' },
                { days: ['monday'], start: '13:00', end: '17:00' }
            ]
        }
        expect(() => validateWeeklyAvailability(availability as unknown as WeeklyAvailability)).not.toThrow()
    })

    test('validates all valid day names', () => {
        const availability = {
            schedules: [
                { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], start: '09:00', end: '17:00' }
            ]
        }
        expect(() => validateWeeklyAvailability(availability as unknown as WeeklyAvailability)).not.toThrow()
    })

    test('validates edge case times', () => {
        const availability = {
            schedules: [
                { days: ['monday'], start: '00:00', end: '23:59' }
            ]
        }
        expect(() => validateWeeklyAvailability(availability as unknown as WeeklyAvailability)).not.toThrow()
    })
})