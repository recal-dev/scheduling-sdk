# Weekly Availability API Documentation

The Weekly Availability API allows you to define recurring weekly schedules that specify when time slots are available for scheduling. This is perfect for businesses, professionals, or services that operate on predictable weekly patterns.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Types and Interfaces](#types-and-interfaces)
- [AvailabilityScheduler Class](#availabilityscheduler-class)
- [Helper Functions](#helper-functions)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Common Pitfalls](#common-pitfalls)
- [Error Handling](#error-handling)

## Core Concepts

### Weekly Availability Pattern

The availability system works by defining **available time periods** rather than busy times. The system automatically converts these available periods into busy times that block out all other times.

### Implicit Breaks

Instead of explicitly defining breaks, you create breaks by defining multiple separate time blocks for the same day:

```typescript
// Creates a lunch break on Monday from 12:00-13:00
{
  schedules: [
    { days: ['monday'], start: '09:00', end: '12:00' },  // Morning
    { days: ['monday'], start: '13:00', end: '17:00' }   // Afternoon
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

Represents days of the week as lowercase strings.

### `DaySchedule`

```typescript
interface DaySchedule {
    days: DayOfWeek[]     // Array of days this schedule applies to
    start: string         // Start time in HH:mm format (24-hour)
    end: string          // End time in HH:mm format (24-hour)
}
```

**Key Requirements:**
- `days`: Must contain at least one valid day
- `start`/`end`: Must be in `HH:mm` format (e.g., "09:00", "14:30")
- `start` must be before `end`
- Times are in 24-hour format (00:00 to 23:59)

### `WeeklyAvailability`

```typescript
interface WeeklyAvailability {
    schedules: DaySchedule[]    // Array of availability schedules
    timezone?: string          // Optional IANA timezone identifier
}
```

**Key Requirements:**
- `schedules`: Must contain at least one schedule
- `timezone`: Optional IANA timezone (e.g., "America/New_York", "Europe/London")

## AvailabilityScheduler Class

The main class for working with weekly availability patterns.

### Constructor

```typescript
constructor(availability?: WeeklyAvailability, existingBusyTimes: BusyTime[] = [])
```

Creates a new availability scheduler with optional initial availability and existing busy times.

**Parameters:**
- `availability` (optional): The weekly availability pattern
- `existingBusyTimes` (optional): Array of existing busy times to include

**Example:**
```typescript
const availability = {
  schedules: [
    { days: ['monday', 'tuesday'], start: '09:00', end: '17:00' }
  ]
}

const scheduler = new AvailabilityScheduler(availability)
```

### Methods

#### `setAvailability(availability: WeeklyAvailability): void`

Sets or updates the weekly availability pattern.

**⚠️ Important:** This completely replaces the existing availability pattern.

```typescript
scheduler.setAvailability({
  schedules: [
    { days: ['monday', 'wednesday', 'friday'], start: '10:00', end: '16:00' }
  ]
})
```

#### `getAvailability(): WeeklyAvailability | undefined`

Returns the current availability pattern or `undefined` if none is set.

```typescript
const currentAvailability = scheduler.getAvailability()
if (currentAvailability) {
  console.log(`Found ${currentAvailability.schedules.length} schedules`)
}
```

#### `addBusyTime(busyTime: BusyTime): void`

Adds a single busy time that will be combined with availability-based busy times.

**Use Case:** One-off appointments, meetings, or exceptions to the regular schedule.

```typescript
// Block out a specific appointment
scheduler.addBusyTime({
  start: new Date('2024-01-15T14:00:00Z'),
  end: new Date('2024-01-15T15:00:00Z')
})
```

#### `addBusyTimes(busyTimes: BusyTime[]): void`

Adds multiple busy times at once.

```typescript
const appointments = [
  { start: new Date('2024-01-15T10:00:00Z'), end: new Date('2024-01-15T11:00:00Z') },
  { start: new Date('2024-01-15T15:00:00Z'), end: new Date('2024-01-15T16:00:00Z') }
]
scheduler.addBusyTimes(appointments)
```

#### `clearBusyTimes(): void`

Removes all manually added busy times. **Does not affect availability-based busy times.**

```typescript
scheduler.clearBusyTimes() // Only removes manually added busy times
```

#### `getBusyTimes(): BusyTime[]`

Returns all manually added busy times (not including availability-based busy times).

```typescript
const manualBusyTimes = scheduler.getBusyTimes()
console.log(`${manualBusyTimes.length} manual busy times`)
```

#### `findAvailableSlots(startTime: Date, endTime: Date, options: SchedulingOptions): TimeSlot[]`

Finds available time slots within the specified time range, considering both availability patterns and manually added busy times.

**Parameters:**
- `startTime`: Start of the search range
- `endTime`: End of the search range  
- `options`: Slot generation options (duration, split, offset, padding)

**Returns:** Array of available time slots

**⚠️ Important Behavior:**
- If no availability pattern is set, behaves like the standard Scheduler
- If availability is set, only returns slots within available periods
- Combines availability restrictions with manually added busy times

```typescript
const slots = scheduler.findAvailableSlots(
  new Date('2024-01-15T08:00:00Z'),
  new Date('2024-01-15T18:00:00Z'),
  {
    slotDuration: 60,      // 60-minute slots
    slotSplit: 60,         // No overlap
    padding: 15            // 15-minute buffer around busy times
  }
)
```

## Helper Functions

### `weeklyAvailabilityToBusyTimes(availability: WeeklyAvailability, weekStart: Date): BusyTime[]`

Converts a weekly availability pattern into busy times for a specific week.

**Parameters:**
- `availability`: The weekly availability pattern
- `weekStart`: **Must be a Monday** (Date.getDay() === 1)

**Returns:** Array of busy times representing unavailable periods

**⚠️ Critical Requirements:**
- `weekStart` MUST be a Monday, or the function throws an error
- The function generates busy times for the entire week (7 days)
- Available periods become gaps in the busy times

**Example:**
```typescript
const mondayDate = new Date('2024-01-01T00:00:00Z') // Must be Monday
const availability = {
  schedules: [
    { days: ['monday'], start: '09:00', end: '17:00' }
  ]
}

const busyTimes = weeklyAvailabilityToBusyTimes(availability, mondayDate)
// Returns busy times for:
// - Monday 00:00-09:00 and 17:00-23:59
// - Tuesday-Sunday all day
```

### `validateWeeklyAvailability(availability?: WeeklyAvailability): void`

Validates a weekly availability object and throws descriptive errors if invalid.

**Validation Rules:**
- `availability` can be undefined (returns without error)
- Must be an object (not null, string, number, etc.)
- Must have a `schedules` array with at least one schedule
- Each schedule must have valid `days`, `start`, and `end`
- Times must be in HH:mm format and start must be before end
- No overlapping schedules on the same day
- Optional `timezone` must be valid IANA format

**Example:**
```typescript
try {
  validateWeeklyAvailability(availability)
  console.log('Availability is valid')
} catch (error) {
  console.error('Invalid availability:', error.message)
}
```

## Usage Examples

### Example 1: Standard Business Hours

```typescript
import { AvailabilityScheduler } from './scheduling-sdk'

const businessHours = {
  schedules: [
    {
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      start: '09:00',
      end: '17:00'
    }
  ],
  timezone: 'America/New_York'
}

const scheduler = new AvailabilityScheduler(businessHours)

// Find 1-hour appointment slots for this week
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
    { days: ['saturday'], start: '09:00', end: '13:00' }
  ]
}

const scheduler = new AvailabilityScheduler(doctorSchedule)
```

### Example 3: Lunch Breaks

```typescript
const scheduleWithLunch = {
  schedules: [
    // Morning sessions
    { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '09:00', end: '12:00' },
    // Afternoon sessions (lunch break 12:00-13:00)
    { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '13:00', end: '17:00' }
  ]
}
```

### Example 4: Adding Exceptions

```typescript
const scheduler = new AvailabilityScheduler(regularSchedule)

// Add a one-off meeting
scheduler.addBusyTime({
  start: new Date('2024-01-15T14:00:00Z'),
  end: new Date('2024-01-15T15:30:00Z')
})

// Add vacation days
const vacationDays = [
  { start: new Date('2024-01-20T00:00:00Z'), end: new Date('2024-01-21T00:00:00Z') },
  { start: new Date('2024-01-21T00:00:00Z'), end: new Date('2024-01-22T00:00:00Z') }
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
    { days: ['friday'], start: '08:00', end: '12:00' }
  ]
})

