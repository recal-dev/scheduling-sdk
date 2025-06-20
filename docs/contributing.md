# Contributing Guide

Thank you for your interest in contributing to the Scheduling SDK! This guide will help you get set up for development and understand our contribution process.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing Guidelines](#testing-guidelines)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Development Setup

### Prerequisites

- **Bun**: v1.0+ (recommended runtime)
- **Node.js**: v18+ (alternative runtime)
- **TypeScript**: v5+ (peer dependency)
- **Git**: Latest version

### Installation

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/scheduling-sdk.git
   cd scheduling-sdk
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Verify Setup**
   ```bash
   bun run build
   bun test
   bun run typecheck
   bun run lint
   ```

### Development Commands

```bash
# Development mode with file watching
bun run dev

# Build for distribution
bun run build

# Run tests
bun test

# Run tests in watch mode
bun test --watch

# Type checking
bun run typecheck

# Linting
bun run lint

# Code formatting
bun run prettier

# Pre-publish checks
bun run prepublishOnly
```

## Project Structure

```
scheduling-sdk/
├── src/                    # Source code
│   ├── core/              # Main Scheduler class
│   ├── helpers/           # Utility functions by domain
│   │   ├── busy-time/     # Busy time operations
│   │   ├── slot/          # Slot generation and filtering
│   │   └── time/          # Date/time utilities
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Shared constants and utilities
│   ├── validators/        # Input validation functions
│   └── index.ts           # Main entry point
├── tests/                 # Test files (mirrors src structure)
├── docs/                  # Documentation
├── dist/                  # Build output (generated)
└── package.json           # Project configuration
```

### Module Organization

- **`src/core/`**: Core scheduling logic and main API
- **`src/helpers/`**: Domain-specific helper functions
- **`src/types/`**: TypeScript interfaces and type definitions
- **`src/validators/`**: Input validation and error handling
- **`src/utils/`**: Shared constants and utility functions

## Development Workflow

### 1. Feature Development

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement Feature**
   - Write code following existing patterns
   - Add/update types as needed
   - Include input validation

3. **Write Tests**
   - Unit tests for new functions
   - Integration tests for complex features
   - Edge case testing

4. **Update Documentation**
   - API documentation for new public methods
   - Usage examples for new features
   - Update README if needed

### 2. Bug Fixes

1. **Create Bug Fix Branch**
   ```bash
   git checkout -b fix/bug-description
   ```

2. **Reproduce Bug**
   - Create failing test case
   - Understand root cause

3. **Implement Fix**
   - Fix the issue
   - Ensure tests pass
   - Verify no regression

4. **Add Regression Test**
   - Ensure bug won't reoccur
   - Test edge cases

## Testing Guidelines

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from 'bun:test'

describe('Feature Name', () => {
    describe('method name', () => {
        it('should handle basic case', () => {
            // Arrange
            const input = setupTestData()
            
            // Act
            const result = methodUnderTest(input)
            
            // Assert
            expect(result).toEqual(expectedOutput)
        })

        it('should handle edge case', () => {
            // Test edge cases
        })

        it('should throw on invalid input', () => {
            expect(() => methodUnderTest(invalidInput)).toThrow()
        })
    })
})
```

### Test Categories

#### Unit Tests
- Test individual functions in isolation
- Mock dependencies where appropriate
- Focus on edge cases and error conditions

#### Integration Tests
- Test feature workflows end-to-end
- Use real dependencies
- Verify complex interactions

#### Performance Tests
- Benchmark critical paths
- Ensure performance targets are met
- Test with realistic data sizes

### Test Data

Use consistent test data patterns:

```typescript
// Standard test dates
const testDate = new Date('2024-01-15T09:00:00Z')
const workDayStart = new Date('2024-01-15T09:00:00Z')
const workDayEnd = new Date('2024-01-15T17:00:00Z')

// Standard test options
const basicOptions = {
    slotDuration: 60,
    slotSplit: 60,
    padding: 0,
    offset: 0
}
```

### Coverage Requirements

- **Line Coverage**: 95%+
- **Branch Coverage**: 90%+
- **Function Coverage**: 100%

Run coverage with:
```bash
bun test --coverage
```

## Code Style

### TypeScript Guidelines

```typescript
// ✅ Use explicit interfaces
interface SchedulingOptions {
    slotDuration: number
    slotSplit?: number
}

// ✅ Use proper typing
function generateSlots(options: SchedulingOptions): TimeSlot[] {
    // implementation
}

// ✅ Use readonly for immutable data
interface TimeSlot {
    readonly start: Date
    readonly end: Date
}

// ❌ Avoid any types
function badFunction(data: any): any {
    return data
}
```

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `slot-generator.ts`)
- **Functions**: `camelCase` (e.g., `generateSlots`)
- **Classes**: `PascalCase` (e.g., `Scheduler`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MS_PER_MINUTE`)
- **Types/Interfaces**: `PascalCase` (e.g., `TimeSlot`)

