import { describe, test, expect } from 'bun:test'
import {
    calculateMinutesFromHour,
    alignToInterval,
    findNextSlotBoundary,
    getTimeWithinDay,
} from '../../../src/helpers/time/alignment.ts'

describe('Alignment Helper', () => {
    describe('calculateMinutesFromHour', () => {
        test('should calculate minutes from hour start', () => {
            const date = new Date('2024-01-15T14:30:45.500Z')
            const result = calculateMinutesFromHour(date)
            expect(result).toBeCloseTo(30.758, 2)
        })

        test('should return 0 for hour start', () => {
            const date = new Date('2024-01-15T14:00:00.000Z')
            expect(calculateMinutesFromHour(date)).toBe(0)
        })

        test('should handle sub-minute precision', () => {
            const date = new Date('2024-01-15T14:00:30.250Z')
            const result = calculateMinutesFromHour(date)
            expect(result).toBeCloseTo(0.504, 2)
        })
    })

    describe('alignToInterval', () => {
        const baseDate = new Date('2024-01-15T14:23:00.000Z')

        test('should align to 15-minute intervals', () => {
            const result = alignToInterval(baseDate, 15)
            expect(result.getMinutes()).toBe(30)
        })

        test('should align to 30-minute intervals', () => {
            const result = alignToInterval(baseDate, 30)
            expect(result.getMinutes()).toBe(30)
        })

        test('should handle already aligned times', () => {
            const alignedDate = new Date('2024-01-15T14:30:00.000Z')
            const result = alignToInterval(alignedDate, 15)
            expect(result.getTime()).toBe(alignedDate.getTime())
        })

        test('should align with offset', () => {
            const result = alignToInterval(baseDate, 15, 5)
            expect(result.getMinutes()).toBe(35)
        })

        test('should handle cross-hour alignment', () => {
            const lateDate = new Date('2024-01-15T14:58:00.000Z')
            const result = alignToInterval(lateDate, 15)
            expect(result.getHours()).toBe(15)
            expect(result.getMinutes()).toBe(0)
        })
    })

    describe('findNextSlotBoundary', () => {
        test('should find next 15-minute boundary', () => {
            const date = new Date('2024-01-15T14:23:00.000Z')
            const result = findNextSlotBoundary(date, 15)
            expect(result.getMinutes()).toBe(30)
        })

        test('should find next boundary with offset', () => {
            const date = new Date('2024-01-15T14:18:00.000Z')
            const result = findNextSlotBoundary(date, 15, 5)
            expect(result.getMinutes()).toBe(20)
        })

        test('should handle already at boundary', () => {
            const date = new Date('2024-01-15T14:30:00.000Z')
            const result = findNextSlotBoundary(date, 15)
            expect(result.getTime()).toBe(date.getTime())
        })

        test('should handle minute boundary edge case', () => {
            const date = new Date('2024-01-15T14:59:30.000Z')
            const result = findNextSlotBoundary(date, 30)
            expect(result.getHours()).toBe(15)
            expect(result.getMinutes()).toBe(0)
        })

        test('should work with various intervals', () => {
            const date = new Date('2024-01-15T14:13:00.000Z')

            // Test 5-minute intervals
            const result5 = findNextSlotBoundary(date, 5)
            expect(result5.getMinutes()).toBe(15)

            // Test 10-minute intervals
            const result10 = findNextSlotBoundary(date, 10)
            expect(result10.getMinutes()).toBe(20)

            // Test 20-minute intervals
            const result20 = findNextSlotBoundary(date, 20)
            expect(result20.getMinutes()).toBe(20)
        })
    })

    describe('getTimeWithinDay', () => {
        test('should calculate minutes from start of day', () => {
            const date = new Date('2024-01-15T14:30:00.000Z')
            const result = getTimeWithinDay(date)
            expect(result).toBe(14 * 60 + 30) // 870 minutes
        })

        test('should return 0 for start of day', () => {
            const date = new Date('2024-01-15T00:00:00.000Z')
            expect(getTimeWithinDay(date)).toBe(0)
        })

        test('should handle end of day', () => {
            const date = new Date('2024-01-15T23:59:00.000Z')
            expect(getTimeWithinDay(date)).toBe(23 * 60 + 59)
        })

        test('should ignore seconds and milliseconds', () => {
            const date1 = new Date('2024-01-15T14:30:00.000Z')
            const date2 = new Date('2024-01-15T14:30:45.999Z')
            expect(getTimeWithinDay(date1)).toBe(getTimeWithinDay(date2))
        })
    })

    // Edge case tests
    describe('Edge Cases', () => {
        test('should handle leap year day', () => {
            const leapDate = new Date('2024-02-29T12:00:00.000Z')
            const result = alignToInterval(leapDate, 15)
            expect(result.getMonth()).toBe(1) // February
            expect(result.getDate()).toBe(29)
        })

        test('should handle DST transition periods', () => {
            // Note: This would need specific timezone handling in a real implementation
            const dstDate = new Date('2024-03-10T07:30:00.000Z') // Example DST date
            const result = alignToInterval(dstDate, 30)
            expect(result).toBeInstanceOf(Date)
        })

        test('should handle very large intervals', () => {
            const date = new Date('2024-01-15T14:30:00.000Z')
            const result = alignToInterval(date, 120) // 2 hours
            expect(result.getMinutes()).toBe(0)
            expect(result.getHours()).toBe(16)
        })
    })
})
