import { AvailabilityScheduler } from '../src/availability/scheduler'
import type { BusyTime, SchedulingOptions } from '../src/types/scheduling.types'

// Generate test data
function generateBusyTimes(count: number, dayOffset: number = 0): BusyTime[] {
	const busyTimes: BusyTime[] = []
	const baseDate = new Date('2024-01-15T00:00:00Z')
	baseDate.setDate(baseDate.getDate() + dayOffset)
	
	for (let i = 0; i < count; i++) {
		// Spread busy times across business hours (14:00-22:00 UTC = 9-5 EST)
		const hour = 14 + Math.floor(Math.random() * 8)
		const minute = Math.floor(Math.random() * 60)
		const duration = 30 + Math.floor(Math.random() * 90) // 30-120 min
		
		const start = new Date(baseDate)
		start.setUTCHours(hour, minute, 0, 0)
		
		const end = new Date(start)
		end.setUTCMinutes(end.getUTCMinutes() + duration)
		
		busyTimes.push({ start, end })
	}
	
	return busyTimes.sort((a, b) => a.start.getTime() - b.start.getTime())
}

function benchmark(name: string, fn: () => any, iterations: number = 50): number {
	// Warm up
	for (let i = 0; i < 5; i++) fn()
	
	const start = performance.now()
	for (let i = 0; i < iterations; i++) {
		fn()
	}
	const duration = performance.now() - start
	const avgTime = duration / iterations
	
	console.log(`${name}: ${avgTime.toFixed(3)}ms avg (${iterations} iterations)`)
	return avgTime
}

console.log('🚀 AvailabilityScheduler K-Overlaps Performance Benchmark\n')

// Setup availability pattern
const availability = {
	schedules: [
		{ days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '09:00', end: '17:00' },
		{ days: ['saturday'], start: '10:00', end: '14:00' }
	]
}

const testSizes = [20, 50, 100, 200]

for (const size of testSizes) {
	console.log(`\n📊 Testing with ${size} busy times:`)
	
	const busyTimes = generateBusyTimes(size)
	const scheduler = new AvailabilityScheduler(availability, 'America/New_York')
	scheduler.addBusyTimes(busyTimes)
	
	const startTime = new Date('2024-01-15T13:00:00Z') // Monday 8 AM EST
	const endTime = new Date('2024-01-19T22:00:00Z')   // Friday 5 PM EST
	const options: SchedulingOptions = {
		slotDuration: 60,
		slotSplit: 60,
		padding: 10
	}
	
	// Traditional approach (no maxOverlaps)
	const traditionalTime = benchmark('Traditional (temp scheduler)', () => {
		return scheduler.findAvailableSlots(startTime, endTime, options)
	})
	
	// K-overlaps with K=0 (should use optimized path)
	const k0Time = benchmark('K-overlaps K=0 (optimized)', () => {
		return scheduler.findAvailableSlots(startTime, endTime, { ...options, maxOverlaps: 0 })
	})
	
	// K-overlaps with K=1
	const k1Time = benchmark('K-overlaps K=1', () => {
		return scheduler.findAvailableSlots(startTime, endTime, { ...options, maxOverlaps: 1 })
	})
	
	// K-overlaps with K=2  
	const k2Time = benchmark('K-overlaps K=2', () => {
		return scheduler.findAvailableSlots(startTime, endTime, { ...options, maxOverlaps: 2 })
	})
	
	console.log(`   Optimization benefit: ${((traditionalTime / k0Time - 1) * 100).toFixed(1)}% faster`)
	console.log(`   K=1 vs K=0 overhead: ${((k1Time / k0Time - 1) * 100).toFixed(1)}%`)
	console.log(`   K=2 vs K=0 overhead: ${((k2Time / k0Time - 1) * 100).toFixed(1)}%`)
}

// Memory usage test
console.log('\n🧠 Memory Usage Test:')
const largeScheduler = new AvailabilityScheduler(availability, 'America/New_York')
const largeBusyTimes = generateBusyTimes(500)
largeScheduler.addBusyTimes(largeBusyTimes)

const memBefore = process.memoryUsage()
const result = largeScheduler.findAvailableSlots(
	new Date('2024-01-15T13:00:00Z'),
	new Date('2024-01-19T22:00:00Z'),
	{ slotDuration: 30, maxOverlaps: 2 }
)
const memAfter = process.memoryUsage()

console.log(`Processed ${largeBusyTimes.length} busy times + availability pattern`)
console.log(`Found ${result.length} available slots`)
console.log(`Memory used: ${((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024).toFixed(2)} MB`)

// Multi-day performance test
console.log('\n📅 Multi-day Performance Test:')
const multiDayScheduler = new AvailabilityScheduler(availability, 'UTC')
const weekBusyTimes = []

// Generate busy times across a full week
for (let day = 0; day < 7; day++) {
	weekBusyTimes.push(...generateBusyTimes(30, day))
}
multiDayScheduler.addBusyTimes(weekBusyTimes)

const multiDayTime = benchmark('Week-long scheduling', () => {
	return multiDayScheduler.findAvailableSlots(
		new Date('2024-01-15T00:00:00Z'), // Monday
		new Date('2024-01-21T23:59:59Z'), // Sunday
		{ slotDuration: 60, maxOverlaps: 1 }
	)
}, 20)

// Complexity scaling test
console.log('\n📈 Availability Pattern Complexity Test:')
const complexAvailability = {
	schedules: [
		{ days: ['monday'], start: '08:00', end: '12:00' },
		{ days: ['monday'], start: '13:00', end: '17:00' },
		{ days: ['tuesday'], start: '09:00', end: '15:00' },
		{ days: ['wednesday'], start: '10:00', end: '18:00' },
		{ days: ['thursday'], start: '08:30', end: '16:30' },
		{ days: ['friday'], start: '09:00', end: '17:00' },
		{ days: ['saturday'], start: '10:00', end: '14:00' }
	]
}

const complexScheduler = new AvailabilityScheduler(complexAvailability, 'America/New_York')
complexScheduler.addBusyTimes(generateBusyTimes(100))

const complexTime = benchmark('Complex availability pattern', () => {
	return complexScheduler.findAvailableSlots(
		new Date('2024-01-15T08:00:00Z'),
		new Date('2024-01-21T23:00:00Z'),
		{ slotDuration: 45, maxOverlaps: 2 }
	)
}, 20)

console.log(`Complex vs simple pattern overhead: ${((complexTime / multiDayTime - 1) * 100).toFixed(1)}%`)

console.log('\n✅ AvailabilityScheduler benchmark completed!')