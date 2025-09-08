import { Scheduler } from '../src/core/scheduler'
import { generateSlots } from '../src/helpers/slot/generator'
import { filterAvailableSlots } from '../src/helpers/slot/filter'
import { findFreeIntervals, busyTimesToIntervals } from '../src/helpers/busy-time/free-intervals'
import type { BusyTime, SchedulingOptions } from '../src/types/scheduling.types'

// Generate test data
function generateBusyTimes(count: number, timeRange: number): BusyTime[] {
	const busyTimes: BusyTime[] = []
	for (let i = 0; i < count; i++) {
		const start = Math.floor(Math.random() * timeRange)
		const duration = Math.floor(Math.random() * 120 + 30) // 30-150 min duration
		busyTimes.push({
			start: new Date(start * 60 * 1000),
			end: new Date((start + duration) * 60 * 1000),
		})
	}
	return busyTimes.sort((a, b) => a.start.getTime() - b.start.getTime())
}

function benchmark(name: string, fn: () => any, iterations: number = 100): number {
	// Warm up
	for (let i = 0; i < 10; i++) fn()

	const start = performance.now()
	for (let i = 0; i < iterations; i++) {
		fn()
	}
	const duration = performance.now() - start
	const avgTime = duration / iterations

	console.log(`${name}: ${avgTime.toFixed(3)}ms avg (${iterations} iterations, ${duration.toFixed(2)}ms total)`)
	return avgTime
}

console.log('🚀 Performance Benchmark: Traditional vs K-Overlaps\n')

// Test configurations
const testSizes = [50, 100, 500, 1000]
const timeRange = 1440 * 7 // 1 week in minutes

for (const size of testSizes) {
	console.log(`\n📊 Testing with ${size} busy times:`)

	const busyTimes = generateBusyTimes(size, timeRange)
	const startTime = new Date(0)
	const endTime = new Date(timeRange * 60 * 1000)
	const options: SchedulingOptions = {
		slotDuration: 60,
		slotSplit: 60,
		padding: 15,
	}

	// Traditional approach
	const traditionalTime = benchmark('Traditional filtering', () => {
		const scheduler = new Scheduler(busyTimes)
		return scheduler.findAvailableSlots(startTime, endTime, options)
	})

	// K-overlaps with K=0 (equivalent to traditional)
	const kOverlapsTime = benchmark('K-overlaps (K=0)', () => {
		const scheduler = new Scheduler(busyTimes)
		return scheduler.findAvailableSlots(startTime, endTime, { ...options, maxOverlaps: 0 })
	})

	// K-overlaps with K=1 (allow single overlap)
	const _kOverlaps1Time = benchmark('K-overlaps (K=1)', () => {
		const scheduler = new Scheduler(busyTimes)
		return scheduler.findAvailableSlots(startTime, endTime, { ...options, maxOverlaps: 1 })
	})

	// Core sweep-line algorithm only
	const sweepLineTime = benchmark('Core sweep-line only', () => {
		const intervals = busyTimesToIntervals(busyTimes)
		return findFreeIntervals(intervals, 0, {
			start: startTime.getTime(),
			end: endTime.getTime(),
		})
	})

	console.log(`   Overhead: K-overlaps vs Traditional: ${((kOverlapsTime / traditionalTime - 1) * 100).toFixed(1)}%`)
	console.log(`   Core algorithm efficiency: ${((sweepLineTime / kOverlapsTime) * 100).toFixed(1)}% of total time`)
}

// Memory usage test
console.log('\n🧠 Memory Usage Test:')
const largeBusyTimes = generateBusyTimes(5000, timeRange * 4)

const memBefore = process.memoryUsage()
const scheduler = new Scheduler(largeBusyTimes)
const result = scheduler.findAvailableSlots(new Date(0), new Date(timeRange * 4 * 60 * 1000), {
	slotDuration: 60,
	maxOverlaps: 1,
})
const memAfter = process.memoryUsage()

console.log(`Processed ${largeBusyTimes.length} busy times, found ${result.length} slots`)
console.log(`Memory used: ${((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024).toFixed(2)} MB`)

// Complexity analysis
console.log('\n📈 Complexity Analysis:')
const complexitySizes = [100, 200, 400, 800]
const complexityTimes: number[] = []

for (const size of complexitySizes) {
	const busyTimes = generateBusyTimes(size, timeRange)
	const time = benchmark(
		`Size ${size}`,
		() => {
			const intervals = busyTimesToIntervals(busyTimes)
			return findFreeIntervals(intervals, 0, {
				start: 0,
				end: timeRange * 60 * 1000,
			})
		},
		50
	)
	complexityTimes.push(time)
}

// Check if it's O(n log n)
console.log('\nComplexity check (should be ~O(n log n)):')
for (let i = 1; i < complexityTimes.length; i++) {
	const sizeRatio = complexitySizes[i] / complexitySizes[i - 1]
	const timeRatio = complexityTimes[i] / complexityTimes[i - 1]
	const expectedRatio = sizeRatio * Math.log2(sizeRatio)
	console.log(
		`${complexitySizes[i - 1]} → ${complexitySizes[i]}: time ratio ${timeRatio.toFixed(2)}, expected ~${expectedRatio.toFixed(2)}`
	)
}

console.log('\n✅ Benchmark completed!')