// Later, switch to winter hours
scheduler.setAvailability({
  schedules: [
    { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '09:00', end: '17:00' }
  ]
})
```

## Best Practices

### 1. Time Format Consistency

```typescript
// ✅ Good - consistent 24-hour format
{ start: '09:00', end: '17:00' }

// ❌ Bad - inconsistent formatting
{ start: '9:00', end: '5:00 PM' }  // Will throw validation error
```

### 2. Handling Timezones

```typescript
// ✅ Good - specify timezone when working across timezones
const availability = {
  schedules: [...],
  timezone: 'America/Los_Angeles'
}

// ✅ Good - convert dates to appropriate timezone before processing
const localMondayStart = new Date('2024-01-01T08:00:00Z') // UTC Monday 8 AM
```

### 3. Break Management

```typescript
// ✅ Good - create breaks with separate time blocks
{
  schedules: [
    { days: ['monday'], start: '09:00', end: '12:00' },  // Morning
    { days: ['monday'], start: '13:30', end: '17:00' }   // Afternoon (90-min lunch)
  ]
}

// ❌ Avoid - trying to specify breaks as busy times with availability
// (Use addBusyTime for exceptions, not regular breaks)
```

### 4. Validation Early and Often

```typescript
// ✅ Good - validate before using
try {
  validateWeeklyAvailability(userProvidedAvailability)
  const scheduler = new AvailabilityScheduler(userProvidedAvailability)
} catch (error) {
  // Handle validation error gracefully
  showErrorToUser(error.message)
  return
}
```

### 5. Week Boundary Awareness

```typescript
// ✅ Good - always use Monday for week start
const mondayStart = getMondayOfWeek(someDate)
const busyTimes = weeklyAvailabilityToBusyTimes(availability, mondayStart)

