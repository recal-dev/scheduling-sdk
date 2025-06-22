# Getting Started

## Installation

```bash
npm install scheduling-sdk
# or
yarn add scheduling-sdk
# or
bun add scheduling-sdk
```

## Quick Start

The Scheduling SDK provides a simple interface for finding available time slots while considering busy periods and various scheduling constraints.

### Basic Example

```typescript
import { createScheduler } from 'scheduling-sdk'

// Create a scheduler with some busy times
const scheduler = createScheduler([
    {
        start: new Date('2024-01-15T09:00:00Z'),
        end: new Date('2024-01-15T10:00:00Z'),
    },
    {
        start: new Date('2024-01-15T14:00:00Z'),
        end: new Date('2024-01-15T15:30:00Z'),
    },
])

// Find available 30-minute slots
const availableSlots = scheduler.findAvailableSlots(
    new Date('2024-01-15T08:00:00Z'), // Start time
    new Date('2024-01-15T17:00:00Z'), // End time
    {
        slotDuration: 30, // 30-minute slots
        padding: 0, // No padding around busy times
        slotSplit: 30, // Non-overlapping slots
        offset: 0, // No offset from hour boundaries
    }
)

console.log(availableSlots)
// Output: Array of time slots between 8:00-9:00, 10:00-14:00, and 15:30-17:00
```

### Step-by-Step Breakdown

1. **Import the SDK**: Import the `createScheduler` function
2. **Create Scheduler**: Initialize with existing busy times (optional)
3. **Define Options**: Configure slot duration, padding, splitting, and offset
4. **Find Slots**: Call `findAvailableSlots` with time range and options
5. **Use Results**: Process the returned array of available time slots

## Core Concepts

### Time Slots

A time slot represents a potential booking period with a start and end time:

```typescript
interface TimeSlot {
    start: Date
    end: Date
}
```

### Busy Times

Busy times represent periods that are already occupied:

```typescript
interface BusyTime {
    start: Date
    end: Date
}
```

### Scheduling Options

Configure how slots are generated:

```typescript
interface SchedulingOptions {
    slotDuration: number // Duration of each slot in minutes
    slotSplit?: number // Interval between slot starts (default: same as duration)
    padding?: number // Buffer time around busy periods in minutes
    offset?: number // Offset from hour boundaries in minutes
}
```

## Common Use Cases

### 1. Simple Appointment Booking

```typescript
import { createScheduler } from 'scheduling-sdk'

const scheduler = createScheduler()

// Add existing appointments
scheduler.addBusyTimes([
    { start: new Date('2024-01-15T10:00:00Z'), end: new Date('2024-01-15T11:00:00Z') },
    { start: new Date('2024-01-15T14:30:00Z'), end: new Date('2024-01-15T15:30:00Z') },
])

// Find 60-minute slots
const slots = scheduler.findAvailableSlots(new Date('2024-01-15T09:00:00Z'), new Date('2024-01-15T17:00:00Z'), {
    slotDuration: 60,
})
```

### 2. Meeting Room Scheduling with Padding

```typescript
// Add 15-minute padding for room setup/cleanup
const slots = scheduler.findAvailableSlots(new Date('2024-01-15T09:00:00Z'), new Date('2024-01-15T17:00:00Z'), {
    slotDuration: 60,
    padding: 15, // 15 minutes buffer around busy times
})
```

### 3. Overlapping Time Slots

```typescript
// Generate 60-minute slots every 30 minutes (overlapping)
const slots = scheduler.findAvailableSlots(new Date('2024-01-15T09:00:00Z'), new Date('2024-01-15T17:00:00Z'), {
    slotDuration: 60,
    slotSplit: 30, // New slot every 30 minutes
})
```

### 4. Aligned Scheduling

```typescript
// Align slots to quarter-hours (15-minute boundaries)
const slots = scheduler.findAvailableSlots(new Date('2024-01-15T09:00:00Z'), new Date('2024-01-15T17:00:00Z'), {
    slotDuration: 30,
    slotSplit: 15, // Align to 15-minute intervals
    offset: 0, // Start on the hour
})
```

## Working with Multiple Schedulers

```typescript
// Separate schedulers for different resources
const roomScheduler = createScheduler()
const equipmentScheduler = createScheduler()

// Add resource-specific busy times
roomScheduler.addBusyTimes([...roomBookings])
equipmentScheduler.addBusyTimes([...equipmentBookings])

// Find slots available for both
const roomSlots = roomScheduler.findAvailableSlots(start, end, options)
const equipmentSlots = equipmentScheduler.findAvailableSlots(start, end, options)

// Find intersection of available slots
const bothAvailable = findIntersection(roomSlots, equipmentSlots)
```

## Error Handling

```typescript
try {
    const slots = scheduler.findAvailableSlots(
        new Date('2024-01-15T17:00:00Z'), // End time
        new Date('2024-01-15T09:00:00Z'), // Start time (invalid!)
        { slotDuration: 30 }
    )
} catch (error) {
    console.error('Invalid time range:', error.message)
}
```

## Next Steps

- [API Reference](api-reference.md) - Complete method documentation
- [Core Concepts](core-concepts.md) - Detailed explanation of scheduling concepts
- [Examples](examples.md) - Real-world usage scenarios
- [Performance Guide](performance.md) - Optimization tips
