# Availability Scheduler

Back: [Core Concepts](core-concepts.md) • Next: [API Reference](api-reference.md)

Define recurring weekly availability patterns (e.g., business hours) and find available slots that respect both those patterns and manually-added busy times. This guide covers the `AvailabilityScheduler` class and related helpers.

## Table of Contents

- Core Concepts
- Types and Interfaces
- AvailabilityScheduler Class
- Helper Functions
- Usage Examples
- Best Practices
- Common Pitfalls
- Error Handling

## Core Concepts

### Weekly Availability Pattern

Define available time periods per day (not busy times). The system converts these available periods into busy times so everything outside is considered unavailable.

### Implicit Breaks

Create breaks by using multiple time blocks for the same day:

```typescript
// Creates a lunch break on Monday from 12:00-13:00
{
  schedules: [
    { days: ['monday'], start: '09:00', end: '12:00' }, // Morning
    { days: ['monday'], start: '13:00', end: '17:00' }, // Afternoon
  ]
}
```

### Week-Based Processing

All availability processing is done on a weekly basis starting from Monday. You must provide a Monday date when converting availability to busy times.

## Types and Interfaces

### `DayOfWeek`

```typescript
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
```

### `DaySchedule`

```typescript
interface DaySchedule {
  days: DayOfWeek[]
  start: string | number // 'HH:mm' or minutes since midnight
  end: string | number   // 'HH:mm' or minutes since midnight
}
```

Key requirements:

- `days`: Must contain at least one valid day
- `start`/`end`: Must be valid times
- `start` must be before `end`

### `WeeklyAvailability`

```typescript
interface WeeklyAvailability {
  schedules: DaySchedule[]
}
```

Key requirement:

- `schedules`: Must contain at least one schedule

## AvailabilityScheduler Class

The main class for working with weekly availability patterns.

### Constructor

```typescript
constructor(availability?: WeeklyAvailability, timezone?: string, existingBusyTimes: BusyTime[] = [])
```

Parameters:

- `availability` (optional): The weekly availability pattern
- `timezone` (optional): IANA timezone identifier used for availability processing and daily window fallback
- `existingBusyTimes` (optional): Array of existing busy times to include

Example:

```typescript
import { AvailabilityScheduler } from 'scheduling-sdk'

const availability = {
  schedules: [{ days: ['monday', 'tuesday'], start: '09:00', end: '17:00' }],
}

const scheduler = new AvailabilityScheduler(availability, 'America/New_York')
```

### Methods

- `setAvailability(availability: WeeklyAvailability): void` — replaces the existing availability pattern.
- `getAvailability(): WeeklyAvailability | undefined` — returns the current availability pattern.
- `addBusyTime(busyTime: BusyTime): void`
- `addBusyTimes(busyTimes: BusyTime[]): void`
- `clearBusyTimes(): void`
- `getBusyTimes(): BusyTime[]`
- `findAvailableSlots(startTime: Date, endTime: Date, options: SchedulingOptions): TimeSlot[]`

Find available time slots within the specified time range, considering both availability patterns and manually added busy times.

Important behavior:

- If no availability pattern is set, behaves like the standard Scheduler
- If availability is set, only returns slots within available periods
- Combines availability restrictions with manually added busy times

```typescript
const slots = scheduler.findAvailableSlots(
  new Date('2024-01-15T08:00:00Z'),
  new Date('2024-01-15T18:00:00Z'),
  { slotDuration: 60, slotSplit: 60, padding: 15 }
)
```

## Helper Functions

### `weeklyAvailabilityToBusyTimes(availability: WeeklyAvailability, weekStart: Date, timezone?: string): BusyTime[]`

Converts a weekly availability pattern into busy times for a specific week.

Parameters:

- `availability`: The weekly availability pattern to convert
- `weekStart`: Must be a Monday (`Date.getDay() === 1`)
- `timezone` (optional): IANA timezone used to interpret availability times. Falls back to `process.env.SCHEDULING_TIMEZONE` or `UTC`.

Returns: Array of busy times representing unavailable periods.

Critical requirements:

- `weekStart` MUST be a Monday, or the function throws an error
- Generates busy times for the entire week (7 days)
- Available periods become gaps in the busy times

```typescript
const mondayDate = new Date('2024-01-01T00:00:00Z') // Must be Monday
const availability = {
  schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
}

const busyTimes = weeklyAvailabilityToBusyTimes(availability, mondayDate, 'America/New_York')
```

### `validateWeeklyAvailability(availability?: WeeklyAvailability): void`

Validates a weekly availability object and throws descriptive errors if invalid.

Validation rules:

