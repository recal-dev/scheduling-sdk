export interface TimeSlot {
	start: Date
	end: Date
}

export interface BusyTime {
	start: Date
	end: Date
}

export interface SchedulingOptions {
	/**
	 * Duration of each slot in minutes
	 */
	slotDuration: number

	/**
	 * Padding in minutes to add before and after busy times
	 * @default 0
	 */
	padding?: number

	/**
	 * Split interval for slots in minutes
	 * For example, if slotDuration is 30 and slotSplit is 15,
	 * it will generate slots like 14:00-14:30, 14:15-14:45
	 * @default slotDuration (no splitting)
	 */
	slotSplit?: number

	/**
	 * Offset in minutes from standard time boundaries
	 * For example, offset of 5 would start slots at :05, :35 instead of :00, :30
	 * @default 0
	 */
	offset?: number

	/**
	 * Maximum allowed overlapping busy times before considering a time slot unavailable
	 * For example, maxOverlaps of 1 means a time is available if ≤1 busy times overlap it
	 * @default undefined (traditional behavior: any overlap makes time unavailable)
	 */
	maxOverlaps?: number
}
