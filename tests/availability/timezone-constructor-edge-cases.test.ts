import { describe, expect, test } from 'bun:test'
import { AvailabilityScheduler } from '../../src/availability/scheduler'

describe('AvailabilityScheduler - Timezone Constructor Edge Cases', () => {
	describe('Environment variable fallback', () => {
		test('should use environment variable when no timezone provided', () => {
			// Set env var temporarily
			const originalEnv = process.env.SCHEDULING_TIMEZONE
			process.env.SCHEDULING_TIMEZONE = 'Europe/Berlin'
			
			try {
				const availability = {
					schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }]
				}
				
				// Should not throw with valid env timezone
				expect(() => new AvailabilityScheduler(availability)).not.toThrow()
			} finally {
				// Restore original env
				if (originalEnv !== undefined) {
					process.env.SCHEDULING_TIMEZONE = originalEnv
				} else {
					delete process.env.SCHEDULING_TIMEZONE
				}
			}
		})

		test('should reject invalid env var and throw at construction', () => {
			const originalEnv = process.env.SCHEDULING_TIMEZONE
			process.env.SCHEDULING_TIMEZONE = 'Invalid/Timezone'
			
			try {
				const availability = {
					schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }]
				}
				
				// Should throw because invalid timezone in env var
				expect(() => new AvailabilityScheduler(availability)).toThrow('Invalid timezone')
			} finally {
				if (originalEnv !== undefined) {
					process.env.SCHEDULING_TIMEZONE = originalEnv
				} else {
					delete process.env.SCHEDULING_TIMEZONE
				}
			}
		})
	})

	describe('Constructor parameter validation', () => {
		test('should reject invalid timezone at construction', () => {
			const availability = {
				schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }]
			}
			
			expect(() => new AvailabilityScheduler(availability, 'Invalid/Zone')).toThrow('Invalid timezone')
			expect(() => new AvailabilityScheduler(availability, 'NotReal/Timezone')).toThrow('Invalid timezone')
			expect(() => new AvailabilityScheduler(availability, '')).toThrow('Invalid timezone')
			
			// Note: GMT+5 format is actually invalid in Intl.DateTimeFormat - use Etc/GMT+5 instead
			expect(() => new AvailabilityScheduler(availability, 'GMT+5')).toThrow('Invalid timezone')
		})

		test('should accept all common IANA timezones', () => {
			const availability = {
				schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }]
			}
			
			const validTimezones = [
				'UTC',
				'GMT',
				'America/New_York',
				'Europe/London',
				'Asia/Tokyo',
				'Australia/Sydney',
				'Pacific/Honolulu',
				'America/Los_Angeles',
				'Europe/Berlin',
				'Asia/Kolkata',
				'Africa/Cairo'
			]
			
			for (const timezone of validTimezones) {
				expect(() => new AvailabilityScheduler(availability, timezone)).not.toThrow()
			}
		})

		test('should handle constructor parameter order correctly', () => {
			const availability = { schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }] }
			const busyTimes = [{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') }]
			
			// Test all valid constructor combinations
			expect(() => new AvailabilityScheduler()).not.toThrow()
			expect(() => new AvailabilityScheduler(availability)).not.toThrow()
			expect(() => new AvailabilityScheduler(availability, 'UTC')).not.toThrow()
			expect(() => new AvailabilityScheduler(availability, 'UTC', busyTimes)).not.toThrow()
			expect(() => new AvailabilityScheduler(undefined, 'UTC')).not.toThrow()
			expect(() => new AvailabilityScheduler(undefined, 'UTC', busyTimes)).not.toThrow()
		})
	})

	describe('Rare timezone edge cases', () => {
		test('should handle timezones with unusual offsets', () => {
			const availability = {
				schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }]
			}
			
			// Test unusual but valid timezones
			const unusualTimezones = [
				'Pacific/Kiritimati',    // UTC+14 (furthest ahead)
				'Pacific/Niue',          // UTC-11 
				'Asia/Kathmandu',        // UTC+5:45 (45-minute offset)
				'Australia/Eucla',       // UTC+8:45 (45-minute offset)  
				'Asia/Kolkata',          // UTC+5:30 (30-minute offset)
				'Australia/Adelaide'     // UTC+9:30/10:30 (30-minute + DST)
			]
			
			for (const timezone of unusualTimezones) {
				expect(() => new AvailabilityScheduler(availability, timezone)).not.toThrow()
			}
		})

		test('should handle timezone case sensitivity correctly', () => {
			const availability = {
				schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }]
			}
			
			// JavaScript's Intl.DateTimeFormat is actually case-insensitive for many timezones
			// All of these work in practice
			expect(() => new AvailabilityScheduler(availability, 'america/new_york')).not.toThrow()
			expect(() => new AvailabilityScheduler(availability, 'AMERICA/NEW_YORK')).not.toThrow()
			expect(() => new AvailabilityScheduler(availability, 'America/new_york')).not.toThrow()
			expect(() => new AvailabilityScheduler(availability, 'America/New_York')).not.toThrow()
			
			// Test some genuinely invalid formats that should fail
			expect(() => new AvailabilityScheduler(availability, 'Invalid_Format_Here')).toThrow()
		})
	})

	describe('Day array flexibility edge cases', () => {
		test('should handle all possible day combinations', () => {
			// Single days
			for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']) {
				const availability = { schedules: [{ days: [day], start: '09:00', end: '17:00' }] }
				expect(() => new AvailabilityScheduler(availability)).not.toThrow()
			}
			
			// Empty days (should work)
			const emptyAvailability = { schedules: [{ days: [], start: '09:00', end: '17:00' }] }
			expect(() => new AvailabilityScheduler(emptyAvailability)).not.toThrow()
			
			// All days
			const fullAvailability = { 
				schedules: [{ 
					days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], 
					start: '00:00', 
					end: '23:59' 
				}] 
			}
			expect(() => new AvailabilityScheduler(fullAvailability)).not.toThrow()
		})

		test('should handle days in any order', () => {
			const availability1 = {
				schedules: [{ days: ['friday', 'monday', 'wednesday'], start: '09:00', end: '17:00' }]
			}
			const availability2 = {
				schedules: [{ days: ['monday', 'wednesday', 'friday'], start: '09:00', end: '17:00' }]
			}
			
			const scheduler1 = new AvailabilityScheduler(availability1)
			const scheduler2 = new AvailabilityScheduler(availability2)
			
			const startTime = new Date('2024-01-15T00:00:00Z') // Monday
			const endTime = new Date('2024-01-21T23:59:59Z')   // Sunday
			
			const slots1 = scheduler1.findAvailableSlots(startTime, endTime, { slotDuration: 60 })
			const slots2 = scheduler2.findAvailableSlots(startTime, endTime, { slotDuration: 60 })
			
			// Should produce the same number of slots regardless of day order
			expect(slots1.length).toBe(slots2.length)
		})

		test('should handle multiple schedules with overlapping days', () => {
			const availability = {
				schedules: [
					{ days: ['monday', 'wednesday', 'friday'], start: '09:00', end: '12:00' },
					{ days: ['monday', 'wednesday', 'friday'], start: '13:00', end: '17:00' },
					{ days: ['tuesday', 'thursday'], start: '10:00', end: '16:00' }
				]
			}
			
			expect(() => new AvailabilityScheduler(availability)).not.toThrow()
			
			const scheduler = new AvailabilityScheduler(availability)
			const startTime = new Date('2024-01-15T00:00:00Z') // Monday
			const endTime = new Date('2024-01-19T23:59:59Z')   // Friday
			
			const slots = scheduler.findAvailableSlots(startTime, endTime, { slotDuration: 30 })
			expect(slots.length).toBeGreaterThan(0)
		})
	})
})