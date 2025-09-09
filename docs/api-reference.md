# API Reference

## Types

### Core Types

#### TimeSlot

Represents a time period that can be booked.

```typescript
interface TimeSlot {
    start: Date
    end: Date
}
```

**Properties:**

- `start`: The start time of the slot
- `end`: The end time of the slot

#### BusyTime

Represents a time period that is already occupied or unavailable.

```typescript
interface BusyTime {
    start: Date
    end: Date
}
```

**Properties:**

- `start`: The start time of the busy period
- `end`: The end time of the busy period

#### SchedulingOptions

Configuration options for slot generation.

```typescript
interface SchedulingOptions {
    // Required
    slotDuration: number

    // Optional
    slotSplit?: number
    padding?: number
    offset?: number
    maxOverlaps?: number

    // Daily window filtering (timezone-aware)
    timezone?: string
    earliestTime?: string | number // 'HH:mm' or minutes since midnight
    latestTime?: string | number   // 'HH:mm' or minutes since midnight; supports '24:00' or 1440
}
```

**Properties:**

- `slotDuration` (required): Duration of each generated slot in minutes. Must be positive.
- `slotSplit` (optional): Interval between the start times of consecutive slots in minutes. Defaults to `slotDuration`. Must be positive.
- `padding` (optional): Buffer time in minutes to add before and after each busy time. Defaults to 0. Must be non-negative.
- `offset` (optional): Offset from standard time boundaries in minutes. Defaults to 0. Must be non-negative.
- `maxOverlaps` (optional): Allow up to K overlapping busy intervals. If undefined, traditional behavior applies (any overlap blocks a slot).
- `timezone` (optional): IANA timezone identifier used for daily window filtering. Required if `earliestTime`/`latestTime` are provided when using the core `Scheduler`.
- `earliestTime`/`latestTime` (optional): Local daily time window for slot START times. Specify as `HH:mm` or minutes since midnight. `latestTime` accepts `"24:00"` or `1440` as end of day.

### Availability Types

#### DayOfWeek

Represents a day of the week as a lowercase string.

```typescript
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
```

#### DaySchedule

Defines availability schedule for specific days of the week.

```typescript
interface DaySchedule {
    days: DayOfWeek[]
    start: string
    end: string
}
```

**Properties:**

- `days`: Array of days this schedule applies to. Must contain at least one valid day.
- `start`: Start time in 24-hour HH:mm format (e.g., "09:00", "14:30")
- `end`: End time in 24-hour HH:mm format (e.g., "17:00", "23:30"). Must be after start time.

#### WeeklyAvailability

Defines a weekly availability pattern with multiple schedules.

```typescript
interface WeeklyAvailability {
    schedules: DaySchedule[]
}
```

**Properties:**

- `schedules`: Array of availability schedules. Must contain at least one schedule.

## Functions

### createScheduler

Creates a new Scheduler instance.

```typescript
function createScheduler(busyTimes?: BusyTime[]): Scheduler
```

**Parameters:**

- `busyTimes` (optional): Initial array of busy times. Defaults to empty array.

**Returns:**

- New `Scheduler` instance

**Example:**

```typescript
import { createScheduler } from 'scheduling-sdk'

// Create empty scheduler
const scheduler = createScheduler()

// Create scheduler with initial busy times
const busyScheduler = createScheduler([
    { start: new Date('2024-01-15T10:00:00Z'), end: new Date('2024-01-15T11:00:00Z') },
])
```

## Scheduler Class

The main class for managing busy times and finding available slots.

### Constructor

```typescript
constructor(busyTimes?: BusyTime[])
```

**Parameters:**

- `busyTimes` (optional): Initial array of busy times. Defaults to empty array.

**Example:**

```typescript
import { Scheduler } from 'scheduling-sdk'

const scheduler = new Scheduler([{ start: new Date('2024-01-15T10:00:00Z'), end: new Date('2024-01-15T11:00:00Z') }])
```

### findAvailableSlots

Finds available time slots within a given time range, considering busy times and options.

```typescript
findAvailableSlots(
    startTime: Date,
    endTime: Date,
    options: SchedulingOptions
): TimeSlot[]
```

**Parameters:**

- `startTime`: The earliest time to consider for slots
- `endTime`: The latest time to consider for slots
- `options`: Configuration for slot generation

**Returns:**

- Array of available time slots sorted by start time

**Throws:**

- Error if `startTime` is after `endTime`
- Error if any option values are invalid

**Example:**