// ❌ Bad - using arbitrary dates
const today = new Date()  // Might not be Monday!
weeklyAvailabilityToBusyTimes(availability, today)  // Throws error
```

## Common Pitfalls

### 1. **Non-Monday Week Start**

```typescript
// ❌ Error: This will throw if today is not Monday
const today = new Date()
weeklyAvailabilityToBusyTimes(availability, today)

// ✅ Correct: Always find the Monday of the week
function getMondayOfWeek(date: Date): Date {
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + diff)
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate())
}
```

### 2. **Time Format Mistakes**

```typescript
// ❌ Invalid formats that will cause validation errors
{ start: '9:00', end: '17:00' }      // Missing leading zero
{ start: '09:00 AM', end: '5:00 PM' } // 12-hour format
{ start: '9', end: '17' }            // Missing minutes
{ start: '25:00', end: '26:00' }     // Invalid hours

// ✅ Correct format
{ start: '09:00', end: '17:00' }
```

### 3. **Overlapping Schedules**

```typescript
// ❌ This will fail validation - schedules overlap 16:00-17:00
{
  schedules: [
    { days: ['monday'], start: '09:00', end: '17:00' },
    { days: ['monday'], start: '16:00', end: '20:00' }  // Overlaps!
  ]
}

// ✅ Correct - adjacent schedules are fine
{
  schedules: [
    { days: ['monday'], start: '09:00', end: '17:00' },
    { days: ['monday'], start: '17:00', end: '20:00' }  // Starts when other ends
  ]
}
```

### 4. **Misunderstanding Busy Times vs Availability**

```typescript
// ❌ Common mistake - thinking availability defines busy times
const scheduler = new AvailabilityScheduler({
  schedules: [
    { days: ['monday'], start: '12:00', end: '13:00' }  // User thinks this is lunch break
  ]
})
// This actually makes ONLY 12:00-13:00 available, everything else is busy!

