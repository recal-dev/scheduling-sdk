import { describe, test, expect } from 'bun:test'
import { AvailabilityScheduler } from '../../src/availability/scheduler.ts'
import type { WeeklyAvailability } from '../../src/index.ts'

describe('Availability Integration Tests - 30 Comprehensive Test Cases', () => {
    // Positive Tests (15)
    describe('Positive Tests', () => {
        test('1. Basic availability - single day, single schedule', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T08:00:00Z'),
                new Date('2024-01-01T18:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(slots).toHaveLength(8)
            expect(slots[0]!.start).toEqual(new Date('2024-01-01T09:00:00Z'))
            expect(slots[7]!.end).toEqual(new Date('2024-01-01T17:00:00Z'))
        })

        test('2. Multiple days with same schedule', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday', 'tuesday', 'wednesday'], start: '09:00', end: '17:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T09:00:00Z'),
                new Date('2024-01-03T17:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(slots).toHaveLength(24) // 8 slots per day × 3 days
        })

        test('3. Different schedules for different days', () => {
            const availability: WeeklyAvailability = {
                schedules: [
                    { days: ['monday'], start: '09:00', end: '17:00' },
                    { days: ['tuesday'], start: '10:00', end: '16:00' },
                ],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const mondaySlots = scheduler.findAvailableSlots(
                new Date('2024-01-01T09:00:00Z'),
                new Date('2024-01-01T17:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            const tuesdaySlots = scheduler.findAvailableSlots(
                new Date('2024-01-02T10:00:00Z'),
                new Date('2024-01-02T16:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(mondaySlots).toHaveLength(8)
            expect(tuesdaySlots).toHaveLength(6)
        })

        test('4. Breaks implementation using multiple schedules', () => {
            const availability: WeeklyAvailability = {
                schedules: [
                    { days: ['monday'], start: '09:00', end: '12:00' },
                    { days: ['monday'], start: '13:00', end: '17:00' },
                ],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T09:00:00Z'),
                new Date('2024-01-01T17:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(slots).toHaveLength(7) // 3 + 4 slots (lunch break excluded)
            expect(slots[2]!.end).toEqual(new Date('2024-01-01T12:00:00Z'))
            expect(slots[3]!.start).toEqual(new Date('2024-01-01T13:00:00Z'))
        })

        test('5. Weekend availability', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['saturday', 'sunday'], start: '10:00', end: '14:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-06T10:00:00Z'), // Saturday
                new Date('2024-01-07T14:00:00Z'), // Sunday
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(slots).toHaveLength(8) // 4 slots per day × 2 days
        })

        test('6. 30-minute slots with availability', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '09:00', end: '11:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T09:00:00Z'),
                new Date('2024-01-01T11:00:00Z'),
                { slotDuration: 30, slotSplit: 30 }
            )

            expect(slots).toHaveLength(4) // 30-min slots in 2-hour window
        })

        test('7. 15-minute slots with breaks', () => {
            const availability: WeeklyAvailability = {
                schedules: [
                    { days: ['monday'], start: '09:00', end: '09:30' },
                    { days: ['monday'], start: '09:45', end: '10:15' },
                ],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T09:00:00Z'),
                new Date('2024-01-01T10:15:00Z'),
                { slotDuration: 15, slotSplit: 15 }
            )

            expect(slots).toHaveLength(4) // 2 slots + 2 slots with 15-min break
        })

        test('8. Combining availability with existing busy times', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)
            scheduler.addBusyTime({
                start: new Date('2024-01-01T10:00:00Z'),
                end: new Date('2024-01-01T11:00:00Z'),
            })

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T09:00:00Z'),
                new Date('2024-01-01T17:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(slots).toHaveLength(7) // 8 - 1 busy hour
        })

        test('9. Early morning availability', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '06:00', end: '10:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T06:00:00Z'),
                new Date('2024-01-01T10:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(slots).toHaveLength(4)
            expect(slots[0]!.start.getHours()).toBe(6)
        })

        test('10. Late evening availability', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['friday'], start: '20:00', end: '23:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-05T20:00:00Z'), // Friday
                new Date('2024-01-05T23:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(slots).toHaveLength(3)
        })

        test('11. All days of week availability', () => {
            const availability: WeeklyAvailability = {
                schedules: [
                    {
                        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                        start: '08:00',
                        end: '20:00',
                    },
                ],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T08:00:00Z'),
                new Date('2024-01-07T20:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(slots).toHaveLength(84) // 12 hours × 7 days
        })

        test('12. Split slots with gaps', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T09:00:00Z'),
                new Date('2024-01-01T17:00:00Z'),
                { slotDuration: 60, slotSplit: 120 }
            )

            expect(slots).toHaveLength(4) // Every 2 hours
        })

        test('13. Multiple busy times with availability', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '08:00', end: '18:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)
            scheduler.addBusyTimes([
                { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T10:00:00Z') },
                { start: new Date('2024-01-01T14:00:00Z'), end: new Date('2024-01-01T15:00:00Z') },
            ])

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T08:00:00Z'),
                new Date('2024-01-01T18:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(slots).toHaveLength(8) // 10 - 2 busy hours
        })

        test('14. Adjacent availability periods (should work as continuous)', () => {
            const availability: WeeklyAvailability = {
                schedules: [
                    { days: ['monday'], start: '09:00', end: '13:00' },
                    { days: ['monday'], start: '13:00', end: '17:00' },
                ],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T09:00:00Z'),
                new Date('2024-01-01T17:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(slots).toHaveLength(8) // Should work as continuous availability
        })

        test('15. Cross-week availability check', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['sunday', 'monday'], start: '10:00', end: '16:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const sundaySlots = scheduler.findAvailableSlots(
                new Date('2024-01-07T10:00:00Z'), // Sunday
                new Date('2024-01-07T16:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            const mondaySlots = scheduler.findAvailableSlots(
                new Date('2024-01-08T10:00:00Z'), // Next Monday
                new Date('2024-01-08T16:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(sundaySlots).toHaveLength(6)
            expect(mondaySlots).toHaveLength(6)
        })
    })

    // Negative Tests (15)
    describe('Negative Tests', () => {
        test('16. No slots on unavailable day', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-02T09:00:00Z'), // Tuesday (not available)
                new Date('2024-01-02T17:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(slots).toHaveLength(0)
        })

        test('17. No slots before availability start time', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T06:00:00Z'),
                new Date('2024-01-01T08:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(slots).toHaveLength(0)
        })

        test('18. No slots after availability end time', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T18:00:00Z'),
                new Date('2024-01-01T20:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(slots).toHaveLength(0)
        })

        test('19. Entire availability blocked by busy time', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)
            scheduler.addBusyTime({
                start: new Date('2024-01-01T08:00:00Z'),
                end: new Date('2024-01-01T18:00:00Z'),
            })

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T09:00:00Z'),
                new Date('2024-01-01T17:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(slots).toHaveLength(0)
        })

        test('20. No slots when slot duration exceeds availability window', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '09:00', end: '09:30' }],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T09:00:00Z'),
                new Date('2024-01-01T09:30:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(slots).toHaveLength(0)
        })

        test('21. Break period completely blocks availability', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '09:00', end: '10:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)
            scheduler.addBusyTime({
                start: new Date('2024-01-01T09:00:00Z'),
                end: new Date('2024-01-01T10:00:00Z'),
            })

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T09:00:00Z'),
                new Date('2024-01-01T10:00:00Z'),
                { slotDuration: 30, slotSplit: 30 }
            )

            expect(slots).toHaveLength(0)
        })

        test('22. Weekend unavailable with weekday-only schedule', () => {
            const availability: WeeklyAvailability = {
                schedules: [
                    { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '09:00', end: '17:00' },
                ],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-06T09:00:00Z'), // Saturday
                new Date('2024-01-07T17:00:00Z'), // Sunday
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(slots).toHaveLength(0)
        })

        test('23. Past time request (edge case)', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2023-12-31T09:00:00Z'), // Previous year
                new Date('2023-12-31T17:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(slots).toHaveLength(0) // Sunday in 2023, not available
        })

        test('24. Multiple overlapping busy times block all availability', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)
            scheduler.addBusyTimes([
                { start: new Date('2024-01-01T09:00:00Z'), end: new Date('2024-01-01T13:00:00Z') },
                { start: new Date('2024-01-01T13:00:00Z'), end: new Date('2024-01-01T17:00:00Z') },
            ])

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T09:00:00Z'),
                new Date('2024-01-01T17:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            expect(slots).toHaveLength(0)
        })

        test('25. Very short availability window with large slot duration', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '09:00', end: '09:15' }],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T09:00:00Z'),
                new Date('2024-01-01T09:15:00Z'),
                { slotDuration: 30, slotSplit: 30 }
            )

            expect(slots).toHaveLength(0)
        })

        test('26. No availability schedules defined', () => {
            const scheduler = new AvailabilityScheduler()

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T09:00:00Z'),
                new Date('2024-01-01T17:00:00Z'),
                { slotDuration: 60, slotSplit: 60 }
            )

            // Without availability, should work like normal scheduler
            expect(slots).toHaveLength(8)
        })

        test('27. Start time after end time in query', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)

            expect(() => {
                scheduler.findAvailableSlots(
                    new Date('2024-01-01T17:00:00Z'),
                    new Date('2024-01-01T09:00:00Z'), // End before start
                    { slotDuration: 60, slotSplit: 60 }
                )
            }).toThrow()
        })

        test('28. Zero-duration slots requested', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)

            expect(() => {
                scheduler.findAvailableSlots(new Date('2024-01-01T09:00:00Z'), new Date('2024-01-01T17:00:00Z'), {
                    slotDuration: 0,
                    slotSplit: 60,
                })
            }).toThrow()
        })

        test('29. Negative slot duration', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)

            expect(() => {
                scheduler.findAvailableSlots(new Date('2024-01-01T09:00:00Z'), new Date('2024-01-01T17:00:00Z'), {
                    slotDuration: -30,
                    slotSplit: 60,
                })
            }).toThrow()
        })

        test('30. Extremely large slot duration', () => {
            const availability: WeeklyAvailability = {
                schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
            }
            const scheduler = new AvailabilityScheduler(availability)

            const slots = scheduler.findAvailableSlots(
                new Date('2024-01-01T09:00:00Z'),
                new Date('2024-01-01T17:00:00Z'),
                { slotDuration: 1440, slotSplit: 1440 } // 24 hours
            )

            expect(slots).toHaveLength(0) // Can't fit 24-hour slot in 8-hour window
        })
    })
})
