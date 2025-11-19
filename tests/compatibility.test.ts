/**
 * Module Compatibility Tests
 *
 * This test suite verifies that the SDK works correctly in both ESM and CommonJS environments.
 * It ensures compatibility with modern ESM projects as well as CommonJS-based frameworks like NestJS.
 *
 * PREREQUISITES:
 * - The project must be built before running these tests: `bun run build`
 * - Tests verify the compiled output in the `dist/` directory
 *
 * What this test suite validates:
 * 1. ESM Bundle (dist/index.js)
 *    - All exports are available and functional
 *    - Classes can be instantiated and used
 *    - TypeScript definitions (.d.ts) exist and are valid
 *
 * 2. CommonJS Bundle (dist/index.cjs)
 *    - All exports are available via require()
 *    - Classes can be instantiated and used
 *    - TypeScript definitions (.d.cts) exist and are valid
 *
 * 3. Cross-Module Consistency
 *    - Both bundles export identical APIs
 *    - Both bundles produce identical results for the same inputs
 *    - Ensures behavioral parity between ESM and CJS
 *
 * If these tests fail, run `bun run build` first to generate the distribution files.
 *
 * NOTE: This file intentionally uses CommonJS require() to test CJS compatibility.
 */

import { beforeAll, describe, expect, it } from 'bun:test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

