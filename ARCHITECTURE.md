# Scheduling SDK Architecture

## Overview

A modular scheduling SDK that finds available time slots with configurable options like padding, duration, splitting, and offset.

## Module Structure

### 1. Types (`src/types/`)

- `scheduling.types.ts` - Core interfaces (TimeSlot, BusyTime, SchedulingOptions)
- `internal.types.ts` - Internal helper types

### 2. Helpers (`src/helpers/`)

#### Time Helpers (`time/`)

- `date-math.ts` - Basic date arithmetic operations
    - `addMinutes(date, minutes)`
    - `minutesBetween(start, end)`
    - `isSameDay(date1, date2)`
- `alignment.ts` - Time alignment and offset calculations
    - `alignToInterval(date, interval, offset)`
    - `findNextSlotBoundary(date, interval, offset)`
    - `calculateMinutesFromHour(date)`

#### Busy Time Helpers (`busy-time/`)

- `padding.ts` - Apply padding to busy times
    - `applyPadding(busyTimes, paddingMinutes)`
- `merge.ts` - Merge overlapping busy times
    - `mergeBusyTimes(busyTimes)`
    - `isOverlapping(time1, time2)`
- `overlap.ts` - Check slot/busy time overlaps
    - `hasOverlap(slot, busyTime)`
    - `isSlotAvailable(slot, busyTimes)`

#### Slot Helpers (`slot/`)

- `generator.ts` - Generate time slots
    - `generateSlots(start, end, duration, split, offset)`
    - `calculateFirstSlotStart(start, split, offset)`
- `filter.ts` - Filter available slots
    - `filterAvailableSlots(slots, busyTimes)`

### 3. Validators (`src/validators/`)

- `time-range.validator.ts` - Validate time ranges
    - `validateTimeRange(start, end)`
- `options.validator.ts` - Validate scheduling options
    - `validateOptions(options)`
    - `validateDuration(duration)`
    - `validateSplit(split, duration)`
    - `validateOffset(offset)`

### 4. Core (`src/core/`)

- `scheduler.ts` - Main Scheduler class that orchestrates all helpers

### 5. Utils (`src/utils/`)

- `constants.ts` - Shared constants (MS_PER_MINUTE, etc.)
- `errors.ts` - Custom error classes

## Data Flow

1. User provides time range and options to Scheduler
2. Input validation
3. Apply padding to busy times
4. Merge overlapping busy times
5. Generate potential slots based on duration, split, and offset
6. Filter slots that don't overlap with busy times
7. Return available slots

## Key Algorithms

### Slot Generation with Offset

- Start from the beginning of the time range
- Align to the nearest slot boundary considering offset
- Generate slots at split intervals until end time

### Slot Splitting

- If split < duration, generate overlapping slots
- Example: 30min duration, 15min split = slots at :00, :15, :30, :45

### Busy Time Merging

- Sort by start time
- Merge if end time of one overlaps with start of next
- Handle adjacent times (no gap)