// ✅ Correct - availability defines when you're available
const scheduler = new AvailabilityScheduler({
  schedules: [
    { days: ['monday'], start: '09:00', end: '12:00' },  // Morning availability
    { days: ['monday'], start: '13:00', end: '17:00' }   // Afternoon availability
  ]
})
// Lunch break (12:00-13:00) is automatically created by the gap
```

### 5. **Forgetting to Handle No Availability**

```typescript
// ❌ Not handling the case where no availability is set
const scheduler = new AvailabilityScheduler()  // No availability
const slots = scheduler.findAvailableSlots(start, end, options)
// This works (falls back to normal scheduling) but might not be intended

// ✅ Explicit handling
const scheduler = new AvailabilityScheduler()
if (!scheduler.getAvailability()) {
  throw new Error('Please set availability before finding slots')
}
```

## Error Handling

### Validation Errors

All validation errors include descriptive messages indicating exactly what's wrong:

```typescript
try {
  validateWeeklyAvailability(availability)
} catch (error) {
  // Examples of error messages:
  // "Schedule at index 0: start time (17:00) must be before end time (09:00)"
  // "Schedule at index 1: invalid day 'tuesday'. Valid days: monday, tuesday, ..."
  // "Overlapping schedules found for monday: schedule 1 (12:00-17:00) overlaps with schedule 0"
  // "Availability.timezone must be a valid IANA timezone identifier"
  
  console.error('Validation failed:', error.message)
}
```

### Runtime Errors

```typescript
try {
  const tuesday = new Date('2024-01-02')  // Tuesday
  weeklyAvailabilityToBusyTimes(availability, tuesday)
} catch (error) {
  // "weekStart must be a Monday (getDay() === 1)"
  console.error('Runtime error:', error.message)
}
```

### Best Practice Error Handling

```typescript
function createSchedulerSafely(availability: WeeklyAvailability): AvailabilityScheduler | null {
  try {
    validateWeeklyAvailability(availability)
    return new AvailabilityScheduler(availability)
  } catch (error) {
    console.error('Failed to create scheduler:', error.message)
    
    // Log detailed error for debugging
    if (error.message.includes('overlapping')) {
      console.log('Tip: Check for overlapping time periods on the same day')
    } else if (error.message.includes('time format')) {
      console.log('Tip: Use HH:mm format (e.g., "09:00", "14:30")')
    }
    
    return null
  }
}
```

## Performance Considerations

### 1. **Week-by-Week Processing**

The availability system processes one week at a time. For multi-week scheduling:

```typescript
// ✅ Efficient for single week
const thisWeek = weeklyAvailabilityToBusyTimes(availability, mondayStart)

// ⚠️ For multiple weeks, call separately for each week
const week1 = weeklyAvailabilityToBusyTimes(availability, monday1)
const week2 = weeklyAvailabilityToBusyTimes(availability, monday2)
const allBusyTimes = [...week1, ...week2]
```

### 2. **Caching Busy Times**

If you're using the same availability pattern repeatedly:

```typescript
// ✅ Cache converted busy times for repeated use
const cache = new Map<string, BusyTime[]>()

function getCachedBusyTimes(availability: WeeklyAvailability, weekStart: Date): BusyTime[] {
  const key = `${weekStart.toISOString()}-${JSON.stringify(availability)}`
  
  if (!cache.has(key)) {
    cache.set(key, weeklyAvailabilityToBusyTimes(availability, weekStart))
  }
  
  return cache.get(key)!
}
```

### 3. **Minimize Scheduler Recreation**

```typescript
// ✅ Reuse scheduler instance
const scheduler = new AvailabilityScheduler(availability)

// Add temporary busy times for different queries
scheduler.addBusyTime(appointment1)
const slots1 = scheduler.findAvailableSlots(...)

scheduler.clearBusyTimes()
scheduler.addBusyTime(appointment2)
const slots2 = scheduler.findAvailableSlots(...)

// ❌ Avoid recreating for each query
// const scheduler1 = new AvailabilityScheduler(availability)
// const scheduler2 = new AvailabilityScheduler(availability)
```

This documentation provides comprehensive guidance for using the Weekly Availability API effectively while avoiding common mistakes and performance issues.