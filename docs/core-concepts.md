# Core Concepts

Understanding the fundamental concepts behind the Scheduling SDK will help you make the most of its features and configure it correctly for your use cases.

## Table of Contents

- [Overview](#overview)
- [Time Slots](#time-slots)
- [Busy Times](#busy-times)
- [Scheduling Options](#scheduling-options)
- [Weekly Availability](#weekly-availability)
- [Algorithm Overview](#algorithm-overview)
- [Common Patterns](#common-patterns)

## Overview

The Scheduling SDK helps you find available time periods (slots) within a given time range while avoiding conflicts with existing busy periods. It's designed to handle complex scheduling scenarios with configurable options for padding, slot splitting, and time alignment.

## Time Slots

A **time slot** represents a potential booking period that can be reserved or scheduled.

```typescript
interface TimeSlot {
    start: Date
    end: Date
}
```

### Key Properties

- **Duration**: All generated slots have exactly the same duration as specified in `slotDuration`
- **Availability**: Slots are only returned if they don't conflict with any busy times (including padding)
- **Ordering**: Slots are always returned in chronological order (earliest first)

### Example

```typescript
// A 30-minute time slot
const slot: TimeSlot = {
    start: new Date('2024-01-15T10:00:00Z'),
    end: new Date('2024-01-15T10:30:00Z'),
}
```

## Busy Times

A **busy time** represents a period when you are **NOT available** for scheduling. Think of busy times as blocked periods on your calendar - any existing meetings, appointments, breaks, or other commitments that prevent new bookings.

```typescript
interface BusyTime {
    start: Date  // Inclusive - the busy period starts at this exact time
    end: Date    // Exclusive - the busy period ends just before this time
}
```

### Key Concept

Busy times are the **inverse** of availability:
- **Busy Times** = When you CANNOT be scheduled
- **Available Slots** = When you CAN be scheduled (no busy time conflicts)

### Behavior

- **Automatic Merging**: Overlapping or adjacent busy times are automatically merged
- **Padding Application**: Padding extends busy times on both sides, creating a larger unavailable period
- **Conflict Detection**: Any slot that would overlap with a busy time (including padding) is excluded from results

### Example

```typescript
// Existing appointment blocks this time from new bookings
const busyTime: BusyTime = {
    start: new Date('2024-01-15T14:00:00Z'), // 2:00 PM
    end: new Date('2024-01-15T15:30:00Z'),   // 3:30 PM
}

// With 15-minute padding, this effectively blocks 1:45 PM - 3:45 PM
```

## Scheduling Options

The `SchedulingOptions` interface provides fine-grained control over how slots are generated.

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

### Slot Duration

The `slotDuration` parameter determines how long each generated slot will be (in minutes).

```typescript
// Generate 60-minute slots
{
    slotDuration: 60
}

// Generate 30-minute slots
{
    slotDuration: 30
}

// Generate 90-minute slots
{
    slotDuration: 90
}
```

**Key Points:**

- Must be a positive number
- All returned slots have exactly this duration
- Can be fractional (e.g., 7.5 for 7 minutes 30 seconds)

### Slot Split

The `slotSplit` parameter controls the interval between consecutive slot start times (in minutes).

```typescript
// Non-overlapping slots (default behavior)
{ slotDuration: 60, slotSplit: 60 }
// Results in: 9:00-10:00, 10:00-11:00, 11:00-12:00

// Overlapping slots
{ slotDuration: 60, slotSplit: 30 }
// Results in: 9:00-10:00, 9:30-10:30, 10:00-11:00, 10:30-11:30

// Spaced slots
{ slotDuration: 30, slotSplit: 60 }
// Results in: 9:00-9:30, 10:00-10:30, 11:00-11:30
```

**Default:** Same as `slotDuration` (non-overlapping slots)

### Padding

The `padding` parameter adds buffer time before and after each busy time (in minutes).

```typescript
// Original busy time: 2:00 PM - 3:00 PM
// With padding: 15 minutes

{
    padding: 15
}
// Effective busy time becomes: 1:45 PM - 3:15 PM
```

**Use Cases:**

- Setup/cleanup time for meeting rooms
- Travel time between appointments
- Buffer time for equipment preparation
- Comfort breaks between sessions

**Default:** 0 (no padding)

### Offset

The `offset` parameter shifts slot start times from standard boundaries (in minutes).

```typescript
// Standard alignment (on the hour)
{ slotDuration: 60, slotSplit: 60, offset: 0 }
// Results in: 9:00-10:00, 10:00-11:00, 11:00-12:00

// 15-minute offset
{ slotDuration: 60, slotSplit: 60, offset: 15 }
// Results in: 9:15-10:15, 10:15-11:15, 11:15-12:15

// Quarter-hour alignment
{ slotDuration: 30, slotSplit: 15, offset: 0 }
// Results in: 9:00-9:30, 9:15-9:45, 9:30-10:00, 9:45-10:15
```

**Default:** 0 (align to standard boundaries)

### Daily Windows

The `earliestTime` and `latestTime` parameters control the daily window for slot generation.

```typescript
// Restrict slots to 9:00 AM - 5:00 PM
{
    earliestTime: '09:00',
    latestTime: '17:00'
}

// Restrict slots to 10:00 AM - 6:00 PM with 24-hour clock support
{
    earliestTime: '10:00',
    latestTime: '24:00'
}
```

**Default:** No daily window restrictions

### K-overlaps

The `maxOverlaps` parameter allows up to K overlapping busy intervals.

```typescript
// Allow one overlapping busy time
{
    maxOverlaps: 1
}
```

**Default:** 0 (no overlapping busy times)

## Weekly Availability

The **weekly availability** system allows you to define recurring weekly patterns that specify when time slots are available for scheduling. This is perfect for businesses, professionals, or services that operate on predictable weekly schedules.

### Key Concepts

#### Availability vs Busy Times

Understanding the relationship between availability and busy times is crucial:

- **Availability**: Defines your general working hours - when you're theoretically open for scheduling
- **Busy Times**: Specific periods within your availability when you're NOT available (existing bookings)
- **Available Slots**: The intersection - times that are BOTH within availability AND outside busy times

Think of it as a two-layer filter:
1. First layer: "Am I generally available?" (defined by availability schedules)
2. Second layer: "Am I actually free?" (not blocked by busy times)

```typescript
// Business operates Monday-Friday 9-17 with lunch break 12-13
const availability = {
    schedules: [
        { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '09:00', end: '12:00' },
        { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '13:00', end: '17:00' },
    ],
}

// Plus specific busy times
const busyTimes = [{ start: new Date('2024-01-15T14:00:00Z'), end: new Date('2024-01-15T15:00:00Z') }]

// Result: Slots only during business hours, excluding lunch break AND the 2-3 PM meeting
```

#### Implicit Breaks

One of the most powerful features is **implicit break creation**. Instead of explicitly defining breaks, you create them by having gaps between schedules:

```typescript
// Lunch break is created by the gap between morning and afternoon schedules
{
    schedules: [
        { days: ['monday'], start: '09:00', end: '12:00' }, // Morning
        { days: ['monday'], start: '13:00', end: '17:00' }, // Afternoon
        // 12:00-13:00 becomes an automatic break
    ]
}
```

#### Day-by-Day Configuration

Different days can have completely different schedules:

```typescript
{
    schedules: [
        { days: ['monday', 'wednesday', 'friday'], start: '09:00', end: '17:00' },
        { days: ['tuesday', 'thursday'], start: '10:00', end: '16:00' },
        { days: ['saturday'], start: '09:00', end: '12:00' },
        // Sunday has no schedule = completely unavailable
    ]
}
```

### Weekly Processing

The availability system processes one week at a time, starting from Monday:

1. **Week Boundaries**: All processing is done weekly, starting from Monday
2. **Conversion**: Availability patterns are converted to busy times for unavailable periods
3. **Combination**: These "availability busy times" are combined with manually added busy times
4. **Slot Generation**: Standard slot generation then excludes all busy periods

### Timezone Support

Timezone is specified at the scheduler level (not inside `WeeklyAvailability`).

```typescript
const availability = { schedules: [...] }
const scheduler = new AvailabilityScheduler(availability, 'America/New_York')
```

- The `AvailabilityScheduler` uses its constructor timezone for availability conversion and as a fallback for daily-window filtering if you omit `options.timezone`.
- The core `Scheduler` requires `options.timezone` when you use `earliestTime`/`latestTime`.

Daily window filtering supports `'HH:mm'` strings or minute numbers, with `latestTime` accepting `'24:00'` or `1440`.

```typescript
// Core Scheduler daily windows
new Scheduler().findAvailableSlots(start, end, {
  slotDuration: 30,
  timezone: 'America/New_York',
  earliestTime: '09:00',
  latestTime: '17:00',
})

// AvailabilityScheduler daily windows (timezone fallback from constructor)
new AvailabilityScheduler(availability, 'UTC').findAvailableSlots(start, end, {
  slotDuration: 30,
  earliestTime: 9 * 60,
  latestTime: '24:00',
})
```

### Allowing Overlaps (K-overlaps)

You can allow up to `K` overlapping busy intervals by providing `maxOverlaps`.

```typescript
new Scheduler().findAvailableSlots(start, end, {
  slotDuration: 30,
  slotSplit: 15,
  maxOverlaps: 1, // allow one overlapping busy time
})
```

When `maxOverlaps` is set, an optimized algorithm finds free periods before slot generation. Daily-window filtering and timezone rules still apply during slot generation.

## Algorithm Overview

The scheduling algorithm follows these steps:

### 1. Input Validation

- Validate time range (start before end)
- Validate all scheduling options
- Ensure all dates are valid

### 2. Busy Time Processing

```
Original Busy Times → Apply Padding → Merge Overlapping → Final Busy Times
```

**Example:**

```typescript
// Original busy times
;[
    { start: '10:00', end: '11:00' },
    { start: '10:30', end: '11:30' }, // Overlapping
][
    // After 15-minute padding
    ({ start: '09:45', end: '11:15' }, { start: '10:15', end: '11:45' }) // Still overlapping
][
    // After merging
    { start: '09:45', end: '11:45' } // Single merged period
]
```

### 3. Slot Generation

1. **Find First Slot Start**: Calculate the first aligned slot start time after the requested start time
2. **Generate Slots**: Create slots at regular intervals until the end time
3. **Apply Duration**: Each slot has exactly the specified duration

### 4. Slot Filtering

- Remove slots that overlap with any busy time
- Return remaining slots in chronological order

## Common Patterns

### Non-Overlapping Appointments

Most common pattern for exclusive bookings.

```typescript
{
    slotDuration: 60,    // 1-hour appointments
    slotSplit: 60,       // No overlap
    padding: 15          // 15-minute buffer
}
```

### Flexible Consultation Slots

Allow overlapping appointments for flexibility.

```typescript
{
    slotDuration: 60,    // 1-hour consultations
    slotSplit: 30,       // New slot every 30 minutes
    padding: 0           // No buffer needed
}
```

### Equipment Booking with Setup Time

Account for equipment preparation time.

```typescript
{
    slotDuration: 120,   // 2-hour equipment usage
    slotSplit: 120,      // No overlap
    padding: 30          // 30 minutes for setup/breakdown
}
```

### Quick Meeting Rooms

Fast turnaround meeting rooms with minimal buffer.

```typescript
{
    slotDuration: 30,    // 30-minute meetings
    slotSplit: 30,       // Back-to-back meetings
    padding: 5           // 5-minute buffer for room reset
}
```

### Aligned Professional Services

Align appointments to professional boundaries.

```typescript
{
    slotDuration: 50,    // 50-minute therapy sessions
    slotSplit: 60,       // Start on the hour
    offset: 0,           // Begin at hour boundaries
    padding: 10          // 10-minute buffer between clients
}
```

### Business Hours with Availability

Standard business hours with automatic lunch break.

```typescript
// Using AvailabilityScheduler for business hours
const availability = {
    schedules: [
        { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '09:00', end: '12:00' },
        { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '13:00', end: '17:00' },
    ],
}

const scheduler = new AvailabilityScheduler(availability)
const options = { slotDuration: 60, padding: 15 }
```

### Medical Practice Schedule

Different schedules for different days with varying hours.

```typescript
const availability = {
    schedules: [
        { days: ['monday', 'wednesday', 'friday'], start: '08:00', end: '16:00' },
        { days: ['tuesday', 'thursday'], start: '12:00', end: '20:00' },
        { days: ['saturday'], start: '09:00', end: '13:00' },
    ],
}

const scheduler = new AvailabilityScheduler(availability)
const options = { slotDuration: 30, padding: 10 }
```

### Service Business with Multiple Breaks

Complex schedule with multiple breaks throughout the day.

```typescript
const availability = {
    schedules: [
        { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '08:00', end: '10:00' },
        { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '10:30', end: '12:00' },
        { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '13:00', end: '15:00' },
        { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '15:30', end: '17:00' },
    ],
}

// Creates breaks: 10:00-10:30, 12:00-13:00, 15:00-15:30
const scheduler = new AvailabilityScheduler(availability)
const options = { slotDuration: 30, slotSplit: 30 }
```

## Time Boundaries and Alignment

Understanding how the SDK handles time alignment is crucial for predictable results.

### Standard Boundaries

When `offset: 0`, slots align to intervals based on `slotSplit`:

- `slotSplit: 60` → Hourly boundaries (9:00, 10:00, 11:00)
- `slotSplit: 30` → Half-hour boundaries (9:00, 9:30, 10:00, 10:30)
- `slotSplit: 15` → Quarter-hour boundaries (9:00, 9:15, 9:30, 9:45)

### Custom Offsets

With a non-zero `offset`, boundaries shift:

- `slotSplit: 60, offset: 15` → 9:15, 10:15, 11:15
- `slotSplit: 30, offset: 10` → 9:10, 9:40, 10:10, 10:40

The `offset` is particularly useful for:

- Synchronizing with existing scheduling systems
- Creating predictable appointment times
- Aligning with specific business processes

## Performance Characteristics

The SDK is optimized for common scheduling scenarios:

- **Time Complexity**: O(n log n) where n is the number of busy times
- **Space Complexity**: O(n) for storing and processing busy times
- **Optimizations**:
    - Busy time merging reduces conflict checking
    - Efficient slot generation avoids unnecessary calculations
    - Early termination when no more slots can fit

Understanding these concepts will help you configure the SDK effectively for your specific scheduling needs. For practical examples, see the [Examples](examples.md) documentation.
