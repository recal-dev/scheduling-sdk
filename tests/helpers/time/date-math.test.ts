import { describe, test, expect } from 'bun:test'
import {
    addMinutes,
    subtractMinutes,
    minutesBetween,
    isSameDay,
    startOfDay,
    endOfDay,
} from '../../../src/helpers/time/date-math.ts'

describe('Date Math Helper', () => {
    const baseDate = new Date('2024-01-15T14:30:00.000Z')

    describe('addMinutes', () => {
        test('should add positive minutes correctly', () => {
            const result = addMinutes(baseDate, 30)
            expect(result.getTime()).toBe(new Date('2024-01-15T15:00:00.000Z').getTime())
        })

        test('should add minutes across hour boundary', () => {
            const result = addMinutes(baseDate, 45)
            expect(result.getTime()).toBe(new Date('2024-01-15T15:15:00.000Z').getTime())
        })

        test('should add minutes across day boundary', () => {
            const lateDate = new Date('2024-01-15T23:45:00.000Z')
            const result = addMinutes(lateDate, 30)
            expect(result.getTime()).toBe(new Date('2024-01-16T00:15:00.000Z').getTime())
        })

        test('should handle zero minutes', () => {
            const result = addMinutes(baseDate, 0)
            expect(result.getTime()).toBe(baseDate.getTime())
        })

        test('should handle negative minutes', () => {
            const result = addMinutes(baseDate, -15)
            expect(result.getTime()).toBe(subtractMinutes(baseDate, 15).getTime())
        })

        test('should handle large minute values', () => {
            const result = addMinutes(baseDate, 1440) // 24 hours
            expect(result.getTime()).toBe(new Date('2024-01-16T14:30:00.000Z').getTime())
        })
    })

    describe('subtractMinutes', () => {
        test('should subtract positive minutes correctly', () => {
            const result = subtractMinutes(baseDate, 30)
            expect(result.getTime()).toBe(new Date('2024-01-15T14:00:00.000Z').getTime())
        })

        test('should subtract minutes across hour boundary', () => {
            const result = subtractMinutes(baseDate, 45)
            expect(result.getTime()).toBe(new Date('2024-01-15T13:45:00.000Z').getTime())
        })

        test('should subtract minutes across day boundary', () => {
            const earlyDate = new Date('2024-01-15T00:15:00.000Z')
            const result = subtractMinutes(earlyDate, 30)
            expect(result.getTime()).toBe(new Date('2024-01-14T23:45:00.000Z').getTime())
        })

        test('should handle zero minutes', () => {
            const result = subtractMinutes(baseDate, 0)
            expect(result.getTime()).toBe(baseDate.getTime())
        })
    })

    describe('minutesBetween', () => {
        test('should calculate minutes between same day dates', () => {
            const start = new Date('2024-01-15T14:00:00.000Z')
            const end = new Date('2024-01-15T14:30:00.000Z')
            expect(minutesBetween(start, end)).toBe(30)
        })

        test('should calculate minutes across day boundary', () => {
            const start = new Date('2024-01-15T23:30:00.000Z')
            const end = new Date('2024-01-16T00:30:00.000Z')
            expect(minutesBetween(start, end)).toBe(60)
        })

        test('should return zero for same times', () => {
            expect(minutesBetween(baseDate, baseDate)).toBe(0)
        })

        test('should handle negative differences', () => {
            const start = new Date('2024-01-15T15:00:00.000Z')
            const end = new Date('2024-01-15T14:30:00.000Z')
            expect(minutesBetween(start, end)).toBe(-30)
        })

        test('should handle large time differences', () => {
            const start = new Date('2024-01-15T00:00:00.000Z')
            const end = new Date('2024-01-16T00:00:00.000Z')
            expect(minutesBetween(start, end)).toBe(1440)
        })
    })

    describe('isSameDay', () => {
        test('should return true for same day dates', () => {
            const date1 = new Date('2024-01-15T09:00:00.000Z')
            const date2 = new Date('2024-01-15T18:00:00.000Z')
            expect(isSameDay(date1, date2)).toBe(true)
        })

        test('should return false for different days', () => {
            const date1 = new Date('2024-01-15T23:59:59.999Z')
            const date2 = new Date('2024-01-16T00:00:00.000Z')
            expect(isSameDay(date1, date2)).toBe(false)
        })

        test('should return true for identical dates', () => {
            expect(isSameDay(baseDate, baseDate)).toBe(true)
        })
    })

    describe('startOfDay', () => {
        test('should return start of day', () => {
            const result = startOfDay(baseDate)
            expect(result.getHours()).toBe(0)
            expect(result.getMinutes()).toBe(0)
            expect(result.getSeconds()).toBe(0)
            expect(result.getMilliseconds()).toBe(0)
        })

        test('should preserve date part', () => {
            const result = startOfDay(baseDate)
            expect(result.getFullYear()).toBe(baseDate.getFullYear())
            expect(result.getMonth()).toBe(baseDate.getMonth())
            expect(result.getDate()).toBe(baseDate.getDate())
        })
    })

    describe('endOfDay', () => {
        test('should return end of day', () => {
            const result = endOfDay(baseDate)
            expect(result.getHours()).toBe(23)
            expect(result.getMinutes()).toBe(59)
            expect(result.getSeconds()).toBe(59)
            expect(result.getMilliseconds()).toBe(999)
        })

        test('should preserve date part', () => {
            const result = endOfDay(baseDate)
            expect(result.getFullYear()).toBe(baseDate.getFullYear())
            expect(result.getMonth()).toBe(baseDate.getMonth())
            expect(result.getDate()).toBe(baseDate.getDate())
        })
    })
})
