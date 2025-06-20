# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript SDK for scheduling functionality, brought to you by Recal. It uses Bun as the runtime and build tool.

**Package**: `scheduling-sdk`  
**Version**: 0.1.2  
**License**: MIT  
**Repository**: [github.com/recal-dev/scheduling-sdk](https://github.com/recal-dev/scheduling-sdk)

## Common Commands

### Development
- `bun install` - Install dependencies
- `bun run dev` - Run in development mode with file watching
- `bun run build` - Build the SDK for distribution (outputs to `dist/`)

### Testing & Quality
- `bun test` - Run tests
- `bun test:coverage` - Run tests with coverage reporting (lcov + text)
- `bun run typecheck` - Type check without emitting files
- `bun run lint` - Run ESLint on src and tests directories
- `bun run prettier` - Format code with Prettier

### Publishing
- `bun run prepublishOnly` - Runs build and tests before publishing

## Architecture

This is a library/SDK project configured for distribution as an NPM package:
- **Entry point**: `src/index.ts`
- **Build output**: `dist/` directory with both JS and TypeScript definitions
- **Module system**: ESM modules only (`"type": "module"`)
- **Runtime**: Bun (fast JavaScript runtime)

### Source Structure
- `src/core/` - Core scheduling functionality
- `src/availability/` - Availability management features
- `src/types/` - TypeScript type definitions
- `src/validators/` - Input validation logic
- `src/helpers/` - Utility functions for:
  - `availability/` - Availability conversions
  - `busy-time/` - Busy time management (merge, overlap, padding)
  - `slot/` - Slot generation and filtering
  - `time/` - Time alignment and date math
- `src/utils/` - General utilities and constants

## TypeScript Configuration

The project uses strict TypeScript configuration with:
- Target: ESNext
- Module resolution: Bundler mode
- Strict mode enabled
- Support for `.ts` extensions in imports
- No emit mode for type checking

## Testing

Tests should be placed in the `tests/` directory. The project is configured to use Bun's built-in test runner with a setup file at `tests/setup.ts` (if needed).

## Build Process

The build command compiles TypeScript to JavaScript targeting Node.js environment. The SDK exports both CommonJS and ESM formats with TypeScript definitions included.