```typescript
const slots = scheduler.findAvailableSlots(new Date('2024-01-15T09:00:00Z'), new Date('2024-01-15T17:00:00Z'), {
    slotDuration: 60,
    padding: 15,
    slotSplit: 30,
    offset: 0,
})
```

### addBusyTimes

Adds new busy times to the scheduler.

```typescript
addBusyTimes(busyTimes: BusyTime[]): void
```

**Parameters:**

- `busyTimes`: Array of busy times to add

**Example:**

```typescript
scheduler.addBusyTimes([
    { start: new Date('2024-01-15T14:00:00Z'), end: new Date('2024-01-15T15:00:00Z') },
    { start: new Date('2024-01-15T16:00:00Z'), end: new Date('2024-01-15T17:00:00Z') },
])
```

### clearBusyTimes

Removes all busy times from the scheduler.

```typescript
clearBusyTimes(): void
```

**Example:**

```typescript
scheduler.clearBusyTimes()
console.log(scheduler.getBusyTimes()) // []
```

### getBusyTimes

Returns a copy of all busy times currently in the scheduler.

```typescript
getBusyTimes(): BusyTime[]
```

**Returns:**

- Array of busy times sorted by start time

**Note:** Returns a copy, so modifying the returned array won't affect the scheduler's internal state.

**Example:**

```typescript
const busyTimes = scheduler.getBusyTimes()
console.log(`Scheduler has ${busyTimes.length} busy times`)
```

## AvailabilityScheduler Class

Enhanced scheduler that combines weekly availability patterns with traditional busy time management.

### Constructor

```typescript
constructor(availability?: WeeklyAvailability, timezone?: string, existingBusyTimes?: BusyTime[])
```

**Parameters:**

- `availability` (optional): Weekly availability pattern defining when slots are available
- `timezone` (optional): IANA timezone identifier for availability processing and daily window fallback
- `existingBusyTimes` (optional): Array of existing busy times to include

**Throws:**

- Error if the availability pattern is invalid

**Example:**

```typescript
import { AvailabilityScheduler } from 'scheduling-sdk'

// Create with availability only
const scheduler = new AvailabilityScheduler({
    schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
})

// Create with availability and timezone
const schedulerTz = new AvailabilityScheduler({
    schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
}, 'America/New_York')

// Create with availability, timezone, and existing busy times
const busyTimes = [{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') }]
const schedulerWithAll = new AvailabilityScheduler(availability, 'Europe/London', busyTimes)
```

### setAvailability

Sets or updates the weekly availability pattern.

```typescript
setAvailability(availability: WeeklyAvailability): void
```

**Parameters:**

- `availability`: The new weekly availability pattern

**Throws:**

- Error if the availability pattern is invalid

**Example:**

```typescript
scheduler.setAvailability({
    schedules: [{ days: ['monday', 'tuesday'], start: '09:00', end: '17:00' }],
})
```

### getAvailability

Returns the current weekly availability pattern.

```typescript
getAvailability(): WeeklyAvailability | undefined
```

**Returns:**

- The current availability pattern, or undefined if none is set

### addBusyTime

Adds a single busy time that will be combined with availability-based restrictions.

```typescript
addBusyTime(busyTime: BusyTime): void
```

**Parameters:**

- `busyTime`: The busy time to add

**Example:**

```typescript
// Block out a specific appointment
scheduler.addBusyTime({
    start: new Date('2024-01-15T14:00:00Z'),
    end: new Date('2024-01-15T15:30:00Z'),
})
```

### addBusyTimes

Adds multiple busy times at once.

```typescript
addBusyTimes(busyTimes: BusyTime[]): void
```

**Parameters:**

- `busyTimes`: Array of busy times to add

### clearBusyTimes

Removes all manually added busy times. Does NOT affect availability-based restrictions.

```typescript
clearBusyTimes(): void
```

### getBusyTimes

Returns all manually added busy times. Does NOT include busy times from availability pattern.

```typescript
getBusyTimes(): BusyTime[]
```

**Returns:**

- Array of manually added busy times

### findAvailableSlots

Finds available time slots considering both availability patterns and manually added busy times.

```typescript
findAvailableSlots(
    startTime: Date,
    endTime: Date,
    options: SchedulingOptions
): TimeSlot[]
```

**Parameters:**

- `startTime`: Start of the search range
- `endTime`: End of the search range
- `options`: Slot generation options

**Returns:**

- Array of available time slots

**Behavior:**

- If no availability pattern is set, behaves like the standard Scheduler
- If availability is set, only returns slots within available periods