describe('Module Compatibility', () => {
	const distPath = join(import.meta.dir, '../dist')

	beforeAll(() => {
		// Ensure dist files exist before running tests
		const requiredFiles = ['index.js', 'index.cjs', 'index.d.ts', 'index.d.cts']
		const missingFiles = requiredFiles.filter(file => !existsSync(join(distPath, file)))

		if (missingFiles.length > 0) {
			throw new Error(
				`Build artifacts missing: ${missingFiles.join(', ')}. Run 'bun run build' before testing.`
			)
		}
	})

	describe('ESM imports', () => {
		it('should import ESM bundle successfully', async () => {
			const esmPath = join(distPath, 'index.js')
			const module = await import(esmPath)

			expect(module.Scheduler).toBeDefined()
			expect(typeof module.Scheduler).toBe('function')
			expect(module.AvailabilityScheduler).toBeDefined()
			expect(typeof module.AvailabilityScheduler).toBe('function')
		})

		it('should export all expected ESM exports', async () => {
			const esmPath = join(distPath, 'index.js')
			const module = await import(esmPath)

			// Classes
			expect(module.Scheduler).toBeDefined()
			expect(module.AvailabilityScheduler).toBeDefined()

			// Helper functions
			expect(module.weeklyAvailabilityToBusyTimes).toBeDefined()
			expect(module.isOverlapping).toBeDefined()
			expect(module.mergeBusyTimes).toBeDefined()
			expect(module.hasOverlap).toBeDefined()
			expect(module.isSlotAvailable).toBeDefined()
			expect(module.applyPadding).toBeDefined()
			expect(module.filterAvailableSlots).toBeDefined()
			expect(module.calculateFirstSlotStart).toBeDefined()
			expect(module.generateSlots).toBeDefined()
			expect(module.alignToInterval).toBeDefined()
			expect(module.calculateMinutesFromHour).toBeDefined()
			expect(module.findNextSlotBoundary).toBeDefined()
			expect(module.getTimeWithinDay).toBeDefined()
			expect(module.addMinutes).toBeDefined()
			expect(module.endOfDay).toBeDefined()
			expect(module.isSameDay).toBeDefined()
			expect(module.minutesBetween).toBeDefined()
			expect(module.startOfDay).toBeDefined()
			expect(module.subtractMinutes).toBeDefined()

			// Constants
			expect(module.weekendDays).toBeDefined()
			expect(module.workDays).toBeDefined()
			expect(module.HOURS_PER_DAY).toBeDefined()
			expect(module.MINUTES_PER_HOUR).toBeDefined()
			expect(module.MS_PER_DAY).toBeDefined()
			expect(module.MS_PER_HOUR).toBeDefined()
			expect(module.MS_PER_MINUTE).toBeDefined()

			// Validators
			expect(module.validateWeeklyAvailability).toBeDefined()
			expect(module.validateDuration).toBeDefined()
			expect(module.validateOffset).toBeDefined()
			expect(module.validateOptions).toBeDefined()
			expect(module.validatePadding).toBeDefined()
			expect(module.validateSplit).toBeDefined()
			expect(module.validateTimeRange).toBeDefined()
		})

		it('should create functional Scheduler instance from ESM', async () => {
			const esmPath = join(distPath, 'index.js')
			const { Scheduler } = await import(esmPath)

			const scheduler = new Scheduler()
			expect(scheduler).toBeInstanceOf(Scheduler)
			expect(scheduler.getBusyTimes()).toEqual([])
		})

		it('should create functional AvailabilityScheduler instance from ESM', async () => {
			const esmPath = join(distPath, 'index.js')
			const { AvailabilityScheduler } = await import(esmPath)

			const availability = {
				schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
			}
			const scheduler = new AvailabilityScheduler(availability, 'UTC')
			expect(scheduler).toBeInstanceOf(AvailabilityScheduler)
			expect(scheduler.getAvailability()).toEqual(availability)
		})
	})

	describe('CommonJS imports', () => {
		it('should import CJS bundle successfully', () => {
			const cjsPath = join(distPath, 'index.cjs')
			// biome-ignore lint/style/noCommonJs: Testing CommonJS compatibility requires using require()
			const module = require(cjsPath)

			expect(module.Scheduler).toBeDefined()
			expect(typeof module.Scheduler).toBe('function')
			expect(module.AvailabilityScheduler).toBeDefined()
			expect(typeof module.AvailabilityScheduler).toBe('function')
		})

		it('should export all expected CJS exports', () => {
			const cjsPath = join(distPath, 'index.cjs')
			// biome-ignore lint/style/noCommonJs: Testing CommonJS compatibility requires using require()
			const module = require(cjsPath)

			// Classes
			expect(module.Scheduler).toBeDefined()
			expect(module.AvailabilityScheduler).toBeDefined()

			// Helper functions
			expect(module.weeklyAvailabilityToBusyTimes).toBeDefined()
			expect(module.isOverlapping).toBeDefined()
			expect(module.mergeBusyTimes).toBeDefined()
			expect(module.hasOverlap).toBeDefined()
			expect(module.isSlotAvailable).toBeDefined()
			expect(module.applyPadding).toBeDefined()
			expect(module.filterAvailableSlots).toBeDefined()
			expect(module.calculateFirstSlotStart).toBeDefined()
			expect(module.generateSlots).toBeDefined()
			expect(module.alignToInterval).toBeDefined()
			expect(module.calculateMinutesFromHour).toBeDefined()
			expect(module.findNextSlotBoundary).toBeDefined()
			expect(module.getTimeWithinDay).toBeDefined()
			expect(module.addMinutes).toBeDefined()
			expect(module.endOfDay).toBeDefined()
			expect(module.isSameDay).toBeDefined()
			expect(module.minutesBetween).toBeDefined()
			expect(module.startOfDay).toBeDefined()
			expect(module.subtractMinutes).toBeDefined()

			// Constants
			expect(module.weekendDays).toBeDefined()
			expect(module.workDays).toBeDefined()
			expect(module.HOURS_PER_DAY).toBeDefined()
			expect(module.MINUTES_PER_HOUR).toBeDefined()
			expect(module.MS_PER_DAY).toBeDefined()
			expect(module.MS_PER_HOUR).toBeDefined()
			expect(module.MS_PER_MINUTE).toBeDefined()

			// Validators
			expect(module.validateWeeklyAvailability).toBeDefined()
			expect(module.validateDuration).toBeDefined()
			expect(module.validateOffset).toBeDefined()
			expect(module.validateOptions).toBeDefined()
			expect(module.validatePadding).toBeDefined()
			expect(module.validateSplit).toBeDefined()
			expect(module.validateTimeRange).toBeDefined()
		})

		it('should create functional Scheduler instance from CJS', () => {
			const cjsPath = join(distPath, 'index.cjs')
			// biome-ignore lint/style/noCommonJs: Testing CommonJS compatibility requires using require()
			const { Scheduler } = require(cjsPath)

			const scheduler = new Scheduler()
			expect(scheduler).toBeInstanceOf(Scheduler)
			expect(scheduler.getBusyTimes()).toEqual([])
		})

		it('should create functional AvailabilityScheduler instance from CJS', () => {
			const cjsPath = join(distPath, 'index.cjs')
			// biome-ignore lint/style/noCommonJs: Testing CommonJS compatibility requires using require()
			const { AvailabilityScheduler } = require(cjsPath)

			const availability = {
				schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
			}
			const scheduler = new AvailabilityScheduler(availability, 'UTC')
			expect(scheduler).toBeInstanceOf(AvailabilityScheduler)
			expect(scheduler.getAvailability()).toEqual(availability)
		})
	})

	describe('Cross-module consistency', () => {
		it('should have identical exports between ESM and CJS', async () => {
			const esmPath = join(distPath, 'index.js')
			const cjsPath = join(distPath, 'index.cjs')

			const esmModule = await import(esmPath)
			// biome-ignore lint/style/noCommonJs: Testing CommonJS compatibility requires using require()
			const cjsModule = require(cjsPath)

			const esmKeys = Object.keys(esmModule).filter(key => key !== 'default').sort()
			const cjsKeys = Object.keys(cjsModule).sort()

			expect(esmKeys).toEqual(cjsKeys)
		})

		it('should produce same results from ESM and CJS Scheduler', async () => {
			const esmPath = join(distPath, 'index.js')
			const cjsPath = join(distPath, 'index.cjs')

			const { Scheduler: ESMScheduler } = await import(esmPath)
			// biome-ignore lint/style/noCommonJs: Testing CommonJS compatibility requires using require()
			const { Scheduler: CJSScheduler } = require(cjsPath)

			const busyTimes = [
				{ start: new Date('2024-01-01T10:00:00Z'), end: new Date('2024-01-01T11:00:00Z') },
			]

			const esmScheduler = new ESMScheduler(busyTimes)
			const cjsScheduler = new CJSScheduler(busyTimes)

			const startTime = new Date('2024-01-01T09:00:00Z')
			const endTime = new Date('2024-01-01T17:00:00Z')
			const options = { slotDuration: 60 }

			const esmSlots = esmScheduler.findAvailableSlots(startTime, endTime, options)
			const cjsSlots = cjsScheduler.findAvailableSlots(startTime, endTime, options)

			expect(esmSlots.length).toBe(cjsSlots.length)
			expect(esmSlots).toEqual(cjsSlots)
		})

		it('should produce same results from ESM and CJS AvailabilityScheduler', async () => {
			const esmPath = join(distPath, 'index.js')
			const cjsPath = join(distPath, 'index.cjs')

			const { AvailabilityScheduler: ESMScheduler } = await import(esmPath)
			// biome-ignore lint/style/noCommonJs: Testing CommonJS compatibility requires using require()
			const { AvailabilityScheduler: CJSScheduler } = require(cjsPath)

			const availability = {
				schedules: [{ days: ['monday'], start: '09:00', end: '17:00' }],
			}

			const esmScheduler = new ESMScheduler(availability, 'UTC')
			const cjsScheduler = new CJSScheduler(availability, 'UTC')

			const startTime = new Date('2024-01-01T08:00:00Z') // Monday
			const endTime = new Date('2024-01-01T18:00:00Z')
			const options = { slotDuration: 60 }

			const esmSlots = esmScheduler.findAvailableSlots(startTime, endTime, options)
			const cjsSlots = cjsScheduler.findAvailableSlots(startTime, endTime, options)

			expect(esmSlots.length).toBe(cjsSlots.length)
			expect(esmSlots).toEqual(cjsSlots)
		})
	})

	describe('TypeScript definitions', () => {
		it('should have valid and parseable ESM type declarations', async () => {
			const { readFileSync } = await import('node:fs')

			const dtsPath = join(distPath, 'index.d.ts')
			expect(existsSync(dtsPath)).toBe(true)

			const content = readFileSync(dtsPath, 'utf-8')

			// Validate it exports main classes and types
			const requiredExports = [
				'AvailabilityScheduler',
				'Scheduler',
				'BusyTime',
				'TimeSlot',
				'SchedulingOptions',
				'WeeklyAvailability',
			]

			for (const exportName of requiredExports) {
				expect(content).toContain(exportName)
			}

			// Validate it has proper TypeScript syntax
			expect(content).toMatch(/export\s+{/)
			expect(content).toMatch(/export\s+type/)

			// Should not have JavaScript code (declarations only)
			expect(content).not.toContain('function(')
			expect(content).not.toContain('=>')
		})

		it('should have valid CJS type declarations matching ESM', async () => {
			const { readFileSync } = await import('node:fs')

			const dctsPath = join(distPath, 'index.d.cts')
			expect(existsSync(dctsPath)).toBe(true)

			const ctsContent = readFileSync(dctsPath, 'utf-8')

			// Both should export the same core types
			const coreExports = [
				'Scheduler',
				'AvailabilityScheduler',
				'BusyTime',
				'TimeSlot',
				'SchedulingOptions',
			]

			for (const exportName of coreExports) {
				expect(ctsContent).toContain(exportName)
			}

			// Should be a proper declaration file
			expect(ctsContent).toMatch(/export\s+{/)
			expect(ctsContent.split('\n').length).toBeGreaterThan(10)
		})
	})
})
