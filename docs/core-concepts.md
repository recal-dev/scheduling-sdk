# Core Concepts

Understanding the fundamental concepts behind the Scheduling SDK will help you make the most of its features and configure it correctly for your use cases.

## Table of Contents

- [Overview](#overview)
- [Time Slots](#time-slots)
- [Busy Times](#busy-times)
- [Scheduling Options](#scheduling-options)
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
    end: new Date('2024-01-15T10:30:00Z')
}
```

## Busy Times

A **busy time** represents a period that is already occupied or unavailable for scheduling.

```typescript
interface BusyTime {
    start: Date
    end: Date
}
```

### Behavior

- **Automatic Merging**: Overlapping or adjacent busy times are automatically merged
- **Padding Application**: Padding is applied to busy times before slot filtering
- **Conflict Detection**: Slots that overlap with busy times (including padding) are excluded

### Example

```typescript
// Existing appointment
const busyTime: BusyTime = {
    start: new Date('2024-01-15T14:00:00Z'),
    end: new Date('2024-01-15T15:30:00Z')
}
```

## Scheduling Options

The `SchedulingOptions` interface provides fine-grained control over how slots are generated.

```typescript
interface SchedulingOptions {
    slotDuration: number     // Required
    slotSplit?: number       // Optional
    padding?: number         // Optional
    offset?: number          // Optional
}
```

### Slot Duration

The `slotDuration` parameter determines how long each generated slot will be (in minutes).

```typescript
// Generate 60-minute slots
{ slotDuration: 60 }

// Generate 30-minute slots
{ slotDuration: 30 }

// Generate 90-minute slots
{ slotDuration: 90 }
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

{ padding: 15 }
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
[
    { start: '10:00', end: '11:00' },
    { start: '10:30', end: '11:30' }  // Overlapping
]

// After 15-minute padding
[
    { start: '09:45', end: '11:15' },
    { start: '10:15', end: '11:45' }  // Still overlapping
]

// After merging
[
    { start: '09:45', end: '11:45' }  // Single merged period
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