**Example:**

```typescript
const slots = scheduler.findAvailableSlots(new Date('2024-01-15T08:00:00Z'), new Date('2024-01-15T18:00:00Z'), {
    slotDuration: 60,
    padding: 15,
})
```

## Availability Functions

### weeklyAvailabilityToBusyTimes

Converts a weekly availability pattern into busy times for a specific week.

```typescript
function weeklyAvailabilityToBusyTimes(
  availability: WeeklyAvailability,
  weekStart: Date,
  timezone?: string
): BusyTime[]
```

**Parameters:**

- `availability`: The weekly availability pattern to convert
- `weekStart`: The Monday date for the week to process (MUST be a Monday)
- `timezone` (optional): IANA timezone used to interpret availability times. Falls back to `process.env.SCHEDULING_TIMEZONE` or `UTC`.

**Returns:**

- Array of busy times representing unavailable periods

**Throws:**

- Error if weekStart is not a Monday
- Error if availability contains invalid time formats

**Example:**

```typescript
const mondayDate = new Date('2024-01-01T00:00:00Z') // Must be Monday
const busyTimes = weeklyAvailabilityToBusyTimes(availability, mondayDate)
```

### validateWeeklyAvailability

Validates a WeeklyAvailability object for correctness.

```typescript
function validateWeeklyAvailability(availability?: WeeklyAvailability): void
```

**Parameters:**

- `availability`: The availability object to validate (can be undefined)

**Throws:**

- Error with descriptive message if validation fails

**Example:**

```typescript
try {
    validateWeeklyAvailability(userInput)
    const scheduler = new AvailabilityScheduler(userInput)
} catch (error) {
    console.error('Invalid availability:', error.message)
}
```

## Validation

All methods perform input validation and will throw descriptive errors for invalid inputs:

### Time Range Validation

- Start time must be before end time
- Both times must be valid Date objects

### Options Validation

- `slotDuration` must be a positive number
- `slotSplit` must be a positive number (if provided)
- `padding` must be a non-negative number (if provided)
- `offset` must be a non-negative number (if provided)
- `maxOverlaps` must be a non-negative integer (if provided)
- If `earliestTime` or `latestTime` is provided, `timezone` must also be specified when using the core `Scheduler`
- `earliestTime`/`latestTime` must be valid times (string `HH:mm` or minutes). `latestTime` may be `24:00`/`1440`.
- All numeric values must be finite

### Availability Validation

- Availability object must be a valid object (if provided)
- `schedules` array must contain at least one schedule
- Day names must be valid (monday, tuesday, etc.)
- Time format must be HH:mm (24-hour format)
- Start time must be before end time
- No overlapping schedules on the same day
  

## Behavior Details

### Slot Generation

1. Slots are generated starting from the first aligned boundary after `startTime`
2. Slots continue until no more complete slots fit before `endTime`
3. All slots have exactly `slotDuration` minutes duration
4. Consecutive slots start `slotSplit` minutes apart

### Busy Time Handling

1. Busy times are automatically merged if they overlap or are adjacent
2. Padding is applied before merging
3. Slots that conflict with (padded) busy times are excluded

### Time Alignment

- When `offset` is 0, slots align to `slotSplit` boundaries (e.g., every 15 minutes for `slotSplit: 15`)
- When `offset` is specified, slots align to `(boundary + offset)` (e.g., 5, 20, 35, 50 for `slotSplit: 15, offset: 5`)

### Availability Behavior

- Availability patterns define when slots CAN be generated
- Available periods become "allowed zones" for slot generation
- Gaps between schedules on the same day create automatic breaks
- Days without schedules are completely unavailable
- Manually added busy times are combined with availability restrictions

## Error Examples

```typescript
// Invalid time range
scheduler.findAvailableSlots(
    new Date('2024-01-15T17:00:00Z'),
    new Date('2024-01-15T09:00:00Z'), // Before start time!
    { slotDuration: 30 }
)
// Throws: "Start time must be before end time"

// Invalid slot duration
scheduler.findAvailableSlots(
    new Date('2024-01-15T09:00:00Z'),
    new Date('2024-01-15T17:00:00Z'),
    { slotDuration: -30 } // Negative!
)
// Throws: "Slot duration must be a positive number"

// Invalid padding
scheduler.findAvailableSlots(
    new Date('2024-01-15T09:00:00Z'),
    new Date('2024-01-15T17:00:00Z'),
    { slotDuration: 30, padding: -5 } // Negative!
)
// Throws: "Padding must be a non-negative number"
```
