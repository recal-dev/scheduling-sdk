import { MS_PER_MINUTE } from '../../utils/constants'

export function addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * MS_PER_MINUTE)
}

export function subtractMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() - minutes * MS_PER_MINUTE)
}

export function minutesBetween(start: Date, end: Date): number {
    return Math.floor((end.getTime() - start.getTime()) / MS_PER_MINUTE)
}

export function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    )
}

export function startOfDay(date: Date): Date {
    const result = new Date(date)
    result.setHours(0, 0, 0, 0)
    return result
}

export function endOfDay(date: Date): Date {
    const result = new Date(date)
    result.setHours(23, 59, 59, 999)
    return result
}
