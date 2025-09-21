# TELE_TAMI Project Context

## Purpose
Voice-based AI assistant for commodity trading lead collection and validation.

## Architecture
- **Frontend**: Next.js with React components
- **Voice**: Hume AI EVI integration
- **State**: React Context + localStorage
- **Styling**: Tailwind CSS with Radix UI components
- **Testing**: Jest with TypeScript

## Key Components
- `lib/conversationState.ts`: Manages conversation flow and closing triggers
- `lib/strategyHarness.ts`: A-E experiment strategy management
- `lib/incrementalJson.ts`: Fragment-based JSON accumulation
- `components/SessionTimers.tsx`: Timeout and inactivity management
- `utils/telemetry.ts`: Event tracking and metrics

## Development Guidelines
1. Maintain minimal, surgical changes
2. Preserve backward compatibility
3. Use TypeScript for type safety
4. Follow existing component patterns
5. Add telemetry for new features
6. Test conversation logic thoroughly

## Common Patterns
- Use `emit()` for telemetry events
- Store temporary state in localStorage
- Implement cooldowns for user-facing features
- Use environment flags for experiments
- Follow accessibility best practices
