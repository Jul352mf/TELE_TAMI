# Testing Guide

## Test Structure
Follow existing patterns in `__tests__/` directory:

1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: Component interactions
3. **E2E Tests**: Full conversation flows

## Key Test Areas
- Conversation state transitions
- Strategy harness configurations
- Closing trigger detection
- Telemetry event emission
- Accessibility compliance

## Test Patterns
```typescript
describe('Component Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should handle expected behavior', () => {
    // Test implementation
  });

  it('should handle edge cases', () => {
    // Edge case testing
  });
});
```

## Mock Patterns
```typescript
// Mock environment variables
process.env.NEXT_PUBLIC_FEATURE = 'test-value';

// Mock localStorage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockStorage });
```
