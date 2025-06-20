# Usage Examples

This document provides practical examples for common scheduling scenarios using the Scheduling SDK.

## Table of Contents

- [Basic Examples](#basic-examples)
- [Calendar Scheduling](#calendar-scheduling)
- [Resource Management](#resource-management)
- [Meeting Scheduling](#meeting-scheduling)
- [Advanced Scenarios](#advanced-scenarios)
- [Integration Patterns](#integration-patterns)

## Basic Examples

### Simple Appointment Booking

```typescript
import { createScheduler } from 'scheduling-sdk'

// Create scheduler with existing appointments
const appointmentScheduler = createScheduler([
    { start: new Date('2024-01-15T10:00:00Z'), end: new Date('2024-01-15T11:00:00Z') },
    { start: new Date('2024-01-15T14:00:00Z'), end: new Date('2024-01-15T15:00:00Z') }
])

// Find 60-minute appointment slots
const availableSlots = appointmentScheduler.findAvailableSlots(
    new Date('2024-01-15T09:00:00Z'), // 9 AM
    new Date('2024-01-15T17:00:00Z'), // 5 PM
    { slotDuration: 60 }
)

console.log(`Found ${availableSlots.length} available appointment slots`)
// Available slots: 9:00-10:00, 11:00-12:00, 12:00-13:00, 13:00-14:00, 15:00-16:00, 16:00-17:00
```

### Doctor's Office with Buffer Time

```typescript
// Medical appointments need cleanup/prep time between patients
const doctorScheduler = createScheduler([
    { start: new Date('2024-01-15T10:00:00Z'), end: new Date('2024-01-15T10:30:00Z') },
    { start: new Date('2024-01-15T14:00:00Z'), end: new Date('2024-01-15T15:00:00Z') }
])

const slots = doctorScheduler.findAvailableSlots(
    new Date('2024-01-15T09:00:00Z'),
    new Date('2024-01-15T17:00:00Z'),
    {
        slotDuration: 30,  // 30-minute appointments
        padding: 10        // 10-minute buffer for cleaning/prep
    }
)

// Slots will have 10-minute gaps around existing appointments
```

### Flexible Scheduling with Overlapping Slots

```typescript
// Generate overlapping consultation slots for flexibility
const consultationScheduler = createScheduler()

const flexibleSlots = consultationScheduler.findAvailableSlots(
    new Date('2024-01-15T09:00:00Z'),
    new Date('2024-01-15T17:00:00Z'),
    {
        slotDuration: 60,  // 1-hour consultations
        slotSplit: 30      // New slot every 30 minutes (overlapping)
    }
)

// Results in slots: 9:00-10:00, 9:30-10:30, 10:00-11:00, 10:30-11:30, etc.
```

## Calendar Scheduling

### Business Hours Scheduling

```typescript
import { createScheduler } from 'scheduling-sdk'

function createBusinessHoursScheduler() {
    const scheduler = createScheduler()
    
    // Add non-business hours as busy times
    const today = new Date('2024-01-15T00:00:00Z')
    
    // Block out before 9 AM
    scheduler.addBusyTimes([
        { start: new Date('2024-01-15T00:00:00Z'), end: new Date('2024-01-15T09:00:00Z') }
    ])
    
    // Block out lunch (12-1 PM)
    scheduler.addBusyTimes([
        { start: new Date('2024-01-15T12:00:00Z'), end: new Date('2024-01-15T13:00:00Z') }
    ])
    
    // Block out after 5 PM
    scheduler.addBusyTimes([
        { start: new Date('2024-01-15T17:00:00Z'), end: new Date('2024-01-15T23:59:59Z') }
    ])
    
    return scheduler
}

const businessScheduler = createBusinessHoursScheduler()

// Add actual meetings
businessScheduler.addBusyTimes([
    { start: new Date('2024-01-15T10:00:00Z'), end: new Date('2024-01-15T11:00:00Z') }
])

const meetingSlots = businessScheduler.findAvailableSlots(
    new Date('2024-01-15T00:00:00Z'),
    new Date('2024-01-15T23:59:59Z'),
    { slotDuration: 60 }
)

// Results in slots only during business hours, excluding lunch and existing meetings
```

### Multi-Day Scheduling

```typescript
function findSlotsAcrossWeek(existingMeetings, slotDuration = 60) {
    const scheduler = createScheduler(existingMeetings)
    const allSlots = []
    
    // Schedule across work week
    for (let day = 0; day < 5; day++) {
        const dayStart = new Date(`2024-01-${15 + day}T09:00:00Z`)
        const dayEnd = new Date(`2024-01-${15 + day}T17:00:00Z`)
        
        const daySlots = scheduler.findAvailableSlots(dayStart, dayEnd, {
            slotDuration,
            padding: 15  // 15-minute buffer between meetings
        })
        
        allSlots.push(...daySlots.map(slot => ({
            ...slot,
            day: dayStart.toDateString()
        })))
    }
    
    return allSlots
}

const weeklySlots = findSlotsAcrossWeek([
    { start: new Date('2024-01-15T10:00:00Z'), end: new Date('2024-01-15T11:00:00Z') },
    { start: new Date('2024-01-16T14:00:00Z'), end: new Date('2024-01-16T15:30:00Z') }
])
```

## Resource Management

### Meeting Room Booking

```typescript
class MeetingRoomScheduler {
    private rooms = new Map()
    
    constructor(roomNames: string[]) {
        roomNames.forEach(name => {
            this.rooms.set(name, createScheduler())
        })
    }
    
    bookRoom(roomName: string, booking: BusyTime) {
        const scheduler = this.rooms.get(roomName)
        if (scheduler) {
            scheduler.addBusyTimes([booking])
        }
    }
    
    findAvailableRooms(startTime: Date, endTime: Date, duration: number) {
        const availableRooms = []
        
        for (const [roomName, scheduler] of this.rooms) {
            const slots = scheduler.findAvailableSlots(startTime, endTime, {
                slotDuration: duration,
                padding: 15  // Setup/cleanup time
            })
            
            if (slots.length > 0) {
                availableRooms.push({
                    room: roomName,
                    availableSlots: slots
                })
            }
        }
        
        return availableRooms
    }
    
    findBestRoomSlot(startTime: Date, endTime: Date, duration: number) {
        const available = this.findAvailableRooms(startTime, endTime, duration)
        
        if (available.length === 0) return null
        
        // Return room with earliest available slot
        return available.reduce((best, current) => {
            const bestFirstSlot = best.availableSlots[0].start
            const currentFirstSlot = current.availableSlots[0].start
            return currentFirstSlot < bestFirstSlot ? current : best
        })
    }
}

// Usage
const roomScheduler = new MeetingRoomScheduler(['Conference A', 'Conference B', 'Huddle Room'])

// Book some rooms
roomScheduler.bookRoom('Conference A', {
    start: new Date('2024-01-15T10:00:00Z'),
    end: new Date('2024-01-15T11:00:00Z')
})

// Find available rooms for 2-hour meeting
const bestRoom = roomScheduler.findBestRoomSlot(
    new Date('2024-01-15T09:00:00Z'),
    new Date('2024-01-15T17:00:00Z'),
    120  // 2 hours
)

console.log(`Best room: ${bestRoom?.room}, First slot: ${bestRoom?.availableSlots[0].start}`)
```

### Equipment Scheduling

```typescript
class EquipmentScheduler {
    private equipmentSchedulers = new Map()
    
    constructor(equipment: { id: string, name: string, setupTime: number }[]) {
        equipment.forEach(item => {
            this.equipmentSchedulers.set(item.id, {
                scheduler: createScheduler(),
                setupTime: item.setupTime,
                name: item.name
            })
        })
    }
    
    reserveEquipment(equipmentId: string, reservation: BusyTime) {
        const equipment = this.equipmentSchedulers.get(equipmentId)
        if (equipment) {
            equipment.scheduler.addBusyTimes([reservation])
        }
    }
    
    findAvailableEquipment(startTime: Date, endTime: Date, duration: number) {
        const results = []
        
        for (const [id, equipment] of this.equipmentSchedulers) {
            const slots = equipment.scheduler.findAvailableSlots(startTime, endTime, {
                slotDuration: duration,
                padding: equipment.setupTime  // Account for setup/breakdown
            })
            
            if (slots.length > 0) {
                results.push({
                    equipmentId: id,
                    name: equipment.name,
                    availableSlots: slots,
                    setupTime: equipment.setupTime
                })
            }
        }
        
        return results
    }
}

// Usage
const equipmentScheduler = new EquipmentScheduler([
    { id: 'projector-1', name: 'Conference Projector', setupTime: 10 },
    { id: 'camera-1', name: 'Video Camera', setupTime: 20 },
    { id: 'sound-1', name: 'Sound System', setupTime: 30 }
])

const availableEquipment = equipmentScheduler.findAvailableEquipment(
    new Date('2024-01-15T14:00:00Z'),
    new Date('2024-01-15T16:00:00Z'),
    90  // 90-minute event
)
```

## Meeting Scheduling

### Team Meeting Finder

```typescript
class TeamMeetingScheduler {
    private teamMembers = new Map()
    
    addTeamMember(name: string, busyTimes: BusyTime[] = []) {
        this.teamMembers.set(name, createScheduler(busyTimes))
    }
    
    addMemberBusyTime(name: string, busyTime: BusyTime) {
        const scheduler = this.teamMembers.get(name)
        if (scheduler) {
            scheduler.addBusyTimes([busyTime])
        }
    }
    
    findTeamMeetingSlots(startTime: Date, endTime: Date, duration: number) {
        if (this.teamMembers.size === 0) return []
        
        // Get available slots for first member
        const firstMember = this.teamMembers.values().next().value
        let commonSlots = firstMember.findAvailableSlots(startTime, endTime, {
            slotDuration: duration
        })
        
        // Find intersection with all other members
        for (const scheduler of this.teamMembers.values()) {
            const memberSlots = scheduler.findAvailableSlots(startTime, endTime, {
                slotDuration: duration
            })
            
            commonSlots = this.findSlotIntersection(commonSlots, memberSlots)
        }
        
        return commonSlots
    }
    
    private findSlotIntersection(slots1: TimeSlot[], slots2: TimeSlot[]): TimeSlot[] {
        const intersection = []
        
        for (const slot1 of slots1) {
            for (const slot2 of slots2) {
                if (slot1.start.getTime() === slot2.start.getTime() &&
                    slot1.end.getTime() === slot2.end.getTime()) {
                    intersection.push(slot1)
                    break
                }
            }
        }
        
        return intersection
    }
}

// Usage
const teamScheduler = new TeamMeetingScheduler()

// Add team members with their busy times
teamScheduler.addTeamMember('Alice', [
    { start: new Date('2024-01-15T10:00:00Z'), end: new Date('2024-01-15T11:00:00Z') }
])
teamScheduler.addTeamMember('Bob', [
    { start: new Date('2024-01-15T14:00:00Z'), end: new Date('2024-01-15T15:00:00Z') }
])
teamScheduler.addTeamMember('Charlie', [
    { start: new Date('2024-01-15T09:00:00Z'), end: new Date('2024-01-15T10:00:00Z') }
])

// Find 90-minute team meeting slots
const teamSlots = teamScheduler.findTeamMeetingSlots(
    new Date('2024-01-15T09:00:00Z'),
    new Date('2024-01-15T17:00:00Z'),
    90
)

console.log(`Found ${teamSlots.length} slots where all team members are available`)
```

## Advanced Scenarios

### Dynamic Scheduling with Priorities

```typescript
class PriorityScheduler {
    private highPriorityScheduler = createScheduler()
    private normalScheduler = createScheduler()
    
    addHighPriorityBusyTime(busyTime: BusyTime) {
        this.highPriorityScheduler.addBusyTimes([busyTime])
        this.normalScheduler.addBusyTimes([busyTime])
    }
    
    addNormalBusyTime(busyTime: BusyTime) {
        this.normalScheduler.addBusyTimes([busyTime])
    }
    
    findHighPrioritySlots(startTime: Date, endTime: Date, options: SchedulingOptions) {
        return this.highPriorityScheduler.findAvailableSlots(startTime, endTime, options)
    }
    
    findNormalSlots(startTime: Date, endTime: Date, options: SchedulingOptions) {
        return this.normalScheduler.findAvailableSlots(startTime, endTime, options)
    }
    
    canScheduleHighPriority(startTime: Date, endTime: Date): boolean {
        const slot = { start: startTime, end: endTime }
        const highPrioritySlots = this.findHighPrioritySlots(
            startTime,
            endTime,
            { slotDuration: (endTime.getTime() - startTime.getTime()) / (1000 * 60) }
        )
        
        return highPrioritySlots.some(s => 
            s.start.getTime() <= startTime.getTime() && 
            s.end.getTime() >= endTime.getTime()
        )
    }
}
```

### Recurring Appointment Scheduling

```typescript
class RecurringScheduler {
    private scheduler = createScheduler()
    
    addRecurringBusyTime(
        startTime: Date,
        endTime: Date,
        pattern: 'daily' | 'weekly' | 'monthly',
        occurrences: number
    ) {
        const busyTimes = []
        const duration = endTime.getTime() - startTime.getTime()
        
        for (let i = 0; i < occurrences; i++) {
            let nextStart: Date
            
            switch (pattern) {
                case 'daily':
                    nextStart = new Date(startTime.getTime() + i * 24 * 60 * 60 * 1000)
                    break
                case 'weekly':
                    nextStart = new Date(startTime.getTime() + i * 7 * 24 * 60 * 60 * 1000)
                    break
                case 'monthly':
                    nextStart = new Date(startTime)
                    nextStart.setMonth(nextStart.getMonth() + i)
                    break
            }
            
            busyTimes.push({
                start: nextStart,
                end: new Date(nextStart.getTime() + duration)
            })
        }
        
        this.scheduler.addBusyTimes(busyTimes)
    }
    
    findAvailableSlots(startTime: Date, endTime: Date, options: SchedulingOptions) {
        return this.scheduler.findAvailableSlots(startTime, endTime, options)
    }
}

// Usage
const recurringScheduler = new RecurringScheduler()

// Add weekly team standup (every Monday 9-10 AM for 12 weeks)
recurringScheduler.addRecurringBusyTime(
    new Date('2024-01-15T09:00:00Z'), // Monday 9 AM
    new Date('2024-01-15T10:00:00Z'), // Monday 10 AM
    'weekly',
    12
)

// Find available slots avoiding recurring meetings
const slots = recurringScheduler.findAvailableSlots(
    new Date('2024-01-15T08:00:00Z'),
    new Date('2024-01-15T18:00:00Z'),
    { slotDuration: 60 }
)
```

## Integration Patterns

### With Calendar APIs

```typescript
// Example integration with a calendar API
class CalendarIntegration {
    private scheduler = createScheduler()
    
    async syncWithCalendar(calendarApi: any, startDate: Date, endDate: Date) {
        // Fetch events from calendar API
        const events = await calendarApi.getEvents(startDate, endDate)
        
        // Convert to busy times
        const busyTimes = events.map(event => ({
            start: new Date(event.start),
            end: new Date(event.end)
        }))
        
        // Clear and update scheduler
        this.scheduler.clearBusyTimes()
        this.scheduler.addBusyTimes(busyTimes)
    }
    
    async findAvailableMeetingTimes(
        startDate: Date,
        endDate: Date,
        duration: number
    ) {
        // Sync with calendar first
        await this.syncWithCalendar(calendarApi, startDate, endDate)
        
        // Find available slots
        return this.scheduler.findAvailableSlots(startDate, endDate, {
            slotDuration: duration,
            padding: 15  // 15-minute buffer
        })
    }
}
```

### Database Integration

```typescript
// Example with database persistence
class PersistentScheduler {
    private scheduler = createScheduler()
    private db: any // Your database connection
    
    async loadBusyTimes(resourceId: string) {
        const busyTimes = await this.db.query(`
            SELECT start_time, end_time 
            FROM busy_times 
            WHERE resource_id = ?
        `, [resourceId])
        
        this.scheduler.clearBusyTimes()
        this.scheduler.addBusyTimes(busyTimes.map(row => ({
            start: new Date(row.start_time),
            end: new Date(row.end_time)
        })))
    }
    
    async saveBusyTime(resourceId: string, busyTime: BusyTime) {
        await this.db.query(`
            INSERT INTO busy_times (resource_id, start_time, end_time) 
            VALUES (?, ?, ?)
        `, [resourceId, busyTime.start, busyTime.end])
        
        this.scheduler.addBusyTimes([busyTime])
    }
    
    async findAvailableSlots(
        resourceId: string,
        startTime: Date,
        endTime: Date,
        options: SchedulingOptions
    ) {
        await this.loadBusyTimes(resourceId)
        return this.scheduler.findAvailableSlots(startTime, endTime, options)
    }
}
```

These examples demonstrate the flexibility and power of the Scheduling SDK for various real-world scenarios. For more information, see the [API Reference](api-reference.md) and [Core Concepts](core-concepts.md) documentation.