# API Reference

## Types

### TimeSlot

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

### BusyTime

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

### SchedulingOptions

Configuration options for slot generation.

```typescript
interface SchedulingOptions {
    slotDuration: number
    slotSplit?: number
    padding?: number
    offset?: number
}
```

**Properties:**
- `slotDuration` (required): Duration of each generated slot in minutes. Must be positive.
- `slotSplit` (optional): Interval between the start times of consecutive slots in minutes. Defaults to `slotDuration`. Must be positive.
- `padding` (optional): Buffer time in minutes to add before and after each busy time. Defaults to 0. Must be non-negative.
- `offset` (optional): Offset from standard time boundaries in minutes. Defaults to 0. Must be non-negative.

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
    { start: new Date('2024-01-15T10:00:00Z'), end: new Date('2024-01-15T11:00:00Z') }
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

const scheduler = new Scheduler([
    { start: new Date('2024-01-15T10:00:00Z'), end: new Date('2024-01-15T11:00:00Z') }
])
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
const slots = scheduler.findAvailableSlots(
    new Date('2024-01-15T09:00:00Z'),
    new Date('2024-01-15T17:00:00Z'),
    {
        slotDuration: 60,
        padding: 15,
        slotSplit: 30,
        offset: 0
    }
)
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
    { start: new Date('2024-01-15T16:00:00Z'), end: new Date('2024-01-15T17:00:00Z') }
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
- All numeric values must be finite

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