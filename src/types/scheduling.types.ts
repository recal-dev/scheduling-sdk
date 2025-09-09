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

	/**
	 * Optional timezone identifier (IANA string, e.g., "America/New_York") used for daily time window filtering
	 * If provided together with earliestTime/latestTime, generated slots will be filtered to that daily range.
	 */
	timezone?: string

	/**
	 * Optional earliest local time within a day when slots may start (HH:mm or minutes since midnight)
	 * Requires timezone to be set when used.
	 */
	earliestTime?: string | number

	/**
	 * Optional latest local time within a day when slots may start (HH:mm or minutes since midnight).
	 * Requires timezone to be set when used. May be set to 24:00 (or 1440) to indicate end of day.
	 */
	latestTime?: string | number
}
