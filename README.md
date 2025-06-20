# Scheduling SDK

A fast, modular TypeScript SDK for finding available time slots with configurable options like padding, duration, splitting, and offset.

## Features

- **Fast Performance**: Optimized algorithms for handling large datasets
- **Flexible Configuration**: Customizable slot duration, padding, splitting, and offset
- **TypeScript Support**: Full type safety and IntelliSense
- **Modular Architecture**: Clean separation of concerns for maintainability
- **Comprehensive Testing**: Extensive test coverage with edge case handling

## Quick Start

```bash
# Install dependencies
bun install

# Build the SDK
bun run build

# Run tests
bun test
```

## Basic Usage

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

## Documentation

- **[Getting Started](docs/getting-started.md)** - Installation and basic usage
- **[API Reference](docs/api-reference.md)** - Complete API documentation
- **[Core Concepts](docs/core-concepts.md)** - Understanding scheduling concepts
- **[Examples](docs/examples.md)** - Practical usage examples
- **[Performance Guide](docs/performance.md)** - Optimization and benchmarks
- **[Contributing](docs/contributing.md)** - Development and contribution guidelines

## Development

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

## Architecture

The SDK is built with a modular architecture:

```
src/
├── types/          # TypeScript type definitions
├── helpers/        # Utility functions organized by domain
│   ├── time/       # Date/time calculations and alignments
│   ├── busy-time/  # Busy time operations (padding, merging, overlap)
│   └── slot/       # Slot generation and filtering
├── validators/     # Input validation functions
├── core/          # Main Scheduler class
└── utils/         # Shared constants and utilities
```

## Performance

Optimized for speed with target performance:

- < 1ms for 100 busy times
- < 10ms for 1000 busy times
- < 100ms for 10000 busy times

See [Performance Guide](docs/performance.md) for detailed benchmarks.

## License

MIT

## Contributing

Please read our [Contributing Guide](docs/contributing.md) for development setup and contribution guidelines.