### Code Organization

```typescript
// File structure order:
// 1. Imports
import type { TimeSlot } from '../types/scheduling.types.ts'
import { MS_PER_MINUTE } from '../utils/constants.ts'

// 2. Type definitions (if any)
interface LocalOptions {
    // ...
}

// 3. Main implementation
export function mainFunction() {
    // ...
}

// 4. Helper functions (non-exported)
function helperFunction() {
    // ...
}
```

### Error Handling

```typescript
// ✅ Provide descriptive error messages
if (duration <= 0) {
    throw new Error('Slot duration must be a positive number')
}

// ✅ Validate at function boundaries
export function validateTimeRange(start: Date, end: Date): void {
    if (start >= end) {
        throw new Error('Start time must be before end time')
    }
}

// ✅ Use appropriate error types
class ValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ValidationError'
    }
}
```

### Performance Considerations

```typescript
// ✅ Prefer immutable operations where possible
const newArray = [...existingArray, newItem]

// ✅ Use efficient algorithms
// Sort once, then process
const sortedBusyTimes = busyTimes.sort((a, b) => a.start.getTime() - b.start.getTime())

// ✅ Avoid unnecessary object creation in loops
for (const item of items) {
    // Reuse variables where possible
}
```

## Pull Request Process

### 1. Before Submitting

- [ ] All tests pass
- [ ] Code is formatted (`bun run prettier`)
- [ ] Linting passes (`bun run lint`)
- [ ] Type checking passes (`bun run typecheck`)
- [ ] Documentation is updated
- [ ] CHANGELOG is updated (for features)

### 2. PR Description

Use this template:

```markdown
## Description
Brief description of the change and why it's needed.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] New tests added for new functionality
- [ ] All existing tests pass
- [ ] Edge cases covered

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or breaking changes documented)
```

### 3. Review Process

1. **Automated Checks**: CI must pass
2. **Code Review**: At least one maintainer approval
3. **Manual Testing**: Verify functionality works as expected
4. **Documentation Review**: Ensure docs are accurate and complete

### 4. Merge Requirements

- All CI checks pass
- At least one approving review
- No requested changes outstanding
- Branch is up to date with main

## Issue Reporting

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Create scheduler with '...'
2. Call method '...'
3. See error

**Expected behavior**
What you expected to happen.

**Code example**
```typescript
// Minimal reproduction case
```

**Environment:**
- Bun version: [e.g. 1.0.15]
- Node version: [e.g. 18.17.0]
- OS: [e.g. macOS 13.4]
- SDK version: [e.g. 1.2.3]
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've considered.

**Additional context**
Any other context about the feature request.

**Code example**
```typescript
// Example of how the feature might be used
```
```

### Security Issues

For security vulnerabilities:
1. **Do not** create a public issue
2. Email security concerns to: [security-email]
3. Include detailed reproduction steps
4. Allow time for responsible disclosure

## Development Tips

### Debugging

```typescript
// Use console.log sparingly in production code
// Prefer proper error messages and validation

// For debugging during development:
console.log('Debug: slot count', slots.length)
console.time('Performance check')
// ... code to measure
console.timeEnd('Performance check')
```

### Testing New Features

```bash
# Test your changes against real scenarios
bun run build
cd test-project
npm link ../scheduling-sdk
# Test integration
```

### Documentation

- Keep documentation in sync with code changes
- Include practical examples
- Update type definitions
- Consider performance implications

## Getting Help

- **Questions**: Create a discussion or issue
- **Real-time help**: [Community channel if available]
- **Documentation**: Check existing docs first
- **Examples**: Look at test files for usage patterns

Thank you for contributing to the Scheduling SDK! Your contributions help make scheduling easier for developers everywhere.