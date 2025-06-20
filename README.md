# Scheduling SDK 📆

[![npm version](https://badge.fury.io/js/scheduling-sdk.svg)](https://badge.fury.io/js/scheduling-sdk)
[![Tests](https://github.com/recal-dev/scheduling-sdk/workflows/Tests/badge.svg)](https://github.com/recal-dev/scheduling-sdk/actions)
[![Test Coverage](https://codecov.io/gh/recal-dev/scheduling-sdk/branch/main/graph/badge.svg)](https://codecov.io/gh/recal-dev/scheduling-sdk)

**Brought to you by [Recal](https://recal.com)** 🚀

A fast, modular TypeScript SDK for finding available time slots with **exceptional developer experience** - intuitive APIs, comprehensive TypeScript support, and extensive documentation.

## Features ✨

- **🎯 Developer-First Design**: Intuitive APIs that feel natural to use
- **🔒 Full TypeScript Support**: Complete type safety with excellent IntelliSense
- **📖 Extensive Documentation**: In-depth guides, examples, and API references
- **⚡ Blazing Fast Performance**: Optimized algorithms for handling large datasets
- **🔧 Flexible Configuration**: Customizable slot duration, padding, splitting, and offset
- **📅 Weekly Availability Patterns**: Define recurring weekly schedules with automatic break management
- **🏗️ Modular Architecture**: Clean separation of concerns for maintainability
- **🧪 98%+ Test Coverage**: Comprehensive testing with edge case handling

> **Note**
> The SDK is fully written in TypeScript (see GitHub => 100% TypeScript) and uses Bun as the build and test tool. It requires TypeScript 5.0 or later as a peer dependency. While we use Bun for development, the compiled SDK is compatible with any JavaScript runtime, including Node.js, Deno, and modern browsers with ESM support.

## Quick Start 🚀

```bash
# Install the SDK
npm install scheduling-sdk
# or
bun add scheduling-sdk
```

**Zero configuration required** - start scheduling in seconds with **full TypeScript intellisense**! 🎉

## Basic Usage

### Standard Scheduling

**Simple, clean API with complete type safety** ✨

```typescript
import { createScheduler } from 'scheduling-sdk'

const scheduler = createScheduler([
    {
        start: new Date('2024-01-15T09:00:00Z'),
        end: new Date('2024-01-15T10:00:00Z'),
    },
])

const availableSlots = scheduler.findAvailableSlots(
    new Date('2024-01-15T08:00:00Z'),
    new Date('2024-01-15T17:00:00Z'),
    {
        slotDuration: 30, // 30-minute slots
        padding: 15, // 15-minute buffer around busy times
        slotSplit: 15, // Generate overlapping slots every 15 minutes
        offset: 0, // No offset from hour boundaries
    }
)
```

### Managing Busy Times

**Flexible, type-safe methods for every use case** 🔧

```typescript
import { createScheduler } from 'scheduling-sdk'

const scheduler = createScheduler()

// Add a single busy time
scheduler.addBusyTime({
    start: new Date('2024-01-15T14:00:00Z'),
    end: new Date('2024-01-15T15:00:00Z')
})

// Add multiple busy times at once
scheduler.addBusyTimes([
    {
        start: new Date('2024-01-15T10:00:00Z'),
        end: new Date('2024-01-15T11:00:00Z')
    },
    {
        start: new Date('2024-01-15T16:00:00Z'),
        end: new Date('2024-01-15T17:00:00Z')
    }
])

// Clear all busy times
scheduler.clearBusyTimes()

// Get current busy times
const currentBusyTimes = scheduler.getBusyTimes()
```

### Weekly Availability Scheduling

**Business hours made easy** 📅

```typescript
import { AvailabilityScheduler } from 'scheduling-sdk'

// Define business hours with lunch breaks
const availability = {
    schedules: [
        { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '09:00', end: '12:00' },
        { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], start: '13:00', end: '17:00' },
        { days: ['saturday'], start: '10:00', end: '14:00' },
    ],
}

const scheduler = new AvailabilityScheduler(availability)

// Add multiple busy times (meetings, appointments, etc.)
scheduler.addBusyTimes([
    {
        start: new Date('2024-01-15T14:00:00Z'),
        end: new Date('2024-01-15T15:00:00Z')
    },
    {
        start: new Date('2024-01-16T10:00:00Z'),
        end: new Date('2024-01-16T11:00:00Z')
    }
])

// Find available slots within business hours
const slots = scheduler.findAvailableSlots(new Date('2024-01-15T08:00:00Z'), new Date('2024-01-15T18:00:00Z'), {
    slotDuration: 60,
})
```

## Documentation 📚

- **📖 [Getting Started](docs/getting-started.md)** - Installation and basic usage
- **📋 [API Reference](docs/api-reference.md)** - Complete API documentation
- **🧠 [Core Concepts](docs/core-concepts.md)** - Understanding scheduling concepts
- **⏰ [Availability API](docs/availability-api.md)** - Weekly availability patterns and scheduling
- **💡 [Examples](docs/examples.md)** - Practical usage examples
- **⚡ [Performance Guide](docs/performance.md)** - Optimization and benchmarks
- **🤝 [Contributing](docs/contributing.md)** - Development and contribution guidelines

## Development 💻

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build for production
bun run build

# Run tests
bun test

# Type checking
bun run typecheck
```

## Architecture 🏗️

The SDK is built with a modular architecture:

```
src/
├── types/              # TypeScript type definitions
├── helpers/            # Utility functions organized by domain
│   ├── time/           # Date/time calculations and alignments
│   ├── busy-time/      # Busy time operations (padding, merging, overlap)
│   ├── slot/           # Slot generation and filtering
│   └── availability/   # Weekly availability conversion
├── validators/         # Input validation functions
├── core/              # Main Scheduler class
├── availability/      # AvailabilityScheduler class
└── utils/             # Shared constants and utilities
```

## Performance ⚡

Optimized for speed with target performance:

- < 1ms for 100 busy times
- < 10ms for 1000 busy times
- < 100ms for 10000 busy times

See [Performance Guide](docs/performance.md) for detailed benchmarks.

## License

MIT

## Contributing 🤝

Please read our [Contributing Guide](docs/contributing.md) for development setup and contribution guidelines.

## Credits 👨‍💻

Engineering by [@tkoehlerlg](https://github.com/tkoehlerlg)