- `availability` can be undefined (returns without error)
- Must be an object (not null, string, number, etc.)
- Must have a `schedules` array with at least one schedule
- Each schedule must have valid `days`, `start`, and `end`
- Times must be valid and start must be before end
- No overlapping schedules on the same day

## Usage Examples

### Example 1: Standard Business Hours

```typescript
import { AvailabilityScheduler } from 'scheduling-sdk'

const businessHours = {
  schedules: [
    {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      start: '09:00',
      end: '17:00',
    },
  ],
}

const scheduler = new AvailabilityScheduler(businessHours, 'America/New_York')

const slots = scheduler.findAvailableSlots(
  new Date('2024-01-15T00:00:00Z'),
  new Date('2024-01-19T23:59:59Z'),
  { slotDuration: 60, slotSplit: 60 }
)
```

### Example 2: Different Hours Per Day

```typescript
const doctorSchedule = {
  schedules: [
    { days: ['monday', 'wednesday', 'friday'], start: '08:00', end: '16:00' },
    { days: ['tuesday', 'thursday'], start: '12:00', end: '20:00' },
    { days: ['saturday'], start: '09:00', end: '13:00' },
  ],
}

const scheduler = new AvailabilityScheduler(doctorSchedule)
```

### Example 3: Lunch Breaks

```typescript
const scheduleWithLunch = {
  schedules: [
    { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '09:00', end: '12:00' },
    { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '13:00', end: '17:00' },
  ],
}
```

### Example 4: Adding Exceptions

```typescript
const scheduler = new AvailabilityScheduler(regularSchedule)

scheduler.addBusyTime({
  start: new Date('2024-01-15T14:00:00Z'),
  end: new Date('2024-01-15T15:30:00Z'),
})

const vacationDays = [
  { start: new Date('2024-01-20T00:00:00Z'), end: new Date('2024-01-21T00:00:00Z') },
  { start: new Date('2024-01-21T00:00:00Z'), end: new Date('2024-01-22T00:00:00Z') },
]

scheduler.addBusyTimes(vacationDays)
```

### Example 5: Dynamic Schedule Updates

```typescript
const scheduler = new AvailabilityScheduler()

// Start with summer hours
scheduler.setAvailability({
  schedules: [
    { days: ['monday', 'tuesday', 'wednesday', 'thursday'], start: '08:00', end: '16:00' },
    { days: ['friday'], start: '08:00', end: '12:00' },
  ],
})

// Later, switch to winter hours
scheduler.setAvailability({
  schedules: [{ days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '09:00', end: '17:00' }],
})
```

## Best Practices

### 1. Time Format Consistency

```typescript
// ✅ Good - consistent 24-hour format
{ start: '09:00', end: '17:00' }

// ❌ Bad - inconsistent formatting
{ start: '9:00', end: '5:00 PM' } // Will fail validation
```

### 2. Handling Timezones

```typescript
// Specify timezone at the scheduler level
const availability = { schedules: [...] }
const scheduler = new AvailabilityScheduler(availability, 'America/Los_Angeles')

// Or specify timezone when converting availability for a week
const localMondayStart = new Date('2024-01-01T00:00:00Z') // Monday UTC
const busyTimes = weeklyAvailabilityToBusyTimes(availability, localMondayStart, 'America/Los_Angeles')
```

### 3. Break Management

```typescript
// Create breaks with separate time blocks
{
  schedules: [
    { days: ['monday'], start: '09:00', end: '12:00' },
    { days: ['monday'], start: '13:30', end: '17:00' },
  ]
}
```

### 4. Validate Early and Often

```typescript
try {
  validateWeeklyAvailability(userProvidedAvailability)
  const scheduler = new AvailabilityScheduler(userProvidedAvailability)
} catch (error) {
  // Handle validation error
}
```

### 5. Week Boundary Awareness

```typescript
// Always use Monday for week start
function getMondayOfWeek(date: Date): Date {
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + diff)
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate())
}

const mondayStart = getMondayOfWeek(new Date())
const busyTimes = weeklyAvailabilityToBusyTimes(availability, mondayStart)
```

## Common Pitfalls

- Non-Monday `weekStart`
- Overlapping schedules on the same day
- Using invalid time formats (must be HH:mm or minutes)
- Confusing availability (available periods) with busy times (unavailable periods)

## Error Handling

### Validation Errors

All validation errors include descriptive messages indicating what’s wrong.

### Runtime Errors

```typescript
try {
  const tuesday = new Date('2024-01-02') // Tuesday
  weeklyAvailabilityToBusyTimes(availability, tuesday)
} catch (error) {
  // "weekStart must be a Monday (getDay() === 1)"
}
```
