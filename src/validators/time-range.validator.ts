export function validateTimeRange(startTime: Date, endTime: Date): void {
    if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
        throw new Error('Start time must be a valid Date')
    }

    if (!(endTime instanceof Date) || isNaN(endTime.getTime())) {
        throw new Error('End time must be a valid Date')
    }

    if (startTime.getTime() >= endTime.getTime()) {
        throw new Error('Start time must be before end time')
    }
}
